export type UserRole = 'admin' | 'analyst' | 'compliance';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'suspended';
  title?: string;
  createdAt: string;
  lastLogin?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TriggeredRule {
  code: string;
  name: string;
  description: string;
  scoreContribution: number;
  reason: string;
  severity: RiskLevel;
}

export type TransactionStatus = 'completed' | 'flagged' | 'blocked' | 'under_review';
export type ReviewedOutcome = 'pending' | 'confirmed_fraud' | 'legitimate' | 'inconclusive';

export interface Transaction {
  id: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  timestamp: string;
  merchant: string;
  merchantCategory: string;
  location: {
    city: string;
    country: string;
    ipAddress?: string;
    latitude?: number;
    longitude?: number;
  };
  paymentMethod: 'credit_card' | 'wire_transfer' | 'ach' | 'crypto' | 'debit_card' | 'digital_wallet';
  status: TransactionStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  triggeredRules: TriggeredRule[];
  riskReasons: string[];
  recommendedAction: string;
  reviewedOutcome: ReviewedOutcome;
  aiExplanation?: string;
  notes?: string;
  linkedAlertId?: string;
  linkedCaseId?: string;
  device?: {
    deviceType?: string;
    fingerprint?: string;
    isVpn?: boolean;
    isNewDevice?: boolean;
  };
  metadata?: {
    failedAttemptsPrior?: number;
    hoursSincePasswordChange?: number;
    historicalAverageAmount?: number;
    isSimulated?: boolean;
  };
  createdAt: string;
  createdBy?: string;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'under_investigation' | 'escalated' | 'resolved' | 'dismissed';

export interface AlertNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface FraudAlert {
  id: string;
  alertId: string;
  transactionId: string;
  transactionRef: {
    amount: number;
    currency: string;
    customerName: string;
    customerId: string;
    merchant: string;
    timestamp: string;
  };
  riskScore: number;
  severity: AlertSeverity;
  category: string;
  triggeredRules: TriggeredRule[];
  status: AlertStatus;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  recommendedAction: string;
  notes: AlertNote[];
  caseId?: string;
  resolution?: {
    outcome: 'confirmed_fraud' | 'false_positive' | 'legitimate_override' | 'dismissed';
    comment?: string;
    resolvedBy?: string;
    resolvedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type CaseStatus = 'open' | 'in_progress' | 'escalated' | 'closed';
export type CaseDisposition = 'pending' | 'confirmed_fraud' | 'legitimate_activity' | 'inconclusive';

export interface CaseEvidence {
  id: string;
  type: 'document' | 'ip_lookup' | 'customer_affidavit' | 'card_network_chargeback' | 'device_telemetry';
  title: string;
  description: string;
  addedBy: string;
  addedAt: string;
}

export interface CaseTimelineItem {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface InvestigationCase {
  id: string;
  caseId: string;
  title: string;
  description: string;
  priority: CasePriority;
  status: CaseStatus;
  disposition: CaseDisposition;
  dispositionNotes?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  transactionIds: string[];
  alertIds: string[];
  evidence: CaseEvidence[];
  notes: AlertNote[];
  timeline: CaseTimelineItem[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: 'transaction' | 'alert' | 'case' | 'user' | 'setting' | 'auth' | 'compliance_report';
  entityId: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'alert' | 'case' | 'system' | 'security';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DetectionRuleConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'amount' | 'velocity' | 'location' | 'behavior' | 'account' | 'merchant';
  weight: number;
  isEnabled: boolean;
  thresholdValue?: number;
  unit?: string;
}

export interface SystemSettings {
  riskBands: {
    lowMax: number;     // e.g. 24
    mediumMax: number;  // e.g. 49
    highMax: number;    // e.g. 74
  };
  autoAlertThreshold: number; // e.g. 50
  autoBlockThreshold: number; // e.g. 85
  currency: string;
  demoSimulatorIntervalSeconds: number;
  maintenanceMode: boolean;
}
