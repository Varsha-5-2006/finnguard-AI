import { Response } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest, logAuditEvent } from '../middleware/auth.js';
import { AlertStatus, AlertSeverity, FraudAlert, InvestigationCase } from '../types/index.js';

export class AlertController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        status,
        severity,
        search = '',
        assignedTo,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      let items = [...db.getAlerts()];

      if (status && status !== 'all') {
        items = items.filter(a => a.status === status);
      }
      if (severity && severity !== 'all') {
        items = items.filter(a => a.severity === severity);
      }
      if (assignedTo && assignedTo !== 'all') {
        items = items.filter(a => a.assignedTo?.id === assignedTo);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(a =>
          a.alertId.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.transactionRef.customerName.toLowerCase().includes(q) ||
          a.transactionRef.customerId.toLowerCase().includes(q) ||
          a.transactionRef.merchant.toLowerCase().includes(q)
        );
      }

      const total = items.length;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const paginated = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        alerts: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch alerts: ' + err.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = db.findAlertById(id);

      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      const transaction = db.findTransactionById(alert.transactionId);
      const linkedCase = alert.caseId ? db.findCaseById(alert.caseId) : undefined;

      res.json({ alert, transaction, linkedCase });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch alert: ' + err.message });
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, note, resolutionOutcome } = req.body;

      const alert = db.findAlertById(id);
      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      const validStatuses: AlertStatus[] = [
        'new',
        'acknowledged',
        'under_investigation',
        'escalated',
        'resolved',
        'dismissed',
      ];

      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      const updates: Partial<FraudAlert> = { status };

      if (note && note.trim()) {
        const newNote = {
          id: `note_${Date.now()}`,
          authorId: req.user?.id || 'sys',
          authorName: req.user?.name || 'Analyst',
          text: note.trim(),
          createdAt: new Date().toISOString(),
        };
        updates.notes = [...(alert.notes || []), newNote];
      }

      if (status === 'resolved' || status === 'dismissed') {
        updates.resolution = {
          outcome: resolutionOutcome || (status === 'dismissed' ? 'dismissed' : 'legitimate_override'),
          comment: note || 'Resolved by analyst',
          resolvedBy: req.user?.name || 'Analyst',
          resolvedAt: new Date().toISOString(),
        };
      }

      const updated = db.updateAlert(alert.id, updates);

      logAuditEvent(
        req,
        'UPDATE_ALERT_STATUS',
        'alert',
        alert.id,
        `Alert ${alert.alertId} status transitioned from ${alert.status} to ${status}.`
      );

      res.json({ alert: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update alert: ' + err.message });
    }
  }

  public static async assign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const alert = db.findAlertById(id);
      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      let assignee: { id: string; name: string; role: string } | undefined;
      if (userId) {
        const targetUser = db.findUserById(userId);
        if (!targetUser) {
          res.status(404).json({ error: 'Assignee user not found' });
          return;
        }
        assignee = { id: targetUser.id, name: targetUser.name, role: targetUser.role };
      }

      const updated = db.updateAlert(alert.id, {
        assignedTo: assignee,
        status: alert.status === 'new' ? 'acknowledged' : alert.status,
      });

      logAuditEvent(
        req,
        'ASSIGN_ALERT',
        'alert',
        alert.id,
        `Alert ${alert.alertId} assigned to ${assignee?.name || 'Unassigned'}.`
      );

      res.json({ alert: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to assign alert: ' + err.message });
    }
  }

  public static async addNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Note text is required' });
        return;
      }

      const alert = db.findAlertById(id);
      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      const newNote = {
        id: `note_${Date.now()}`,
        authorId: req.user?.id || 'sys',
        authorName: req.user?.name || 'Analyst',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = db.updateAlert(alert.id, {
        notes: [...(alert.notes || []), newNote],
      });

      logAuditEvent(
        req,
        'ADD_ALERT_NOTE',
        'alert',
        alert.id,
        `Added investigator note to ${alert.alertId}.`
      );

      res.json({ alert: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add note: ' + err.message });
    }
  }

  public static async createCaseFromAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, priority = 'high' } = req.body;

      const alert = db.findAlertById(id);
      if (!alert) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      const caseId = `CASE-2026-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString();

      const newCase: InvestigationCase = {
        id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        caseId,
        title: title || `Investigation: ${alert.category} (${alert.alertId})`,
        description: description || `Escalated from Alert ${alert.alertId} for ${alert.transactionRef.customerName}. Recommended action: ${alert.recommendedAction}`,
        priority,
        status: 'open',
        disposition: 'pending',
        assignedTo: req.user ? { id: req.user.id, name: req.user.name } : undefined,
        transactionIds: [alert.transactionId],
        alertIds: [alert.id],
        evidence: [
          {
            id: `ev_${Date.now()}`,
            type: 'device_telemetry',
            title: `Alert Trigger Rules: ${alert.alertId}`,
            description: alert.triggeredRules.map(r => `${r.name}: ${r.reason}`).join('\n'),
            addedBy: req.user?.name || 'System',
            addedAt: now,
          },
        ],
        notes: [
          {
            id: `cn_${Date.now()}`,
            authorId: req.user?.id || 'sys',
            authorName: req.user?.name || 'Analyst',
            text: `Case opened by escalation from Alert ${alert.alertId}.`,
            createdAt: now,
          },
        ],
        timeline: [
          {
            id: `tl_${Date.now()}`,
            action: 'Case Created',
            actor: req.user?.name || 'Analyst',
            timestamp: now,
            details: `Created from Alert ${alert.alertId}.`,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      db.addCase(newCase);

      // Link case to alert and transaction
      db.updateAlert(alert.id, { caseId: newCase.id, status: 'escalated' });
      db.updateTransaction(alert.transactionId, { linkedCaseId: newCase.id, status: 'under_review' });

      logAuditEvent(
        req,
        'ESCALATE_ALERT_TO_CASE',
        'case',
        newCase.id,
        `Escalated Alert ${alert.alertId} into new Investigation Case ${newCase.caseId}.`
      );

      res.status(201).json({ case: newCase });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create case: ' + err.message });
    }
  }
}
