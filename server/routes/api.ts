import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { TransactionController } from '../controllers/transactionController.js';
import { AlertController } from '../controllers/alertController.js';
import { CaseController } from '../controllers/caseController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { ComplianceController } from '../controllers/complianceController.js';
import { SettingsController } from '../controllers/settingsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// --- Health Check ---
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'FinGuard AI - Institutional Fraud Intelligence',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    storageEngine: 'Embedded Persistent File Engine',
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// --- Auth Routes ---
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/auth/demo-login', AuthController.demoLogin);
router.get('/auth/me', authenticateToken, AuthController.getMe);

// --- Dashboard Routes ---
router.get('/dashboard/summary', authenticateToken, DashboardController.getSummary);
router.get('/dashboard/trends', authenticateToken, DashboardController.getTrends);

// --- Transaction Routes ---
router.get('/transactions', authenticateToken, TransactionController.list);
router.get('/transactions/export', authenticateToken, TransactionController.exportCsv);
router.get('/transactions/:id', authenticateToken, TransactionController.getById);
router.post('/transactions', authenticateToken, TransactionController.create);
router.post('/transactions/analyze', authenticateToken, TransactionController.analyze);
router.post('/transactions/simulate', authenticateToken, TransactionController.simulate);
router.post('/transactions/import', authenticateToken, TransactionController.bulkImport);
router.post('/transactions/:id/ai-explain', authenticateToken, TransactionController.aiExplain);

// --- Fraud Alerts Routes ---
router.get('/alerts', authenticateToken, AlertController.list);
router.get('/alerts/:id', authenticateToken, AlertController.getById);
router.patch('/alerts/:id/status', authenticateToken, AlertController.updateStatus);
router.patch('/alerts/:id/assign', authenticateToken, AlertController.assign);
router.post('/alerts/:id/notes', authenticateToken, AlertController.addNote);
router.post('/alerts/:id/create-case', authenticateToken, AlertController.createCaseFromAlert);

// --- Investigation Case Routes ---
router.get('/cases', authenticateToken, CaseController.list);
router.post('/cases', authenticateToken, CaseController.create);
router.get('/cases/:id', authenticateToken, CaseController.getById);
router.patch('/cases/:id', authenticateToken, CaseController.update);
router.post('/cases/:id/notes', authenticateToken, CaseController.addNote);
router.post('/cases/:id/evidence', authenticateToken, CaseController.addEvidence);
router.patch('/cases/:id/disposition', authenticateToken, CaseController.setDisposition);

// --- Analytics Routes ---
router.get('/analytics/overview', authenticateToken, AnalyticsController.getOverview);

// --- Compliance & Reports Routes ---
router.post('/reports/generate', authenticateToken, requireRole(['admin', 'compliance']), ComplianceController.generateReport);
router.get('/audit-events', authenticateToken, ComplianceController.listAuditEvents);

// --- Settings & Rules Routes ---
router.get('/settings', authenticateToken, SettingsController.getSettings);
router.patch('/settings', authenticateToken, requireRole('admin'), SettingsController.updateSettings);
router.get('/rules', authenticateToken, SettingsController.listRules);
router.patch('/rules/:id', authenticateToken, requireRole('admin'), SettingsController.updateRule);
router.get('/users', authenticateToken, requireRole('admin'), SettingsController.listUsers);
router.post('/users', authenticateToken, requireRole('admin'), SettingsController.createUser);
router.patch('/users/:id', authenticateToken, requireRole('admin'), SettingsController.updateUser);
router.post('/system/reset-demo', authenticateToken, requireRole('admin'), SettingsController.resetDemo);

// --- Notifications Routes ---
router.get('/notifications', authenticateToken, SettingsController.listNotifications);
router.patch('/notifications/read-all', authenticateToken, SettingsController.markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticateToken, SettingsController.markNotificationRead);

export default router;
