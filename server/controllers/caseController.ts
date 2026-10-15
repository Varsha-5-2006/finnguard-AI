import { Response } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest, logAuditEvent } from '../middleware/auth.js';
import { InvestigationCase, CaseStatus, CasePriority, CaseDisposition } from '../types/index.js';

export class CaseController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        status,
        priority,
        disposition,
        search = '',
        page = '1',
        limit = '15',
      } = req.query as Record<string, string>;

      let items = [...db.getCases()];

      if (status && status !== 'all') {
        items = items.filter(c => c.status === status);
      }
      if (priority && priority !== 'all') {
        items = items.filter(c => c.priority === priority);
      }
      if (disposition && disposition !== 'all') {
        items = items.filter(c => c.disposition === disposition);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(c =>
          c.caseId.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.assignedTo?.name || '').toLowerCase().includes(q)
        );
      }

      const total = items.length;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
      const paginated = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        cases: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch cases: ' + err.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const investigation = db.findCaseById(id);

      if (!investigation) {
        res.status(404).json({ error: 'Investigation case not found' });
        return;
      }

      // Populate linked transactions
      const transactions = investigation.transactionIds
        .map(txId => db.findTransactionById(txId))
        .filter(Boolean);

      // Populate linked alerts
      const alerts = investigation.alertIds
        .map(aId => db.findAlertById(aId))
        .filter(Boolean);

      res.json({
        case: investigation,
        transactions,
        alerts,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve case: ' + err.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, priority = 'medium', transactionIds = [], alertIds = [] } = req.body;

      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required.' });
        return;
      }

      const caseId = `CASE-2026-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString();

      const newCase: InvestigationCase = {
        id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        caseId,
        title,
        description,
        priority: priority as CasePriority,
        status: 'open',
        disposition: 'pending',
        assignedTo: req.user ? { id: req.user.id, name: req.user.name } : undefined,
        transactionIds,
        alertIds,
        evidence: [],
        notes: [],
        timeline: [
          {
            id: `tl_${Date.now()}`,
            action: 'Case Created',
            actor: req.user?.name || 'Analyst',
            timestamp: now,
            details: 'Case initiated by investigator.',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      db.addCase(newCase);

      // Update linked transactions with case reference
      transactionIds.forEach((tId: string) => {
        db.updateTransaction(tId, { linkedCaseId: newCase.id, status: 'under_review' });
      });

      logAuditEvent(
        req,
        'CREATE_CASE',
        'case',
        newCase.id,
        `Created investigation case ${newCase.caseId}: "${newCase.title}".`
      );

      res.status(201).json({ case: newCase });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create case: ' + err.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, priority, assignedToUserId } = req.body;

      const investigation = db.findCaseById(id);
      if (!investigation) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      const updates: Partial<InvestigationCase> = {};
      const timelineItems = [...investigation.timeline];
      const now = new Date().toISOString();

      if (status && status !== investigation.status) {
        updates.status = status as CaseStatus;
        timelineItems.push({
          id: `tl_${Date.now()}`,
          action: 'Status Changed',
          actor: req.user?.name || 'Analyst',
          timestamp: now,
          details: `Status transitioned from ${investigation.status} to ${status}.`,
        });
      }

      if (priority && priority !== investigation.priority) {
        updates.priority = priority as CasePriority;
        timelineItems.push({
          id: `tl_${Date.now()}`,
          action: 'Priority Updated',
          actor: req.user?.name || 'Analyst',
          timestamp: now,
          details: `Priority adjusted to ${priority}.`,
        });
      }

      if (assignedToUserId) {
        const user = db.findUserById(assignedToUserId);
        if (user) {
          updates.assignedTo = { id: user.id, name: user.name };
          timelineItems.push({
            id: `tl_${Date.now()}`,
            action: 'Assignee Changed',
            actor: req.user?.name || 'Analyst',
            timestamp: now,
            details: `Reassigned to ${user.name}.`,
          });
        }
      }

      updates.timeline = timelineItems;
      const updated = db.updateCase(investigation.id, updates);

      logAuditEvent(
        req,
        'UPDATE_CASE',
        'case',
        investigation.id,
        `Updated parameters for case ${investigation.caseId}.`
      );

      res.json({ case: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update case: ' + err.message });
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

      const investigation = db.findCaseById(id);
      if (!investigation) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      const now = new Date().toISOString();
      const newNote = {
        id: `cn_${Date.now()}`,
        authorId: req.user?.id || 'sys',
        authorName: req.user?.name || 'Analyst',
        text: text.trim(),
        createdAt: now,
      };

      const timelineItem = {
        id: `tl_${Date.now()}`,
        action: 'Note Appended',
        actor: req.user?.name || 'Analyst',
        timestamp: now,
        details: text.trim().substring(0, 100) + (text.length > 100 ? '...' : ''),
      };

      const updated = db.updateCase(investigation.id, {
        notes: [...(investigation.notes || []), newNote],
        timeline: [...(investigation.timeline || []), timelineItem],
      });

      logAuditEvent(
        req,
        'ADD_CASE_NOTE',
        'case',
        investigation.id,
        `Added note to case ${investigation.caseId}.`
      );

      res.json({ case: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add note: ' + err.message });
    }
  }

  public static async addEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, type = 'document' } = req.body;

      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required for evidence.' });
        return;
      }

      const investigation = db.findCaseById(id);
      if (!investigation) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      const now = new Date().toISOString();
      const evidenceItem = {
        id: `ev_${Date.now()}`,
        type,
        title,
        description,
        addedBy: req.user?.name || 'Analyst',
        addedAt: now,
      };

      const timelineItem = {
        id: `tl_${Date.now()}`,
        action: 'Evidence Added',
        actor: req.user?.name || 'Analyst',
        timestamp: now,
        details: `Attached evidence: "${title}" (${type}).`,
      };

      const updated = db.updateCase(investigation.id, {
        evidence: [...(investigation.evidence || []), evidenceItem],
        timeline: [...(investigation.timeline || []), timelineItem],
      });

      logAuditEvent(
        req,
        'ADD_CASE_EVIDENCE',
        'case',
        investigation.id,
        `Added evidence "${title}" to case ${investigation.caseId}.`
      );

      res.json({ case: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add evidence: ' + err.message });
    }
  }

  public static async setDisposition(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { disposition, dispositionNotes } = req.body;

      const validDispositions: CaseDisposition[] = ['confirmed_fraud', 'legitimate_activity', 'inconclusive'];
      if (!validDispositions.includes(disposition)) {
        res.status(400).json({ error: `Invalid disposition. Must be one of: ${validDispositions.join(', ')}` });
        return;
      }

      const investigation = db.findCaseById(id);
      if (!investigation) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }

      const now = new Date().toISOString();
      const timelineItem = {
        id: `tl_${Date.now()}`,
        action: 'Final Disposition Recorded',
        actor: req.user?.name || 'Investigator',
        timestamp: now,
        details: `Recorded decision as ${disposition.replace('_', ' ').toUpperCase()}. Notes: ${dispositionNotes || 'None'}`,
      };

      const updated = db.updateCase(investigation.id, {
        disposition,
        dispositionNotes: dispositionNotes || '',
        status: 'closed',
        closedAt: now,
        closedBy: req.user?.name || 'Investigator',
        timeline: [...(investigation.timeline || []), timelineItem],
      });

      // Synchronize outcome on linked transactions
      const txOutcome = disposition === 'confirmed_fraud'
        ? 'confirmed_fraud'
        : disposition === 'legitimate_activity'
        ? 'legitimate'
        : 'inconclusive';

      investigation.transactionIds.forEach(txId => {
        const tx = db.findTransactionById(txId);
        if (tx) {
          db.updateTransaction(tx.id, {
            reviewedOutcome: txOutcome,
            status: disposition === 'confirmed_fraud' ? 'blocked' : 'completed',
          });
        }
      });

      // Synchronize outcome on linked alerts
      investigation.alertIds.forEach(aId => {
        const alt = db.findAlertById(aId);
        if (alt) {
          db.updateAlert(alt.id, {
            status: 'resolved',
            resolution: {
              outcome: disposition === 'confirmed_fraud' ? 'confirmed_fraud' : 'legitimate_override',
              comment: dispositionNotes || 'Resolved through formal case disposition.',
              resolvedBy: req.user?.name || 'Investigator',
              resolvedAt: now,
            },
          });
        }
      });

      logAuditEvent(
        req,
        'SET_CASE_DISPOSITION',
        'case',
        investigation.id,
        `Finalized Case ${investigation.caseId} with disposition ${disposition.toUpperCase()}.`
      );

      res.json({ case: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record disposition: ' + err.message });
    }
  }
}
