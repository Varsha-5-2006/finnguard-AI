import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Shield,
  Layers,
  Calculator,
} from 'lucide-react';
import { Modal } from './Modal.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { RiskBadge } from './RiskBadge.js';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { refreshNotifications } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'presets' | 'sandbox'>('presets');
  const [selectedScenario, setSelectedScenario] = useState<string>('crypto_drain_ato');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom Sandbox State
  const [customCustomer, setCustomCustomer] = useState<string>('Alex Rivera');
  const [customCustomerId, setCustomCustomerId] = useState<string>('CUST-8821');
  const [customAmount, setCustomAmount] = useState<number>(8500);
  const [customMerchant, setCustomMerchant] = useState<string>('BitPay Global Exchange');
  const [customCategory, setCustomCategory] = useState<string>('crypto');
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>('wire_transfer');
  const [customCity, setCustomCity] = useState<string>('Zurich');
  const [customCountry, setCustomCountry] = useState<string>('Switzerland');
  const [customFailedLogins, setCustomFailedLogins] = useState<number>(4);
  const [customVpnFlag, setCustomVpnFlag] = useState<boolean>(true);
  const [customPasswordReset, setCustomPasswordReset] = useState<boolean>(true);

  const scenarios = [
    {
      id: 'crypto_drain_ato',
      title: 'Account Takeover & Crypto Drain',
      tag: 'Critical Risk (90+)',
      tagColor: 'text-rose-600 bg-rose-50 border-rose-200',
      description: '$14,500 wire transfer initiated to offshore crypto OTC desk 1.5h after credential reset through a Tor/VPN exit node.',
      icon: Zap,
    },
    {
      id: 'velocity_spike',
      title: 'High-Frequency Velocity Burst',
      tag: 'High Risk (65+)',
      tagColor: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Multiple sequential high-value wire transfers ($1,950) executed in rapid succession within a 15-minute window.',
      icon: AlertTriangle,
    },
    {
      id: 'smurfing',
      title: 'Currency Structuring (Smurfing)',
      tag: 'Medium/High Risk (60+)',
      tagColor: 'text-amber-600 bg-amber-50 border-amber-200',
      description: '$9,850 deposit deliberately sized just below the mandatory $10,000 regulatory Currency Transaction Report (CTR) threshold.',
      icon: AlertTriangle,
    },
    {
      id: 'impossible_travel',
      title: 'Impossible Geolocation Jump',
      tag: 'High Risk (55+)',
      tagColor: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Card swipe in Singapore only 55 minutes after a confirmed in-person point-of-sale transaction in London.',
      icon: Sparkles,
    },
    {
      id: 'normal',
      title: 'Standard Legitimate Retail Transaction',
      tag: 'Low Risk (<15)',
      tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: '$42.50 physical contactless payment at neighborhood grocery store matching customer historical habits.',
      icon: ShieldCheck,
    },
  ];

  const handleSimulatePreset = async () => {
    setIsSimulating(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.simulateTransaction(selectedScenario);
      setResult(response);
      await refreshNotifications();
      toast.success(
        `Scenario "${scenarios.find(s => s.id === selectedScenario)?.title}" ingested. Risk score: ${response.transaction.riskScore}/100`,
        'Attack Simulation Processed'
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to simulate transaction');
      toast.error(err.message || 'Failed to simulate scenario');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCustomEvaluation = async (dryRun: boolean) => {
    if (!customAmount || customAmount <= 0) {
      setError('Please provide a valid transaction amount.');
      return;
    }

    setIsSimulating(true);
    setError(null);
    setResult(null);

    const payload = {
      customerId: customCustomerId || 'CUST-SANDBOX',
      customerName: customCustomer || 'Sandbox User',
      amount: Number(customAmount),
      currency: 'USD',
      merchant: customMerchant,
      merchantCategory: customCategory,
      paymentMethod: customPaymentMethod,
      location: {
        city: customCity,
        country: customCountry,
      },
      device: {
        deviceType: 'Browser Desktop',
        isVpn: customVpnFlag,
        isNewDevice: customVpnFlag,
      },
      metadata: {
        failedAttemptsPrior: Number(customFailedLogins),
        hoursSincePasswordChange: customPasswordReset ? 2 : 720,
        historicalAverageAmount: 350,
        isSimulated: true,
      },
    };

    try {
      if (dryRun) {
        const response = await api.analyzeTransaction(payload);
        setResult({
          transaction: {
            ...payload,
            transactionId: 'TXN-DRY-RUN',
            status: response.analysis.suggestedStatus,
            riskScore: response.analysis.riskScore,
            riskLevel: response.analysis.riskLevel,
            triggeredRules: response.analysis.triggeredRules,
            riskReasons: response.analysis.riskReasons,
            recommendedAction: response.analysis.recommendedAction,
          },
          isDryRun: true,
          alertCreated: response.analysis.riskScore >= 50,
        });
        toast.info(
          `Dry-run analysis completed. Computed score: ${response.analysis.riskScore}/100`,
          'Heuristic Calculation'
        );
      } else {
        const response = await api.createTransaction(payload);
        setResult(response);
        await refreshNotifications();
        toast.success(
          `Custom transaction ${response.transaction.transactionId} evaluated and saved to ledger. Risk score: ${response.transaction.riskScore}/100`,
          'Transaction Ingested'
        );
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process custom evaluation');
      toast.error(err.message || 'Evaluation error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Threat Simulator & Risk Sandbox"
      subtitle="DEMO ENVIRONMENT — Inject synthetic attack transactions or test custom heuristic risk parameters in real time."
      maxWidth="2xl"
    >
      {!result ? (
        <div className="space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('presets');
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attack Scenarios (1-Click)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sandbox');
                setError(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sandbox'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Rule Sandbox</span>
            </button>
          </div>

          {/* Preset Attack Scenarios Tab */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-xl text-[11px] text-cyan-900 leading-relaxed flex items-start gap-2">
                <Shield className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Synthetic Threat Injection:</span> Select an automated adversarial vector to fire against the 8 active detection rules, updating the real-time transaction ledger and triage alert queue.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {scenarios.map(s => {
                  const isSelected = selectedScenario === s.id;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedScenario(s.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-extrabold text-slate-900">{s.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.tagColor}`}>
                            {s.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleSimulatePreset}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Evaluating Heuristics...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Inject Threat Into Ledger</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Interactive Rule Sandbox Tab */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed flex items-start gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Live Heuristic Sandbox:</span> Calibrate custom transaction inputs to test rule threshold triggers and observe deterministic risk scoring behavior.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name:</label>
                  <input
                    type="text"
                    value={customCustomer}
                    onChange={e => setCustomCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount ($ USD):</label>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={e => setCustomAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Merchant / Recipient:</label>
                  <input
                    type="text"
                    value={customMerchant}
                    onChange={e => setCustomMerchant(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Merchant Category:</label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="crypto">Cryptocurrency Exchange (+20 risk)</option>
                    <option value="gambling">Online Gambling / Casino (+20 risk)</option>
                    <option value="luxury">Luxury Jewelry / Watches</option>
                    <option value="electronics">High-End Consumer Electronics</option>
                    <option value="retail">Standard Retail / Supermarket</option>
                    <option value="travel">Airline / Travel Agency</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method:</label>
                  <select
                    value={customPaymentMethod}
                    onChange={e => setCustomPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="wire_transfer">Wire Transfer (High Risk Vector)</option>
                    <option value="crypto">Cryptocurrency Address</option>
                    <option value="credit_card">Credit Card (Card-Not-Present)</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="debit_card">Debit Card / POS</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location (Country):</label>
                  <input
                    type="text"
                    value={customCountry}
                    onChange={e => setCustomCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              {/* Heuristic Toggle Indicators */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Adversarial Risk Signals & Device Telemetry:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={customVpnFlag}
                      onChange={e => setCustomVpnFlag(e.target.checked)}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">Tor/VPN IP Node (+15)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={customPasswordReset}
                      onChange={e => setCustomPasswordReset(e.target.checked)}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-800">Recent Password Reset (+25)</span>
                  </label>
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-700">Failed Logins:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={customFailedLogins}
                      onChange={e => setCustomFailedLogins(parseInt(e.target.value, 10) || 0)}
                      className="w-12 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={() => handleCustomEvaluation(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Calculate Only (Dry Run)
                  </button>
                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={() => handleCustomEvaluation(false)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Simulate & Ingest</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Evaluation Results View */
        <div className="space-y-4 animate-in fade-in duration-200">
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              result.isDryRun
                ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                result.isDryRun ? 'text-cyan-600' : 'text-emerald-600'
              }`}
            />
            <div>
              <h4 className="text-xs font-extrabold">
                {result.isDryRun
                  ? 'Sandbox Heuristic Calculation Complete (Dry Run)'
                  : 'Transaction Evaluated & Ingested into Live Ledger'}
              </h4>
              <p className="text-[11px] opacity-90 mt-0.5">
                {result.isDryRun
                  ? 'Computed scores and rule matches without saving to persistent storage.'
                  : 'Scored in real-time and broadcast to fraud alert listeners.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Reference Identifier
                </span>
                <p className="text-xs font-bold font-mono text-slate-900">
                  {result.transaction.transactionId}
                </p>
              </div>
              <RiskBadge
                score={result.transaction.riskScore}
                level={result.transaction.riskLevel}
                size="md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Customer:</span>{' '}
                <span className="font-semibold text-slate-800">{result.transaction.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400">Amount:</span>{' '}
                <span className="font-bold text-slate-900 font-mono">
                  {result.transaction.currency} {Number(result.transaction.amount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Merchant:</span>{' '}
                <span className="font-semibold text-slate-800">{result.transaction.merchant}</span>
              </div>
              <div>
                <span className="text-slate-400">Action:</span>{' '}
                <span className="font-bold text-rose-600 uppercase text-[10px]">
                  {result.transaction.recommendedAction}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Triggered Heuristic Rules ({result.transaction.triggeredRules.length}):
              </span>
              {result.transaction.triggeredRules.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2 bg-white rounded-xl border border-slate-200">
                  No suspicious rules triggered. Clean transaction.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {result.transaction.triggeredRules.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs p-2.5 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.reason}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        +{r.scoreContribution} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.alertCreated && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span className="font-medium">⚠️ Risk score exceeded automated threshold — Alert generated!</span>
                <span className="font-bold font-mono text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  ALERT QUEUED
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate Another Attack</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
