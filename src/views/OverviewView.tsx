import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  FolderCheck,
  Percent,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  FileCheck2,
  RefreshCw,
  Zap,
  Info,
  CheckCircle2,
  Shield,
  Search,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../services/api.js';
import { RiskBadge } from '../components/common/RiskBadge.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';

interface OverviewViewProps {
  onSelectTransaction: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSimulator: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onSelectTransaction,
  onNavigateTab,
  onOpenSimulator,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any | null>(null);
  const [trends, setTrends] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardTrends(),
      ]);
      setSummary(sumRes);
      setTrends(trendRes);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !summary || !trends) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
        <p className="text-sm font-semibold text-slate-600">Aggregating real-time financial telemetry...</p>
      </div>
    );
  }

  const { kpis, recentSuspicious, recentAlerts } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Institutional Monitoring Active
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">FinGuard Risk & Intelligence Engine</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Continuously analyzing incoming payments against 8 deterministic heuristic rules, velocity models, and impossible travel patterns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Triage Alerts ({kpis.activeAlertsCount})
          </button>
          {(user?.role === 'admin' || user?.role === 'compliance') ? (
            <button
              onClick={() => onNavigateTab('compliance')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              AML Report
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab('transactions')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-cyan-400" />
              Explore Ledger
            </button>
          )}
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Simulate Attack
          </button>
        </div>
      </div>

      {/* "How FinGuard AI Works" Educational Explainer Panel (Phase 5 requirement) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                How FinGuard AI Works
              </h3>
              <p className="text-[11px] text-slate-500">
                End-to-end autonomous fraud detection, heuristic scoring, and human investigation workflow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 cursor-pointer"
          >
            {showHowItWorks ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showHowItWorks && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center font-mono">1</span>
                <span>Ingestion</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Transaction enters the system via API or payment gateway.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center font-mono">2</span>
                <span>Evaluation</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                8 active detection rules examine velocity, amount & behavior.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center font-mono">3</span>
                <span>Risk Scoring</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Engine computes an explainable 0–100 score and assigns severity.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center font-mono">4</span>
                <span>Alert Triage</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Suspicious transfers (score ≥ 50) automatically spawn alerts.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center font-mono">5</span>
                <span>Investigation</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Analysts review evidence dossiers and generate Gemini AI briefs.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-700 font-bold text-[11px]">
                <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center font-mono">6</span>
                <span>Disposition</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Authorized decision records final status into append-only audit trail.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Txns */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Transactions Monitored</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {kpis.totalTransactions} <span className="text-xs text-slate-400 font-normal">txns</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">
            ${Math.round(kpis.totalVolume).toLocaleString()} USD
          </p>
        </div>

        {/* Suspicious Txns */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Suspicious Transactions</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">
            {kpis.suspiciousCount}
          </div>
          <p className="text-[11px] text-amber-700/80 font-medium mt-1">
            Score ≥ 50 Heuristic
          </p>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Critical Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">
            {kpis.highRiskAlertsCount}
          </div>
          <p className="text-[11px] text-rose-700/80 font-medium mt-1">
            Urgent review queue
          </p>
        </div>

        {/* Confirmed Fraud Cases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Confirmed Fraud</span>
            <FolderCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-600 font-mono">
            {kpis.confirmedFraudCasesCount}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Finalized dispositions
          </p>
        </div>

        {/* Loss Prevented */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Loss Prevented</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            ${Math.round(kpis.totalFraudValuePrevented).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700/80 font-medium mt-1">
            Blocked unauthorized
          </p>
        </div>

        {/* Detection Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-cyan-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Detection Rate</span>
            <Percent className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-black text-cyan-600 font-mono">
            {kpis.fraudDetectionRate}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            On reviewed items
          </p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time-series Volume Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaction Volume & Anomaly Trends</h3>
              <p className="text-xs text-slate-400">7-Day sliding telemetry: Legitimate vs Suspicious vs Blocked</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
              Live Aggregate
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.volumeOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSusp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="legitimate" name="Legitimate" stroke="#10b981" fillOpacity={1} fill="url(#colorLegit)" strokeWidth={2} />
                <Area type="monotone" dataKey="suspicious" name="Suspicious" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSusp)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" name="Blocked (Critical)" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlock)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Risk Band Distribution</h3>
              <span className="text-[10px] font-mono text-slate-400">Total Scored</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Breakdown across configurable risk severity thresholds</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trends.riskDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {trends.riskDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {trends.riskDistribution.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold font-mono ml-auto text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Suspicious Transactions & Latest Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Suspicious Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Suspicious Transactions</h3>
              <p className="text-xs text-slate-500">Transactions with score ≥ 40 requiring investigative vigilance</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
            >
              View All
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSuspicious.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No suspicious transactions logged.
                    </td>
                  </tr>
                ) : (
                  recentSuspicious.map((tx: any) => (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx.id)}
                      className="hover:bg-cyan-50/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-cyan-700">{tx.transactionId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{tx.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.merchant} <span className="text-[10px] text-slate-400">({tx.merchantCategory})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge score={tx.riskScore} level={tx.riskLevel} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs font-bold text-cyan-600 group-hover:underline">
                          Inspect →
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Alerts Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Alert Stream</h3>
                <p className="text-xs text-slate-500">Automated triage triggers</p>
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
              >
                Queue
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {recentAlerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No active alerts</div>
              ) : (
                recentAlerts.map((a: any) => (
                  <div
                    key={a.id}
                    onClick={() => onNavigateTab('alerts')}
                    className="p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-800">{a.alertId}</span>
                      <StatusBadge status={a.status} type="alert" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{a.category}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{a.customerName}</span>
                      <span className="font-mono font-bold text-slate-700">
                        ${a.amount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-500">
              Alerts auto-generated when risk score reaches 50+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
