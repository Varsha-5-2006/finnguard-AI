import { Response } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest, logAuditEvent } from '../middleware/auth.js';
import { FraudDetectionEngine } from '../services/fraudEngine.js';
import { generateFraudExplanation } from '../services/geminiService.js';
import { Transaction, FraudAlert } from '../types/index.js';

export class TransactionController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        search = '',
        status,
        riskLevel,
        paymentMethod,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        page = '1',
        limit = '15',
      } = req.query as Record<string, string>;

      let items = [...db.getTransactions()];

      // Search filter
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        items = items.filter(t =>
          t.transactionId.toLowerCase().includes(query) ||
          t.customerId.toLowerCase().includes(query) ||
          t.customerName.toLowerCase().includes(query) ||
          t.merchant.toLowerCase().includes(query) ||
          t.location.city.toLowerCase().includes(query) ||
          t.location.country.toLowerCase().includes(query)
        );
      }

      // Status filter
      if (status && status !== 'all') {
        items = items.filter(t => t.status === status);
      }

      // Risk level filter
      if (riskLevel && riskLevel !== 'all') {
        items = items.filter(t => t.riskLevel === riskLevel);
      }

      // Payment method filter
      if (paymentMethod && paymentMethod !== 'all') {
        items = items.filter(t => t.paymentMethod === paymentMethod);
      }

      // Amount filter
      if (minAmount) {
        const min = parseFloat(minAmount);
        if (!isNaN(min)) items = items.filter(t => t.amount >= min);
      }
      if (maxAmount) {
        const max = parseFloat(maxAmount);
        if (!isNaN(max)) items = items.filter(t => t.amount <= max);
      }

      // Date range filter
      if (startDate) {
        const start = new Date(startDate).getTime();
        items = items.filter(t => new Date(t.timestamp).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        items = items.filter(t => new Date(t.timestamp).getTime() <= end);
      }

      // Compute total volume for filtered set
      const totalFilteredCount = items.length;
      const totalFilteredVolume = items.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Sorting
      items.sort((a, b) => {
        let valA: any = a[sortBy as keyof Transaction];
        let valB: any = b[sortBy as keyof Transaction];

        if (sortBy === 'timestamp') {
          valA = new Date(a.timestamp).getTime();
          valB = new Date(b.timestamp).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Pagination
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedItems = items.slice(startIndex, startIndex + limitNum);

      res.json({
        transactions: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalFilteredCount,
          totalPages: Math.ceil(totalFilteredCount / limitNum),
        },
        summary: {
          totalCount: totalFilteredCount,
          totalVolume: totalFilteredVolume,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve transactions: ' + err.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = db.findTransactionById(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      // Fetch customer related recent transactions
      const customerHistory = db.getTransactions()
        .filter(t => t.customerId === transaction.customerId && t.id !== transaction.id)
        .slice(0, 5);

      // Fetch linked alert and case if present
      const linkedAlert = transaction.linkedAlertId ? db.findAlertById(transaction.linkedAlertId) : undefined;
      const linkedCase = transaction.linkedCaseId ? db.findCaseById(transaction.linkedCaseId) : undefined;

      res.json({
        transaction,
        customerHistory,
        linkedAlert,
        linkedCase,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve transaction details: ' + err.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        customerId,
        customerName,
        amount,
        currency = 'USD',
        merchant,
        merchantCategory = 'general',
        location,
        paymentMethod = 'credit_card',
        device,
        metadata,
      } = req.body;

      if (!customerId || !customerName || amount === undefined || !merchant) {
        res.status(400).json({ error: 'Missing required fields: customerId, customerName, amount, merchant.' });
        return;
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number.' });
        return;
      }

      const now = new Date();
      const txId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

      // Fetch customer recent transactions for velocity and baseline comparison
      const customerRecent = db.getTransactions().filter(t => t.customerId === customerId);

      // Fetch active detection rules & settings
      const rules = db.getRules();
      const settings = db.getSettings();

      // Evaluate fraud risk score
      const evalResult = FraudDetectionEngine.evaluate(
        {
          amount: numAmount,
          customerId,
          merchant,
          merchantCategory,
          location: location || { city: 'Unknown City', country: 'United States' },
          paymentMethod,
          timestamp: now.toISOString(),
          device,
          metadata,
        },
        customerRecent,
        rules,
        settings
      );

      const newTransaction: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        transactionId: txId,
        customerId,
        customerName,
        amount: numAmount,
        currency,
        timestamp: now.toISOString(),
        merchant,
        merchantCategory,
        location: location || { city: 'Unknown City', country: 'United States' },
        paymentMethod,
        status: evalResult.suggestedStatus,
        riskScore: evalResult.riskScore,
        riskLevel: evalResult.riskLevel,
        triggeredRules: evalResult.triggeredRules,
        riskReasons: evalResult.riskReasons,
        recommendedAction: evalResult.recommendedAction,
        reviewedOutcome: evalResult.riskLevel === 'low' ? 'legitimate' : 'pending',
        device,
        metadata,
        createdAt: now.toISOString(),
        createdBy: req.user?.id,
      };

      // Check if alert should be created automatically
      if (evalResult.riskScore >= settings.autoAlertThreshold) {
        const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
        const severity = evalResult.riskLevel === 'critical' ? 'critical' : 'high';

        const newAlert: FraudAlert = {
          id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          alertId,
          transactionId: newTransaction.id,
          transactionRef: {
            amount: newTransaction.amount,
            currency: newTransaction.currency,
            customerName: newTransaction.customerName,
            customerId: newTransaction.customerId,
            merchant: newTransaction.merchant,
            timestamp: newTransaction.timestamp,
          },
          riskScore: newTransaction.riskScore,
          severity,
          category: evalResult.triggeredRules[0]?.name || 'Suspicious Activity Outlier',
          triggeredRules: evalResult.triggeredRules,
          status: 'new',
          recommendedAction: evalResult.recommendedAction,
          notes: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        db.addAlert(newAlert);
        newTransaction.linkedAlertId = newAlert.id;

        // Create in-app notification
        db.addNotification({
          title: `${severity.toUpperCase()} Alert: ${newTransaction.transactionId}`,
          message: `${newTransaction.currency} ${newTransaction.amount.toLocaleString()} at ${newTransaction.merchant} scored ${newTransaction.riskScore}/100.`,
          type: 'alert',
          read: false,
          link: '/alerts',
        });
      }

      db.addTransaction(newTransaction);

      logAuditEvent(
        req,
        'INGEST_TRANSACTION',
        'transaction',
        newTransaction.id,
        `Ingested ${newTransaction.transactionId} ($${newTransaction.amount}). Risk: ${newTransaction.riskScore} (${newTransaction.riskLevel}).`
      );

      res.status(201).json({
        transaction: newTransaction,
        alertCreated: Boolean(newTransaction.linkedAlertId),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to process transaction: ' + err.message });
    }
  }

  public static async analyze(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { customerId = 'CUST-TEMP', amount, merchant, merchantCategory, location, paymentMethod, device, metadata } = req.body;

      if (!amount || !merchant) {
        res.status(400).json({ error: 'Amount and merchant are required for analysis' });
        return;
      }

      const numAmount = parseFloat(amount);
      const customerRecent = db.getTransactions().filter(t => t.customerId === customerId);
      const rules = db.getRules();
      const settings = db.getSettings();

      const evaluation = FraudDetectionEngine.evaluate(
        {
          amount: numAmount,
          customerId,
          merchant,
          merchantCategory: merchantCategory || 'general',
          location: location || { city: 'Sample City', country: 'United States' },
          paymentMethod: paymentMethod || 'credit_card',
          timestamp: new Date().toISOString(),
          device,
          metadata,
        },
        customerRecent,
        rules,
        settings
      );

      res.json({ analysis: evaluation });
    } catch (err: any) {
      res.status(500).json({ error: 'Analysis failed: ' + err.message });
    }
  }

  public static async simulate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { scenario = 'crypto_drain_ato' } = req.body;
      let simData: any;

      if (scenario === 'normal') {
        const smallMerchants = ['Whole Foods Market', 'Starbucks', 'Trader Joes', 'Uber', 'Target'];
        const chosen = smallMerchants[Math.floor(Math.random() * smallMerchants.length)];
        simData = {
          customerId: 'CUST-7740',
          customerName: 'Dr. Gregory House',
          amount: Math.round((15 + Math.random() * 85) * 100) / 100,
          currency: 'USD',
          merchant: chosen,
          merchantCategory: 'retail',
          location: { city: 'Princeton', country: 'United States', ipAddress: '68.39.12.88' },
          paymentMethod: 'credit_card',
          metadata: { historicalAverageAmount: 65, isSimulated: true },
        };
      } else if (scenario === 'velocity_spike') {
        simData = {
          customerId: 'CUST-8819',
          customerName: 'Alexander Hayes',
          amount: Math.round((1200 + Math.random() * 2500) * 100) / 100,
          currency: 'USD',
          merchant: 'QuickCash Wire Express',
          merchantCategory: 'wire_transfer',
          location: { city: 'Zurich', country: 'Switzerland', ipAddress: '185.220.101.5' },
          paymentMethod: 'wire_transfer',
          metadata: { failedAttemptsPrior: 2, isSimulated: true },
        };
      } else if (scenario === 'crypto_drain_ato') {
        simData = {
          customerId: 'CUST-8819',
          customerName: 'Alexander Hayes',
          amount: Math.round((12500 + Math.random() * 8000) * 100) / 100,
          currency: 'USD',
          merchant: 'Binance OTC Liquidity',
          merchantCategory: 'crypto',
          location: { city: 'Amsterdam', country: 'Netherlands', ipAddress: '185.220.101.99' },
          paymentMethod: 'wire_transfer',
          device: { deviceType: 'Linux Emulator', isVpn: true, isNewDevice: true },
          metadata: { hoursSincePasswordChange: 1.5, failedAttemptsPrior: 3, historicalAverageAmount: 350, isSimulated: true },
        };
      } else if (scenario === 'smurfing') {
        simData = {
          customerId: 'CUST-3104',
          customerName: 'Claire Tremblay',
          amount: 9800.00 + Math.floor(Math.random() * 150),
          currency: 'USD',
          merchant: 'Offshore Casino & Chips Club',
          merchantCategory: 'gambling',
          location: { city: 'Nassau', country: 'Bahamas', ipAddress: '190.21.44.11' },
          paymentMethod: 'credit_card',
          metadata: { historicalAverageAmount: 500, isSimulated: true },
        };
      } else {
        // Impossible travel
        simData = {
          customerId: 'CUST-1049',
          customerName: 'David K. Miller',
          amount: 2850.00,
          currency: 'USD',
          merchant: 'BestBuy Electronics Flagship',
          merchantCategory: 'electronics',
          location: { city: 'Singapore', country: 'Singapore', ipAddress: '202.166.4.2' },
          paymentMethod: 'credit_card',
          metadata: { historicalAverageAmount: 300, isSimulated: true },
        };
      }

      req.body = simData;
      await TransactionController.create(req, res);
    } catch (err: any) {
      res.status(500).json({ error: 'Simulation error: ' + err.message });
    }
  }

  public static async bulkImport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactions: rawTransactions } = req.body;

      if (!Array.isArray(rawTransactions) || rawTransactions.length === 0) {
        res.status(400).json({ error: 'Payload must contain a non-empty transactions array.' });
        return;
      }

      if (rawTransactions.length > 500) {
        res.status(400).json({ error: 'Maximum bulk import batch size is 500 transactions.' });
        return;
      }

      const existingIds = new Set(db.getTransactions().map(t => t.transactionId));
      const rules = db.getRules();
      const settings = db.getSettings();

      let importedCount = 0;
      let skippedDuplicates = 0;
      let alertCount = 0;
      const errors: Array<{ row: number; reason: string }> = [];

      for (let i = 0; i < rawTransactions.length; i++) {
        const item = rawTransactions[i];
        const rowNum = i + 1;

        if (!item.amount || isNaN(parseFloat(item.amount))) {
          errors.push({ row: rowNum, reason: 'Invalid or missing amount' });
          continue;
        }
        if (!item.merchant) {
          errors.push({ row: rowNum, reason: 'Missing merchant name' });
          continue;
        }

        const txId = item.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
        if (existingIds.has(txId)) {
          skippedDuplicates++;
          continue;
        }

        const numAmount = parseFloat(item.amount);
        const customerId = item.customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        const customerName = item.customerName || 'Anonymous Customer';
        const customerRecent = db.getTransactions().filter(t => t.customerId === customerId);

        const evalResult = FraudDetectionEngine.evaluate(
          {
            amount: numAmount,
            customerId,
            merchant: item.merchant,
            merchantCategory: item.merchantCategory || 'general',
            location: item.location || { city: item.city || 'Imported City', country: item.country || 'United States' },
            paymentMethod: item.paymentMethod || 'credit_card',
            timestamp: item.timestamp || new Date().toISOString(),
          },
          customerRecent,
          rules,
          settings
        );

        const newTx: Transaction = {
          id: `tx_imp_${Date.now()}_${i}`,
          transactionId: txId,
          customerId,
          customerName,
          amount: numAmount,
          currency: item.currency || 'USD',
          timestamp: item.timestamp || new Date().toISOString(),
          merchant: item.merchant,
          merchantCategory: item.merchantCategory || 'general',
          location: item.location || { city: item.city || 'Imported City', country: item.country || 'United States' },
          paymentMethod: item.paymentMethod || 'credit_card',
          status: evalResult.suggestedStatus,
          riskScore: evalResult.riskScore,
          riskLevel: evalResult.riskLevel,
          triggeredRules: evalResult.triggeredRules,
          riskReasons: evalResult.riskReasons,
          recommendedAction: evalResult.recommendedAction,
          reviewedOutcome: evalResult.riskLevel === 'low' ? 'legitimate' : 'pending',
          createdAt: new Date().toISOString(),
        };

        if (evalResult.riskScore >= settings.autoAlertThreshold) {
          const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
          const newAlert: FraudAlert = {
            id: `alt_imp_${Date.now()}_${i}`,
            alertId,
            transactionId: newTx.id,
            transactionRef: {
              amount: newTx.amount,
              currency: newTx.currency,
              customerName: newTx.customerName,
              customerId: newTx.customerId,
              merchant: newTx.merchant,
              timestamp: newTx.timestamp,
            },
            riskScore: newTx.riskScore,
            severity: evalResult.riskLevel === 'critical' ? 'critical' : 'high',
            category: evalResult.triggeredRules[0]?.name || 'Batch Imported Anomaly',
            triggeredRules: evalResult.triggeredRules,
            status: 'new',
            recommendedAction: evalResult.recommendedAction,
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          db.addAlert(newAlert);
          newTx.linkedAlertId = newAlert.id;
          alertCount++;
        }

        db.addTransaction(newTx);
        existingIds.add(txId);
        importedCount++;
      }

      logAuditEvent(
        req,
        'BULK_IMPORT_TRANSACTIONS',
        'transaction',
        `batch_${Date.now()}`,
        `Imported ${importedCount} transactions. Skipped ${skippedDuplicates} duplicates. Generated ${alertCount} alerts.`
      );

      res.json({
        summary: {
          importedCount,
          skippedDuplicates,
          alertCount,
          errorCount: errors.length,
        },
        errors,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Bulk import failed: ' + err.message });
    }
  }

  public static async exportCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const items = db.getTransactions();

      // Formula injection sanitizer (escape =, +, -, @, \t, \r)
      const sanitizeCell = (val: any): string => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }
        return `"${str}"`;
      };

      const headers = [
        'Transaction ID',
        'Customer ID',
        'Customer Name',
        'Amount',
        'Currency',
        'Timestamp',
        'Merchant',
        'Category',
        'City',
        'Country',
        'Payment Method',
        'Risk Score',
        'Risk Level',
        'Status',
        'Reviewed Outcome',
        'Triggered Rules',
      ];

      const rows = items.map(t => [
        sanitizeCell(t.transactionId),
        sanitizeCell(t.customerId),
        sanitizeCell(t.customerName),
        sanitizeCell(t.amount.toFixed(2)),
        sanitizeCell(t.currency),
        sanitizeCell(t.timestamp),
        sanitizeCell(t.merchant),
        sanitizeCell(t.merchantCategory),
        sanitizeCell(t.location.city),
        sanitizeCell(t.location.country),
        sanitizeCell(t.paymentMethod),
        sanitizeCell(t.riskScore),
        sanitizeCell(t.riskLevel),
        sanitizeCell(t.status),
        sanitizeCell(t.reviewedOutcome),
        sanitizeCell(t.triggeredRules.map(r => r.name).join('; ')),
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="finguard_transactions_${Date.now()}.csv"`);
      res.send(csvContent);

      logAuditEvent(
        req,
        'EXPORT_TRANSACTIONS_CSV',
        'compliance_report',
        'export_all',
        `Exported ${items.length} transactions as sanitized CSV.`
      );
    } catch (err: any) {
      res.status(500).json({ error: 'CSV Export failed: ' + err.message });
    }
  }

  public static async aiExplain(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = db.findTransactionById(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      const explanation = await generateFraudExplanation(transaction);

      // Cache explanation on transaction record
      db.updateTransaction(transaction.id, { aiExplanation: explanation.analysis });

      logAuditEvent(
        req,
        'GENERATE_AI_EXPLANATION',
        'transaction',
        transaction.id,
        `Generated AI fraud intelligence narrative for ${transaction.transactionId}.`
      );

      res.json(explanation);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate AI explanation: ' + err.message });
    }
  }
}
