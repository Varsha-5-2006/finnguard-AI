import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import {
  User,
  Transaction,
  FraudAlert,
  InvestigationCase,
  AuditEvent,
  Notification,
  DetectionRuleConfig,
  SystemSettings,
} from '../types/index.js';

interface DatabaseSchema {
  users: User[];
  transactions: Transaction[];
  alerts: FraudAlert[];
  cases: InvestigationCase[];
  auditEvents: AuditEvent[];
  notifications: Notification[];
  rules: DetectionRuleConfig[];
  settings: SystemSettings;
  version: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'finguard_db.json');

export class Database {
  private static instance: Database;
  private data!: DatabaseSchema;
  private isSaving = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private init(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Verify key collections exist
        if (!this.data.users || !this.data.transactions) {
          throw new Error('Database schema outdated or corrupted');
        }
      } catch (err) {
        console.warn('Failed to parse existing DB file, regenerating initial seed:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  public resetDemoData(): void {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    const defaultUsers: User[] = [
      {
        id: 'usr_admin_01',
        name: 'Sarah Jenkins',
        email: 'admin@finguard.ai',
        passwordHash,
        role: 'admin',
        title: 'VP of Financial Crime & Risk',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        status: 'active',
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_analyst_01',
        name: 'Marcus Vance',
        email: 'analyst@finguard.ai',
        passwordHash,
        role: 'analyst',
        title: 'Senior Fraud Investigator',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'active',
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'usr_comp_01',
        name: 'Elena Rostova',
        email: 'compliance@finguard.ai',
        passwordHash,
        role: 'compliance',
        title: 'Chief Compliance & AML Officer',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        status: 'active',
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        lastLogin: new Date(Date.now() - 40 * 60000).toISOString(),
      },
    ];

    const defaultRules: DetectionRuleConfig[] = [
      {
        id: 'rule_1',
        code: 'RULE_LARGE_AMOUNT',
        name: 'High-Value Outlier Transaction',
        description: 'Triggers when transaction amount exceeds $5,000 threshold or 3.5x customer historical baseline.',
        category: 'amount',
        weight: 25,
        isEnabled: true,
        thresholdValue: 5000,
        unit: 'USD',
      },
      {
        id: 'rule_2',
        code: 'RULE_VELOCITY',
        name: 'High-Frequency Velocity Spike',
        description: 'Triggers when 3 or more transactions occur within a 15-minute sliding time window.',
        category: 'velocity',
        weight: 30,
        isEnabled: true,
        thresholdValue: 3,
        unit: 'tx / 15m',
      },
      {
        id: 'rule_3',
        code: 'RULE_GEO_ANOMALY',
        name: 'Impossible Geolocation Travel Speed',
        description: 'Customer location changes countries faster than physical flight travel permits (< 3 hours).',
        category: 'location',
        weight: 30,
        isEnabled: true,
      },
      {
        id: 'rule_4',
        code: 'RULE_FAILED_ATTEMPTS',
        name: 'Pre-Transaction Authentication Failures',
        description: 'Detects 2 or more failed biometric, PIN, or CVV attempts immediately before transaction.',
        category: 'behavior',
        weight: 25,
        isEnabled: true,
        thresholdValue: 2,
        unit: 'attempts',
      },
      {
        id: 'rule_5',
        code: 'RULE_HIGH_RISK_MERCHANT',
        name: 'High-Risk Merchant Category',
        description: 'Monitors transactions to crypto exchanges, offshore casinos, or anonymous prepaid cards.',
        category: 'merchant',
        weight: 20,
        isEnabled: true,
      },
      {
        id: 'rule_6',
        code: 'RULE_RECENT_ACCOUNT_CHANGE',
        name: 'High-Value Transfer Post-Credential Reset',
        description: 'Password or 2FA altered less than 24 hours prior to a large fund transfer.',
        category: 'account',
        weight: 25,
        isEnabled: true,
        thresholdValue: 24,
        unit: 'hours',
      },
      {
        id: 'rule_7',
        code: 'RULE_STRUCTURING',
        name: 'Currency Structuring (Smurfing)',
        description: 'Amounts deliberately positioned just below the $10,000 regulatory reporting threshold ($9k-$9.99k).',
        category: 'amount',
        weight: 20,
        isEnabled: true,
      },
      {
        id: 'rule_8',
        code: 'RULE_ANOMALOUS_DEVICE',
        name: 'Unrecognized Device via VPN Proxy',
        description: 'New hardware fingerprint routing through commercial anonymizer or exit node.',
        category: 'behavior',
        weight: 15,
        isEnabled: true,
      },
    ];

    const defaultSettings: SystemSettings = {
      riskBands: {
        lowMax: 24,
        mediumMax: 49,
        highMax: 74,
      },
      autoAlertThreshold: 50,
      autoBlockThreshold: 85,
      currency: 'USD',
      demoSimulatorIntervalSeconds: 15,
      maintenanceMode: false,
    };

    // Realistic Demo Transactions
    const now = Date.now();
    const demoTransactions: Transaction[] = [
      {
        id: 'tx_demo_01',
        transactionId: 'TXN-984210',
        customerId: 'CUST-8819',
        customerName: 'Alexander Hayes',
        amount: 14250.00,
        currency: 'USD',
        timestamp: new Date(now - 12 * 60000).toISOString(),
        merchant: 'BitExchange Global OTC',
        merchantCategory: 'crypto',
        location: { city: 'Zurich', country: 'Switzerland', ipAddress: '185.220.101.5' },
        paymentMethod: 'wire_transfer',
        status: 'blocked',
        riskScore: 95,
        riskLevel: 'critical',
        triggeredRules: [
          {
            code: 'RULE_LARGE_AMOUNT',
            name: 'High-Value Outlier',
            description: 'Transaction exceeds high-value threshold.',
            scoreContribution: 25,
            reason: 'Transaction amount ($14,250.00) exceeds high-value threshold ($5,000.00).',
            severity: 'high',
          },
          {
            code: 'RULE_HIGH_RISK_MERCHANT',
            name: 'High-Risk Merchant Category',
            description: 'Directed to high-risk cryptocurrency exchange.',
            scoreContribution: 20,
            reason: 'Target merchant "BitExchange Global OTC" falls under monitored crypto category.',
            severity: 'medium',
          },
          {
            code: 'RULE_RECENT_ACCOUNT_CHANGE',
            name: 'High-Value Transfer Post-Credential Reset',
            description: 'Password reset followed by high-value transfer.',
            scoreContribution: 25,
            reason: 'Security credentials modified 2 hour(s) ago; followed by high-value payment ($14,250).',
            severity: 'high',
          },
          {
            code: 'RULE_FAILED_ATTEMPTS',
            name: 'Pre-Transaction Authentication Failures',
            description: 'Repeated failed attempts.',
            scoreContribution: 25,
            reason: '3 failed authentication attempts recorded prior to this transaction.',
            severity: 'high',
          },
        ],
        riskReasons: [
          'High-value transfer ($14,250) sent to crypto OTC gateway.',
          'Account credentials were reset 2 hours prior to initiation.',
          '3 failed PIN attempts before successful submission.',
        ],
        recommendedAction: 'Immediate Block & Case Escalation: Severe account takeover indicators detected. Hold funds and contact account holder.',
        reviewedOutcome: 'pending',
        linkedAlertId: 'alt_demo_01',
        linkedCaseId: 'case_demo_01',
        device: { deviceType: 'Mobile (Android)', isVpn: true, isNewDevice: true },
        metadata: { failedAttemptsPrior: 3, hoursSincePasswordChange: 2, historicalAverageAmount: 420 },
        createdAt: new Date(now - 12 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_02',
        transactionId: 'TXN-984209',
        customerId: 'CUST-3104',
        customerName: 'Claire Tremblay',
        amount: 9850.00,
        currency: 'USD',
        timestamp: new Date(now - 34 * 60000).toISOString(),
        merchant: 'Casino Royale Macau Online',
        merchantCategory: 'gambling',
        location: { city: 'Macau', country: 'Macau', ipAddress: '103.251.167.22' },
        paymentMethod: 'credit_card',
        status: 'flagged',
        riskScore: 65,
        riskLevel: 'high',
        triggeredRules: [
          {
            code: 'RULE_STRUCTURING',
            name: 'Potential Currency Structuring (Smurfing)',
            description: 'Amount positioned just below $10,000 threshold.',
            scoreContribution: 20,
            reason: 'Amount ($9,850.00) appears structured just beneath the $10,000 threshold.',
            severity: 'medium',
          },
          {
            code: 'RULE_HIGH_RISK_MERCHANT',
            name: 'High-Risk Merchant Category',
            description: 'Target is offshore gambling.',
            scoreContribution: 20,
            reason: 'Target merchant "Casino Royale Macau Online" falls under monitored gambling category.',
            severity: 'medium',
          },
          {
            code: 'RULE_LARGE_AMOUNT',
            name: 'High-Value Outlier',
            description: 'Transaction exceeds high-value threshold.',
            scoreContribution: 25,
            reason: 'Transaction amount ($9,850.00) exceeds baseline threshold ($5,000.00).',
            severity: 'high',
          },
        ],
        riskReasons: [
          'Amount ($9,850.00) suspiciously close to the $10,000 CTR reporting threshold.',
          'Merchant classified as international offshore gambling.',
        ],
        recommendedAction: 'Hold for Analyst Review: Evaluate potential smurfing and verify source of funds.',
        reviewedOutcome: 'pending',
        linkedAlertId: 'alt_demo_02',
        metadata: { historicalAverageAmount: 600 },
        createdAt: new Date(now - 34 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_03',
        transactionId: 'TXN-984208',
        customerId: 'CUST-1049',
        customerName: 'David K. Miller',
        amount: 3200.00,
        currency: 'USD',
        timestamp: new Date(now - 55 * 60000).toISOString(),
        merchant: 'Apple Store 5th Ave',
        merchantCategory: 'electronics',
        location: { city: 'New York', country: 'United States', ipAddress: '72.229.28.185' },
        paymentMethod: 'credit_card',
        status: 'flagged',
        riskScore: 55,
        riskLevel: 'high',
        triggeredRules: [
          {
            code: 'RULE_GEO_ANOMALY',
            name: 'Impossible Geolocation Travel Speed',
            description: 'Impossible distance traveled within short duration.',
            scoreContribution: 30,
            reason: 'Jumped from London, UK to New York, US in only 1.2 hours.',
            severity: 'critical',
          },
          {
            code: 'RULE_LARGE_AMOUNT',
            name: 'High-Value Outlier',
            description: 'Spike above historical average.',
            scoreContribution: 25,
            reason: 'Transaction amount ($3,200.00) is 8.0x above customer baseline ($400).',
            severity: 'medium',
          },
        ],
        riskReasons: [
          'Impossible travel speed: Prior transaction was in London 72 minutes earlier.',
          'Significant deviation from typical $400 ticket size.',
        ],
        recommendedAction: 'Hold for Analyst Review: Contact customer to confirm physical card presence in New York.',
        reviewedOutcome: 'confirmed_fraud',
        linkedAlertId: 'alt_demo_03',
        linkedCaseId: 'case_demo_02',
        createdAt: new Date(now - 55 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_04',
        transactionId: 'TXN-984207',
        customerId: 'CUST-5521',
        customerName: 'Evelyn Rodriguez',
        amount: 750.00,
        currency: 'USD',
        timestamp: new Date(now - 70 * 60000).toISOString(),
        merchant: 'Nordstrom Online',
        merchantCategory: 'retail',
        location: { city: 'Seattle', country: 'United States', ipAddress: '67.183.10.4' },
        paymentMethod: 'debit_card',
        status: 'under_review',
        riskScore: 35,
        riskLevel: 'medium',
        triggeredRules: [
          {
            code: 'RULE_ANOMALOUS_DEVICE',
            name: 'Unrecognized Device via VPN Proxy',
            description: 'New hardware fingerprint routing through VPN.',
            scoreContribution: 15,
            reason: 'Unregistered device fingerprint connected via anonymizing VPN tunnel.',
            severity: 'low',
          },
          {
            code: 'RULE_HIGH_RISK_MERCHANT',
            name: 'High-Risk Merchant Category',
            description: 'Electronic gift card purchased.',
            scoreContribution: 20,
            reason: 'Target purchase identified as digital prepaid gift voucher.',
            severity: 'medium',
          },
        ],
        riskReasons: [
          'New unverified browser session connecting through commercial VPN node.',
          'Purchased electronic gift vouchers.',
        ],
        recommendedAction: 'Step-Up Verification: Issue SMS OTP prior to voucher delivery.',
        reviewedOutcome: 'legitimate',
        createdAt: new Date(now - 70 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_05',
        transactionId: 'TXN-984206',
        customerId: 'CUST-9902',
        customerName: 'Marcus Vance (Personal)',
        amount: 42.50,
        currency: 'USD',
        timestamp: new Date(now - 85 * 60000).toISOString(),
        merchant: 'Whole Foods Market',
        merchantCategory: 'groceries',
        location: { city: 'San Francisco', country: 'United States', ipAddress: '98.210.33.12' },
        paymentMethod: 'digital_wallet',
        status: 'completed',
        riskScore: 5,
        riskLevel: 'low',
        triggeredRules: [],
        riskReasons: ['Transaction exhibits standard behavioral parameters with no anomalous deviations.'],
        recommendedAction: 'Approve Transaction: Risk factors within normal operating thresholds.',
        reviewedOutcome: 'legitimate',
        createdAt: new Date(now - 85 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_06',
        transactionId: 'TXN-984205',
        customerId: 'CUST-7740',
        customerName: 'Dr. Gregory House',
        amount: 185.00,
        currency: 'USD',
        timestamp: new Date(now - 110 * 60000).toISOString(),
        merchant: 'Chevron Gas Station',
        merchantCategory: 'fuel',
        location: { city: 'Princeton', country: 'United States', ipAddress: '68.39.12.88' },
        paymentMethod: 'credit_card',
        status: 'completed',
        riskScore: 10,
        riskLevel: 'low',
        triggeredRules: [],
        riskReasons: ['Normal neighborhood fuel purchase on verified physical card.'],
        recommendedAction: 'Approve Transaction: Standard low-risk routine activity.',
        reviewedOutcome: 'legitimate',
        createdAt: new Date(now - 110 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_07',
        transactionId: 'TXN-984204',
        customerId: 'CUST-6112',
        customerName: 'Sophia Lin',
        amount: 4800.00,
        currency: 'USD',
        timestamp: new Date(now - 140 * 60000).toISOString(),
        merchant: 'FlyEmirates First Class',
        merchantCategory: 'travel',
        location: { city: 'Dubai', country: 'United Arab Emirates', ipAddress: '94.200.12.55' },
        paymentMethod: 'credit_card',
        status: 'completed',
        riskScore: 20,
        riskLevel: 'low',
        triggeredRules: [],
        riskReasons: ['Verified customer travel booking with 3D Secure biometric confirmation.'],
        recommendedAction: 'Approve Transaction: Verified high-trust travel merchant.',
        reviewedOutcome: 'legitimate',
        createdAt: new Date(now - 140 * 60000).toISOString(),
      },
      {
        id: 'tx_demo_08',
        transactionId: 'TXN-984203',
        customerId: 'CUST-8819',
        customerName: 'Alexander Hayes',
        amount: 2500.00,
        currency: 'USD',
        timestamp: new Date(now - 150 * 60000).toISOString(),
        merchant: 'Kraken Europe P2P',
        merchantCategory: 'crypto',
        location: { city: 'Amsterdam', country: 'Netherlands', ipAddress: '185.220.101.5' },
        paymentMethod: 'wire_transfer',
        status: 'flagged',
        riskScore: 70,
        riskLevel: 'high',
        triggeredRules: [
          {
            code: 'RULE_VELOCITY',
            name: 'High-Frequency Velocity Spike',
            description: 'Rapid subsequent transfers initiated.',
            scoreContribution: 30,
            reason: 'Detected 2 high-value wire transfers within 20 minutes for Alexander Hayes.',
            severity: 'high',
          },
          {
            code: 'RULE_HIGH_RISK_MERCHANT',
            name: 'High-Risk Merchant Category',
            description: 'Crypto exchange destination.',
            scoreContribution: 20,
            reason: 'Target merchant "Kraken Europe P2P" falls under monitored crypto category.',
            severity: 'medium',
          },
          {
            code: 'RULE_FAILED_ATTEMPTS',
            name: 'Pre-Transaction Authentication Failures',
            description: 'Failed credential attempts.',
            scoreContribution: 20,
            reason: '2 failed 2FA verification attempts prior to submission.',
            severity: 'medium',
          },
        ],
        riskReasons: [
          'Rapid velocity spike on newly linked wire recipient.',
          'Destination is crypto peer-to-peer liquidity provider.',
        ],
        recommendedAction: 'Hold for Analyst Review: Suspected account takeover draining sequence.',
        reviewedOutcome: 'pending',
        linkedAlertId: 'alt_demo_04',
        linkedCaseId: 'case_demo_01',
        createdAt: new Date(now - 150 * 60000).toISOString(),
      },
    ];

    // Additional historical seed transactions over the last 14 days
    const merchants = [
      { name: 'Amazon Web Services', cat: 'technology', amount: 124.50 },
      { name: 'Target Superstore', cat: 'retail', amount: 84.20 },
      { name: 'Starbucks Coffee', cat: 'dining', amount: 6.75 },
      { name: 'Uber Rides', cat: 'transport', amount: 32.40 },
      { name: 'Delta Airlines', cat: 'travel', amount: 489.00 },
      { name: 'Coinbase Inc', cat: 'crypto', amount: 4850.00 },
      { name: 'Netflix Subscription', cat: 'entertainment', amount: 19.99 },
      { name: 'Home Depot', cat: 'retail', amount: 231.10 },
      { name: 'PayPal P2P Transfer', cat: 'p2p', amount: 950.00 },
      { name: 'Shell Oil', cat: 'fuel', amount: 55.00 },
      { name: 'Rolex Boutique Geneva', cat: 'luxury', amount: 12500.00 },
      { name: 'BestBuy Electronics', cat: 'electronics', amount: 1420.00 },
      { name: 'Sephora Beauty', cat: 'retail', amount: 94.00 },
      { name: 'Steam Games', cat: 'gaming', amount: 59.99 },
      { name: 'Wire to Cayman Offshore Ltd', cat: 'wire_transfer', amount: 48000.00 },
    ];

    const customerPool = [
      { id: 'CUST-4011', name: 'James Thornton', city: 'Chicago', country: 'United States' },
      { id: 'CUST-7299', name: 'Maria Santos', city: 'Madrid', country: 'Spain' },
      { id: 'CUST-2391', name: 'Kenji Takahashi', city: 'Tokyo', country: 'Japan' },
      { id: 'CUST-9102', name: 'Fatima Al-Sayed', city: 'Doha', country: 'Qatar' },
      { id: 'CUST-5832', name: 'Oliver Bennett', city: 'London', country: 'United Kingdom' },
    ];

    for (let i = 1; i <= 35; i++) {
      const daysAgo = Math.floor(i / 3) + 1;
      const hoursAgo = (i * 7) % 24;
      const txTime = new Date(now - (daysAgo * 86400000) - (hoursAgo * 3600000)).toISOString();
      const m = merchants[i % merchants.length];
      const cust = customerPool[i % customerPool.length];
      const isHighValue = m.amount > 4000;
      const isCryptoOrWire = m.cat === 'crypto' || m.cat === 'wire_transfer';
      const score = isHighValue && isCryptoOrWire ? Math.min(88, 55 + (i % 30)) : (isHighValue ? 45 : (i % 25));
      const riskLevel = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
      const status = score >= 75 ? 'blocked' : score >= 50 ? 'flagged' : 'completed';

      demoTransactions.push({
        id: `tx_hist_${i}`,
        transactionId: `TXN-${800000 + i}`,
        customerId: cust.id,
        customerName: cust.name,
        amount: m.amount + (i * 12.3),
        currency: 'USD',
        timestamp: txTime,
        merchant: m.name,
        merchantCategory: m.cat,
        location: { city: cust.city, country: cust.country },
        paymentMethod: i % 4 === 0 ? 'wire_transfer' : i % 3 === 0 ? 'crypto' : 'credit_card',
        status,
        riskScore: score,
        riskLevel,
        triggeredRules: score >= 50 ? [
          {
            code: 'RULE_LARGE_AMOUNT',
            name: 'Historical High-Value Alert',
            description: 'Exceeded typical profile threshold.',
            scoreContribution: 25,
            reason: `Transaction amount exceeds nominal spending baseline.`,
            severity: 'medium',
          }
        ] : [],
        riskReasons: score >= 50 ? ['Historical anomalous transaction detected by baseline monitor.'] : ['Standard clearing.'],
        recommendedAction: score >= 50 ? 'Logged for compliance archive.' : 'Approved.',
        reviewedOutcome: score >= 75 ? 'confirmed_fraud' : score >= 50 ? 'legitimate' : 'legitimate',
        createdAt: txTime,
      });
    }

    // Demo Fraud Alerts
    const demoAlerts: FraudAlert[] = [
      {
        id: 'alt_demo_01',
        alertId: 'ALT-1094',
        transactionId: 'tx_demo_01',
        transactionRef: {
          amount: 14250.00,
          currency: 'USD',
          customerName: 'Alexander Hayes',
          customerId: 'CUST-8819',
          merchant: 'BitExchange Global OTC',
          timestamp: new Date(now - 12 * 60000).toISOString(),
        },
        riskScore: 95,
        severity: 'critical',
        category: 'Account Takeover / Crypto Drain',
        triggeredRules: demoTransactions[0].triggeredRules,
        status: 'escalated',
        assignedTo: { id: 'usr_analyst_01', name: 'Marcus Vance', role: 'analyst' },
        recommendedAction: 'Immediate account freeze & customer contact via registered phone number.',
        caseId: 'case_demo_01',
        notes: [
          {
            id: 'note_1',
            authorId: 'usr_analyst_01',
            authorName: 'Marcus Vance',
            text: 'Triggered multi-vector ATO signals. Customer IP traced to known Tor/Mullvad exit node.',
            createdAt: new Date(now - 10 * 60000).toISOString(),
          },
        ],
        createdAt: new Date(now - 12 * 60000).toISOString(),
        updatedAt: new Date(now - 5 * 60000).toISOString(),
      },
      {
        id: 'alt_demo_02',
        alertId: 'ALT-1093',
        transactionId: 'tx_demo_02',
        transactionRef: {
          amount: 9850.00,
          currency: 'USD',
          customerName: 'Claire Tremblay',
          customerId: 'CUST-3104',
          merchant: 'Casino Royale Macau Online',
          timestamp: new Date(now - 34 * 60000).toISOString(),
        },
        riskScore: 65,
        severity: 'high',
        category: 'Structuring & Offshore Laundering',
        triggeredRules: demoTransactions[1].triggeredRules,
        status: 'under_investigation',
        assignedTo: { id: 'usr_comp_01', name: 'Elena Rostova', role: 'compliance' },
        recommendedAction: 'Request proof of wealth and CTR exemption questionnaire.',
        notes: [
          {
            id: 'note_2',
            authorId: 'usr_comp_01',
            authorName: 'Elena Rostova',
            text: 'Amount positioned $150 below FinCEN $10k reporting ceiling. Investigating linked deposit origins.',
            createdAt: new Date(now - 25 * 60000).toISOString(),
          },
        ],
        createdAt: new Date(now - 34 * 60000).toISOString(),
        updatedAt: new Date(now - 25 * 60000).toISOString(),
      },
      {
        id: 'alt_demo_03',
        alertId: 'ALT-1092',
        transactionId: 'tx_demo_03',
        transactionRef: {
          amount: 3200.00,
          currency: 'USD',
          customerName: 'David K. Miller',
          customerId: 'CUST-1049',
          merchant: 'Apple Store 5th Ave',
          timestamp: new Date(now - 55 * 60000).toISOString(),
        },
        riskScore: 55,
        severity: 'high',
        category: 'Counterfeit Card / Impossible Travel',
        triggeredRules: demoTransactions[2].triggeredRules,
        status: 'resolved',
        assignedTo: { id: 'usr_analyst_01', name: 'Marcus Vance', role: 'analyst' },
        recommendedAction: 'Confirmed fraudulent clone card. Card cancelled and chargeback initiated.',
        caseId: 'case_demo_02',
        resolution: {
          outcome: 'confirmed_fraud',
          comment: 'Customer verified in UK; New York store transaction was confirmed fraudulent POS skim.',
          resolvedBy: 'Marcus Vance',
          resolvedAt: new Date(now - 20 * 60000).toISOString(),
        },
        notes: [
          {
            id: 'note_3',
            authorId: 'usr_analyst_01',
            authorName: 'Marcus Vance',
            text: 'Spoke with David Miller directly. He is presently in London with his physical debit card. Card revoked immediately.',
            createdAt: new Date(now - 30 * 60000).toISOString(),
          },
        ],
        createdAt: new Date(now - 55 * 60000).toISOString(),
        updatedAt: new Date(now - 20 * 60000).toISOString(),
      },
      {
        id: 'alt_demo_04',
        alertId: 'ALT-1091',
        transactionId: 'tx_demo_08',
        transactionRef: {
          amount: 2500.00,
          currency: 'USD',
          customerName: 'Alexander Hayes',
          customerId: 'CUST-8819',
          merchant: 'Kraken Europe P2P',
          timestamp: new Date(now - 150 * 60000).toISOString(),
        },
        riskScore: 70,
        severity: 'high',
        category: 'Rapid Wire Velocity',
        triggeredRules: demoTransactions[7].triggeredRules,
        status: 'acknowledged',
        assignedTo: { id: 'usr_analyst_01', name: 'Marcus Vance', role: 'analyst' },
        recommendedAction: 'Consolidated under active Case CASE-2026-081.',
        caseId: 'case_demo_01',
        notes: [],
        createdAt: new Date(now - 150 * 60000).toISOString(),
        updatedAt: new Date(now - 120 * 60000).toISOString(),
      },
    ];

    // Demo Investigation Cases
    const demoCases: InvestigationCase[] = [
      {
        id: 'case_demo_01',
        caseId: 'CASE-2026-081',
        title: 'Suspected Syndicate ATO & P2P Crypto Draining Campaign',
        description: 'Coordinated attack targeting high-net-worth customer Alexander Hayes involving credential stuffing, SIM swap indicators, and rapid wire attempts to offshore crypto OTC nodes.',
        priority: 'urgent',
        status: 'in_progress',
        disposition: 'pending',
        assignedTo: { id: 'usr_analyst_01', name: 'Marcus Vance' },
        transactionIds: ['tx_demo_01', 'tx_demo_08'],
        alertIds: ['alt_demo_01', 'alt_demo_04'],
        evidence: [
          {
            id: 'ev_1',
            type: 'ip_lookup',
            title: 'Anomalous IP Geolocation Report',
            description: 'IP 185.220.101.5 identified as known exit relay in Zurich, Switzerland with 0 prior history for customer.',
            addedBy: 'Marcus Vance',
            addedAt: new Date(now - 8 * 60000).toISOString(),
          },
          {
            id: 'ev_2',
            type: 'device_telemetry',
            title: 'Mismatched Browser Fingerprint',
            description: 'User Agent header reveals Chrome Linux on Android emulator; customer regularly uses iPhone iOS Safari.',
            addedBy: 'Marcus Vance',
            addedAt: new Date(now - 6 * 60000).toISOString(),
          },
        ],
        notes: [
          {
            id: 'cn_1',
            authorId: 'usr_analyst_01',
            authorName: 'Marcus Vance',
            text: 'Placed administrative hold on outward wire TXN-984210 ($14,250). Reached out to Alexander Hayes via secondary corporate emergency contact.',
            createdAt: new Date(now - 9 * 60000).toISOString(),
          },
        ],
        timeline: [
          {
            id: 'tl_1',
            action: 'Case Created',
            actor: 'System / Automated Engine',
            timestamp: new Date(now - 12 * 60000).toISOString(),
            details: 'Automatically opened case due to Critical Risk Score (95/100).',
          },
          {
            id: 'tl_2',
            action: 'Investigator Assigned',
            actor: 'Marcus Vance',
            timestamp: new Date(now - 10 * 60000).toISOString(),
            details: 'Assigned to Senior Fraud Analyst Marcus Vance.',
          },
          {
            id: 'tl_3',
            action: 'Funds Frozen',
            actor: 'Marcus Vance',
            timestamp: new Date(now - 8 * 60000).toISOString(),
            details: 'Outbound wire transfer suspended pending affirmative identity validation.',
          },
        ],
        createdAt: new Date(now - 12 * 60000).toISOString(),
        updatedAt: new Date(now - 5 * 60000).toISOString(),
      },
      {
        id: 'case_demo_02',
        caseId: 'CASE-2026-079',
        title: 'Manhattan POS Terminal Magstripe Skimming Ring',
        description: 'Physical POS terminal skim at Apple Store 5th Ave using clone of UK resident David Miller debit card.',
        priority: 'high',
        status: 'closed',
        disposition: 'confirmed_fraud',
        dispositionNotes: 'Customer verified in London at time of transaction. Physical clone confirmed. $3,200 recovered via Visa dispute zero-liability framework.',
        assignedTo: { id: 'usr_analyst_01', name: 'Marcus Vance' },
        transactionIds: ['tx_demo_03'],
        alertIds: ['alt_demo_03'],
        evidence: [
          {
            id: 'ev_3',
            type: 'customer_affidavit',
            title: 'Signed Fraud Affidavit & London Boarding Pass',
            description: 'Customer provided stamped passport and sworn affidavit of non-authorization.',
            addedBy: 'Elena Rostova',
            addedAt: new Date(now - 25 * 60000).toISOString(),
          },
          {
            id: 'ev_4',
            type: 'card_network_chargeback',
            title: 'Chargeback ARN 74819203912',
            description: 'Chargeback filed under Condition 10.4 (Other Fraud: Card-Absent Environment / Counterfeit).',
            addedBy: 'Elena Rostova',
            addedAt: new Date(now - 22 * 60000).toISOString(),
          },
        ],
        notes: [
          {
            id: 'cn_2',
            authorId: 'usr_comp_01',
            authorName: 'Elena Rostova',
            text: 'Filed regulatory SAR notification with FinCEN regarding Manhattan POS terminal compromise pattern.',
            createdAt: new Date(now - 21 * 60000).toISOString(),
          },
        ],
        timeline: [
          {
            id: 'tl_4',
            action: 'Case Created',
            actor: 'Marcus Vance',
            timestamp: new Date(now - 50 * 60000).toISOString(),
            details: 'Opened following alert ALT-1092 review.',
          },
          {
            id: 'tl_5',
            action: 'Evidence Appended',
            actor: 'Elena Rostova',
            timestamp: new Date(now - 25 * 60000).toISOString(),
            details: 'Customer affidavit and proof of physical presence verified.',
          },
          {
            id: 'tl_6',
            action: 'Case Resolved & Closed',
            actor: 'Marcus Vance',
            timestamp: new Date(now - 20 * 60000).toISOString(),
            details: 'Disposition recorded as Confirmed Fraud. Recovery filed.',
          },
        ],
        createdAt: new Date(now - 50 * 60000).toISOString(),
        updatedAt: new Date(now - 20 * 60000).toISOString(),
        closedAt: new Date(now - 20 * 60000).toISOString(),
        closedBy: 'Marcus Vance',
      },
    ];

    // Audit Events
    const demoAuditEvents: AuditEvent[] = [
      {
        id: 'aud_1',
        actorId: 'usr_admin_01',
        actorName: 'Sarah Jenkins',
        actorRole: 'admin',
        action: 'SYSTEM_INITIALIZATION',
        targetEntity: 'setting',
        entityId: 'global',
        timestamp: new Date(now - 2 * 86400000).toISOString(),
        details: 'FinGuard AI engine deployed with 8 active risk scoring heuristics.',
        ipAddress: '10.0.1.1',
      },
      {
        id: 'aud_2',
        actorId: 'usr_admin_01',
        actorName: 'Sarah Jenkins',
        actorRole: 'admin',
        action: 'UPDATE_RULE_CONFIG',
        targetEntity: 'setting',
        entityId: 'rule_1',
        timestamp: new Date(now - 24 * 3600000).toISOString(),
        details: 'Calibrated High-Value Outlier threshold to $5,000.00 USD.',
        ipAddress: '10.0.1.1',
      },
      {
        id: 'aud_3',
        actorId: 'usr_analyst_01',
        actorName: 'Marcus Vance',
        actorRole: 'analyst',
        action: 'CREATE_INVESTIGATION_CASE',
        targetEntity: 'case',
        entityId: 'case_demo_01',
        timestamp: new Date(now - 12 * 60000).toISOString(),
        details: 'Opened Urgent Investigation CASE-2026-081 following critical risk score 95 on TXN-984210.',
        ipAddress: '192.168.1.104',
      },
      {
        id: 'aud_4',
        actorId: 'usr_comp_01',
        actorName: 'Elena Rostova',
        actorRole: 'compliance',
        action: 'RESOLVE_CASE_FRAUD',
        targetEntity: 'case',
        entityId: 'case_demo_02',
        timestamp: new Date(now - 20 * 60000).toISOString(),
        details: 'Finalized CASE-2026-079 with disposition Confirmed Fraud. Filed Chargeback ARN 74819203912.',
        ipAddress: '192.168.1.108',
      },
    ];

    // In-App Notifications
    const demoNotifications: Notification[] = [
      {
        id: 'notif_1',
        title: 'Critical Fraud Alert (Score 95)',
        message: 'Transaction TXN-984210 ($14,250.00) triggered Account Takeover flags. Automatic hold applied.',
        type: 'alert',
        read: false,
        link: '/alerts',
        createdAt: new Date(now - 12 * 60000).toISOString(),
      },
      {
        id: 'notif_2',
        title: 'New Investigation Case Assigned',
        message: 'You have been assigned to Case CASE-2026-081 (Suspected ATO & P2P Crypto Drain).',
        type: 'case',
        read: false,
        link: '/investigations',
        createdAt: new Date(now - 10 * 60000).toISOString(),
      },
      {
        id: 'notif_3',
        title: 'Compliance Audit Review Scheduled',
        message: 'Quarterly AML / BSA SAR readiness compliance summary generated.',
        type: 'system',
        read: true,
        link: '/compliance',
        createdAt: new Date(now - 120 * 60000).toISOString(),
      },
    ];

    this.data = {
      users: defaultUsers,
      transactions: demoTransactions,
      alerts: demoAlerts,
      cases: demoCases,
      auditEvents: demoAuditEvents,
      notifications: demoNotifications,
      rules: defaultRules,
      settings: defaultSettings,
      version: 1,
    };

    this.saveToDiskSync();
  }

  public saveToDiskSync(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public scheduleSave(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      this.saveToDiskSync();
      this.isSaving = false;
    }, 100);
  }

  // --- Collection Accessors & CRUD Helpers ---

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.scheduleSave();
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.scheduleSave();
      return this.data.users[idx];
    }
    return undefined;
  }

  // Transactions
  public getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  public findTransactionById(id: string): Transaction | undefined {
    return this.data.transactions.find(t => t.id === id || t.transactionId === id);
  }

  public addTransaction(tx: Transaction): void {
    this.data.transactions.unshift(tx);
    this.scheduleSave();
  }

  public updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
    const idx = this.data.transactions.findIndex(t => t.id === id || t.transactionId === id);
    if (idx !== -1) {
      this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
      this.scheduleSave();
      return this.data.transactions[idx];
    }
    return undefined;
  }

  // Fraud Alerts
  public getAlerts(): FraudAlert[] {
    return this.data.alerts;
  }

  public findAlertById(id: string): FraudAlert | undefined {
    return this.data.alerts.find(a => a.id === id || a.alertId === id);
  }

  public addAlert(alert: FraudAlert): void {
    this.data.alerts.unshift(alert);
    this.scheduleSave();
  }

  public updateAlert(id: string, updates: Partial<FraudAlert>): FraudAlert | undefined {
    const idx = this.data.alerts.findIndex(a => a.id === id || a.alertId === id);
    if (idx !== -1) {
      this.data.alerts[idx] = { ...this.data.alerts[idx], ...updates, updatedAt: new Date().toISOString() };
      this.scheduleSave();
      return this.data.alerts[idx];
    }
    return undefined;
  }

  // Investigation Cases
  public getCases(): InvestigationCase[] {
    return this.data.cases;
  }

  public findCaseById(id: string): InvestigationCase | undefined {
    return this.data.cases.find(c => c.id === id || c.caseId === id);
  }

  public addCase(c: InvestigationCase): void {
    this.data.cases.unshift(c);
    this.scheduleSave();
  }

  public updateCase(id: string, updates: Partial<InvestigationCase>): InvestigationCase | undefined {
    const idx = this.data.cases.findIndex(c => c.id === id || c.caseId === id);
    if (idx !== -1) {
      this.data.cases[idx] = { ...this.data.cases[idx], ...updates, updatedAt: new Date().toISOString() };
      this.scheduleSave();
      return this.data.cases[idx];
    }
    return undefined;
  }

  // Audit Events
  public getAuditEvents(): AuditEvent[] {
    return this.data.auditEvents;
  }

  public addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditEvents.unshift(fullEvent);
    this.scheduleSave();
    return fullEvent;
  }

  // Notifications
  public getNotifications(): Notification[] {
    return this.data.notifications;
  }

  public addNotification(notif: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const fullNotif: Notification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(fullNotif);
    this.scheduleSave();
    return fullNotif;
  }

  public markNotificationRead(id: string): void {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.scheduleSave();
    }
  }

  public markAllNotificationsRead(): void {
    this.data.notifications.forEach(n => { n.read = true; });
    this.scheduleSave();
  }

  // Rules
  public getRules(): DetectionRuleConfig[] {
    return this.data.rules;
  }

  public updateRule(id: string, updates: Partial<DetectionRuleConfig>): DetectionRuleConfig | undefined {
    const idx = this.data.rules.findIndex(r => r.id === id || r.code === id);
    if (idx !== -1) {
      this.data.rules[idx] = { ...this.data.rules[idx], ...updates };
      this.scheduleSave();
      return this.data.rules[idx];
    }
    return undefined;
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.scheduleSave();
    return this.data.settings;
  }
}

export const db = Database.getInstance();
