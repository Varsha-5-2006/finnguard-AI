import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MapPin,
  CreditCard,
  User,
  Building,
  Clock,
  Laptop,
  CheckCircle2,
  RefreshCw,
  AlertOctagon,
  FileText,
} from 'lucide-react';
import { Transaction, FraudAlert, InvestigationCase } from '../../types/index.js';
import { RiskBadge } from './RiskBadge.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';

interface TransactionDetailDrawerProps {
  transactionId: string | null;
  onClose: () => void;
  onViewAlert?: (alertId: string) => void;
  onViewCase?: (caseId: string) => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transactionId,
  onClose,
  onViewAlert,
  onViewCase,
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<{
    transaction: Transaction;
    customerHistory: Transaction[];
    linkedAlert?: FraudAlert;
    linkedCase?: InvestigationCase;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiText, setAiText] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setData(null);
      setAiText(null);
      return;
    }

    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await api.getTransactionById(transactionId!);
        setData(res);
        if (res.transaction.aiExplanation) {
          setAiText(res.transaction.aiExplanation);
        }
      } catch (err) {
        console.error('Failed to load transaction detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [transactionId]);

  if (!transactionId) return null;

  const handleGenerateAi = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const res = await api.getAiExplanation(data.transaction.id);
      setAiText(res.analysis);
      toast.success('AI fraud intelligence narrative generated.', 'Analysis Ready');
    } catch (err: any) {
      console.error('Failed to generate AI analysis:', err);
      toast.error(err.message || 'Failed to generate AI analysis');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-400">
                  {data?.transaction.transactionId || 'TRANSACTION'}
                </span>
                {data && <StatusBadge status={data.transaction.status} />}
              </div>
              <h2 className="text-lg font-black mt-1">Transaction Risk Dossier</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
                <p className="text-xs font-medium">Retrieving transaction intelligence...</p>
              </div>
            ) : data ? (
              <>
                {/* Top Risk Score Banner */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Computed Fraud Risk Score
                    </span>
                    <RiskBadge
                      score={data.transaction.riskScore}
                      level={data.transaction.riskLevel}
                      size="lg"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Transaction Amount
                    </span>
                    <div className="text-2xl font-black font-mono text-slate-900">
                      {data.transaction.currency} {data.transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-xs text-slate-500 capitalize">
                      Method: {data.transaction.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* AI Executive Intelligence Analysis */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400 border border-cyan-500/30">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold tracking-tight">AI Fraud Intelligence Assessment</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Gemini 3.8 Flash
                    </span>
                  </div>

                  {aiText ? (
                    <div className="text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-line bg-white/5 p-3.5 rounded-xl border border-white/10 font-sans">
                      {aiText}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Generate an institutional-grade crime investigation brief synthesizing behavioral anomalies, account history, and transaction heuristics.
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateAi}
                        disabled={aiLoading}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Synthesizing with Gemini...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            Generate AI Fraud Brief
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Triggered Rules Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-slate-500" />
                      Active Heuristics Triggered ({data.transaction.triggeredRules.length})
                    </h3>
                  </div>

                  {data.transaction.triggeredRules.length === 0 ? (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Clean transaction: No fraud heuristic indicators triggered against baseline.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.transaction.triggeredRules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xs text-slate-900">{rule.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">[{rule.code}]</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{rule.reason}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                            +{rule.scoreContribution} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Attributes Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Customer Profile
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400">Name:</span>{' '}
                        <span className="font-bold text-slate-900">{data.transaction.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Customer ID:</span>{' '}
                        <span className="font-mono text-slate-700">{data.transaction.customerId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Origin:</span>{' '}
                        <span className="text-slate-700">
                          {data.transaction.location.city}, {data.transaction.location.country}
                        </span>
                      </div>
                      {data.transaction.location.ipAddress && (
                        <div>
                          <span className="text-slate-400">IP Address:</span>{' '}
                          <span className="font-mono text-slate-700">{data.transaction.location.ipAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Merchant & Terminal
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400">Merchant:</span>{' '}
                        <span className="font-bold text-slate-900">{data.transaction.merchant}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Category:</span>{' '}
                        <span className="capitalize text-slate-700">{data.transaction.merchantCategory}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Timestamp:</span>{' '}
                        <span className="text-slate-700">{new Date(data.transaction.timestamp).toLocaleString()}</span>
                      </div>
                      {data.transaction.device && (
                        <div>
                          <span className="text-slate-400">Device:</span>{' '}
                          <span className="text-slate-700">
                            {data.transaction.device.deviceType || 'Browser'} {data.transaction.device.isVpn ? '(VPN)' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linked Alerts or Cases */}
                {(data.linkedAlert || data.linkedCase) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Linked Risk Records
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.linkedAlert && (
                        <div
                          onClick={() => onViewAlert && onViewAlert(data.linkedAlert!.id)}
                          className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl hover:border-amber-300 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold text-amber-800">
                              {data.linkedAlert.alertId}
                            </span>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{data.linkedAlert.category}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-amber-700" />
                        </div>
                      )}
                      {data.linkedCase && (
                        <div
                          onClick={() => onViewCase && onViewCase(data.linkedCase!.id)}
                          className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl hover:border-purple-300 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold text-purple-800">
                              {data.linkedCase.caseId}
                            </span>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{data.linkedCase.title}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-purple-700" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Recent History */}
                {data.customerHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Customer Prior Activity ({data.customerHistory.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {data.customerHistory.map(tx => (
                        <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-slate-900">{tx.transactionId}</span>
                              <span className="text-slate-500">• {tx.merchant}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900">
                              ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <RiskBadge score={tx.riskScore} size="sm" showIcon={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Deterministic rule evaluation recorded in audit trail.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
