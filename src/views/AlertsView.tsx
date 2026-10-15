import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  UserCheck,
  FolderPlus,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api.js';
import { FraudAlert, AlertStatus, AlertSeverity } from '../types/index.js';
import { RiskBadge } from '../components/common/RiskBadge.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface AlertsViewProps {
  onSelectTransaction: (id: string) => void;
  onNavigateToCase: (caseId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  onSelectTransaction,
  onNavigateToCase,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Selected Alert for Details/Actions Modal
  const [activeAlert, setActiveAlert] = useState<FraudAlert | null>(null);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Escalate to Case Modal
  const [isEscalateOpen, setIsEscalateOpen] = useState<boolean>(false);
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [caseDesc, setCaseDesc] = useState<string>('');
  const [casePriority, setCasePriority] = useState<string>('high');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts({
        status: statusFilter,
        severity: severityFilter,
        search,
      });
      setAlerts(res.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, search]);

  const handleUpdateStatus = async (alertId: string, status: AlertStatus, outcome?: string) => {
    setIsSubmitting(true);
    try {
      await api.updateAlertStatus(alertId, status, newNoteText, outcome);
      setNewNoteText('');
      fetchAlerts();
      if (activeAlert?.id === alertId) {
        const updated = await api.getAlertById(alertId);
        setActiveAlert(updated.alert);
      }
      toast.success(`Alert status updated to "${status.replace('_', ' ')}"${outcome ? ` (${outcome})` : ''}.`, 'Alert Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update alert status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignToMe = async (alertId: string) => {
    if (!user) return;
    try {
      await api.assignAlert(alertId, user.id);
      fetchAlerts();
      if (activeAlert?.id === alertId) {
        const updated = await api.getAlertById(alertId);
        setActiveAlert(updated.alert);
      }
      toast.success(`Alert assigned to ${user.name}.`, 'Assignment Recorded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign alert');
    }
  };

  const handleAddNote = async (alertId: string) => {
    if (!newNoteText.trim()) return;
    try {
      await api.addAlertNote(alertId, newNoteText);
      setNewNoteText('');
      const updated = await api.getAlertById(alertId);
      setActiveAlert(updated.alert);
      fetchAlerts();
      toast.success('Investigation note appended to alert.', 'Note Recorded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    }
  };

  const handleEscalateCase = async () => {
    if (!activeAlert) return;
    setIsSubmitting(true);
    try {
      const res = await api.createCaseFromAlert(activeAlert.id, {
        title: caseTitle || `Investigation: ${activeAlert.category}`,
        description: caseDesc || activeAlert.recommendedAction,
        priority: casePriority,
      });
      setIsEscalateOpen(false);
      fetchAlerts();
      toast.success(`Alert escalated to formal investigation case ${res.case.caseId}.`, 'Case Created');
      onNavigateToCase(res.case.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to escalate case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'new', label: 'New', count: alerts.filter(a => a.status === 'new').length },
    { id: 'acknowledged', label: 'Acknowledged' },
    { id: 'under_investigation', label: 'Investigating' },
    { id: 'escalated', label: 'Escalated' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter & Status Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Severity Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alert ID, customer, merchant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-400 font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Grid / Table */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
            <span>Loading active alert queue...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No alerts match current criteria.
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => setActiveAlert(alert)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Left Column: ID & Threat Title */}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {alert.alertId}
                  </span>
                  <StatusBadge status={alert.status} type="alert" />
                  <span className="text-[11px] text-slate-400">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate">{alert.category}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  Triggered rules: {alert.triggeredRules.map(r => r.name).join(', ')}
                </p>
              </div>

              {/* Middle: Transaction Context */}
              <div className="text-xs space-y-0.5 md:border-l md:pl-4 border-slate-100 shrink-0">
                <div className="font-semibold text-slate-800">
                  {alert.transactionRef.customerName}
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  ${alert.transactionRef.amount.toLocaleString()} {alert.transactionRef.currency}
                </div>
                <div className="text-[11px] text-slate-400">
                  @ {alert.transactionRef.merchant}
                </div>
              </div>

              {/* Right: Risk Badge & Assignee */}
              <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assignee</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {alert.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>
                <RiskBadge score={alert.riskScore} size="md" />
                <button
                  type="button"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Manage →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Action / Dossier Modal */}
      {activeAlert && (
        <Modal
          isOpen={Boolean(activeAlert)}
          onClose={() => setActiveAlert(null)}
          title={`Alert Triage: ${activeAlert.alertId}`}
          subtitle={`${activeAlert.category} • Score: ${activeAlert.riskScore}/100`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Status Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Status</span>
                <StatusBadge status={activeAlert.status} type="alert" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned To</span>
                <span className="font-bold text-slate-800">
                  {activeAlert.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
              <RiskBadge score={activeAlert.riskScore} size="md" />
            </div>

            {/* Transaction Reference & Quick Link */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Associated Transaction</span>
                <button
                  onClick={() => {
                    const txId = activeAlert.transactionId;
                    setActiveAlert(null);
                    onSelectTransaction(txId);
                  }}
                  className="text-cyan-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  Inspect Transaction Dossier
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer:</span>
                  <span className="font-semibold text-slate-800">{activeAlert.transactionRef.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Amount:</span>
                  <span className="font-bold font-mono text-slate-900">
                    ${activeAlert.transactionRef.amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Merchant:</span>
                  <span className="font-semibold text-slate-800">{activeAlert.transactionRef.merchant}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Timestamp:</span>
                  <span>{new Date(activeAlert.transactionRef.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-rose-700">
                Recommended Investigator Action
              </span>
              <p className="leading-relaxed">{activeAlert.recommendedAction}</p>
            </div>

            {/* Notes Thread */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Investigator Notes ({activeAlert.notes?.length || 0})</span>
              <div className="max-h-36 overflow-y-auto space-y-2 divide-y divide-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {activeAlert.notes?.length === 0 ? (
                  <p className="text-slate-400 italic">No notes added yet.</p>
                ) : (
                  activeAlert.notes.map(note => (
                    <div key={note.id} className="pt-2 first:pt-0">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold text-slate-700">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{note.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Append triage note..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
                <button
                  type="button"
                  onClick={() => handleAddNote(activeAlert.id)}
                  disabled={!newNoteText.trim()}
                  className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!activeAlert.assignedTo && (
                  <button
                    onClick={() => handleAssignToMe(activeAlert.id)}
                    className="px-3 py-1.5 bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold rounded-xl hover:bg-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assign to Me
                  </button>
                )}
                {activeAlert.status === 'new' && (
                  <button
                    onClick={() => handleUpdateStatus(activeAlert.id, 'acknowledged')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Acknowledge
                  </button>
                )}
                {activeAlert.status !== 'under_investigation' && activeAlert.status !== 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(activeAlert.id, 'under_investigation')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl cursor-pointer"
                  >
                    Mark Investigating
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCaseTitle(`Case: ${activeAlert.category} (${activeAlert.alertId})`);
                    setCaseDesc(activeAlert.recommendedAction);
                    setIsEscalateOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Escalate to Case
                </button>
                {activeAlert.status !== 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(activeAlert.id, 'resolved', 'confirmed_fraud')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Escalate to Case Modal */}
      {isEscalateOpen && activeAlert && (
        <Modal
          isOpen={isEscalateOpen}
          onClose={() => setIsEscalateOpen(false)}
          title="Escalate Alert to Investigation Case"
          subtitle={`Creates formal case dossier for Alert ${activeAlert.alertId} and attaches transaction evidence.`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Case Title:</label>
              <input
                type="text"
                value={caseTitle}
                onChange={e => setCaseTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Investigation Objective / Description:</label>
              <textarea
                rows={3}
                value={caseDesc}
                onChange={e => setCaseDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Case Priority:</label>
              <select
                value={casePriority}
                onChange={e => setCasePriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="urgent">Urgent (Immediate Freeze)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEscalateOpen(false)}
                className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleEscalateCase}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Create Investigation Case
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
