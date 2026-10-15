import React, { useState } from 'react';
import { Shield, Sparkles, UserCheck, ShieldAlert, FileCheck2, Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { UserRole } from '../../types/index.js';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonaSwitched?: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  onPersonaSwitched,
}) => {
  const { user, demoLogin } = useAuth();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const personas = [
    {
      role: 'analyst' as UserRole,
      title: 'Senior Fraud Analyst',
      name: 'Marcus Vance',
      email: 'analyst@finguard.ai',
      icon: ShieldAlert,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
      description: 'Primary workflow: Monitor real-time transaction ledger, triage risk alerts, investigate cases, add evidence notes, and run Gemini AI crime briefs.',
      permissions: ['Transaction Monitoring', 'Fraud Alert Triage', 'Investigation Dossiers', 'AI Risk Explanations', 'Risk Analytics'],
    },
    {
      role: 'compliance' as UserRole,
      title: 'Chief Compliance & AML Officer',
      name: 'Elena Rostova',
      email: 'compliance@finguard.ai',
      icon: FileCheck2,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      description: 'Oversight workflow: Inspect cases, review final dispositions, generate AML/SAR regulatory reports, and examine immutable audit event trails.',
      permissions: ['AML / SAR Report Generation', 'Audit Trail Inspection', 'Case Disposition Reviews', 'Compliance Analytics'],
    },
    {
      role: 'admin' as UserRole,
      title: 'System Administrator & VP Risk',
      name: 'Sarah Jenkins',
      email: 'admin@finguard.ai',
      icon: Sliders,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      description: 'Governance workflow: Calibrate heuristic rule weights, adjust auto-alert and block thresholds, manage institutional user accounts, and reset demo data.',
      permissions: ['Heuristic Weight Calibration', 'Rule Toggles (Enable/Disable)', 'Threshold Configuration', 'User Administration', 'Database Demo Reset'],
    },
  ];

  const { toast } = useToast();

  const handleSelectRole = async (targetRole: UserRole) => {
    if (user?.role === targetRole) {
      onClose();
      return;
    }
    setLoadingRole(targetRole);
    try {
      await demoLogin(targetRole);
      const chosen = personas.find(p => p.role === targetRole);
      toast.success(`Switched role to ${chosen?.title || targetRole} (${chosen?.name})`, 'Persona Switched');
      if (onPersonaSwitched) onPersonaSwitched();
      onClose();
    } catch (err: any) {
      toast.error('Failed to switch persona: ' + err.message);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Reviewer — Evaluation Persona Switcher"
      subtitle="DEMO ENVIRONMENT — Authenticates against the backend demo-login API to test role-based access control."
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl leading-relaxed">
          <span className="font-bold">Synthetic Evaluation Data:</span> All transactions, alerts, and customer names displayed in this workspace are synthetic test records created for testing the FinGuard AI heuristic engine and AML reporting pipeline.
        </div>

        <div className="grid grid-cols-1 gap-3">
          {personas.map(p => {
            const isCurrent = user?.role === p.role;
            const Icon = p.icon;
            return (
              <div
                key={p.role}
                onClick={() => handleSelectRole(p.role)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${p.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                          Active Persona
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">
                      {p.name} ({p.email})
                    </p>
                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{p.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    disabled={Boolean(loadingRole)}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {loadingRole === p.role ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : null}
                    <span>{isCurrent ? 'Current' : 'Select'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
