import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
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
import {
  LineChart,
  ShieldAlert,
  Globe,
  PieChart as PieIcon,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api.js';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<string>('30d');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await api.getAnalyticsOverview(timeframe);
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [timeframe]);

  if (loading || !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
        <p className="text-xs font-semibold text-slate-600">Compiling risk intelligence analytics...</p>
      </div>
    );
  }

  const { topRules, categoryRisk, geographicRisk, caseOutcomes, metrics } = data;

  return (
    <div className="space-y-6">
      {/* Analytics Header & Timeframe Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Fraud Intelligence & Pattern Analytics</h2>
          <p className="text-xs text-slate-500">
            Empirical telemetry on rule activations, merchant attack vectors, and resolution cycle times.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {['7d', '30d', '90d', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                timeframe === t ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Time' : `Last ${t.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Confirmed Fraud Rate
          </span>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {metrics.confirmedFraudRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Of reviewed cases</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            False Positive Rate
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            {metrics.falsePositiveRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Legitimate overrides</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Mean Time to Resolve
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {metrics.avgResolutionTimeHours} <span className="text-xs text-slate-400 font-normal">hours</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Triage through closure</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Cases Closed
          </span>
          <div className="text-2xl font-black text-cyan-700 font-mono mt-1">
            {metrics.totalReviewed}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">With audit trails</p>
        </div>
      </div>

      {/* Charts Row 1: Top Triggered Rules & Case Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Triggered Heuristics Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Triggered Heuristic Rules</h3>
              <p className="text-xs text-slate-400">Frequency of rule activations across all evaluated transactions</p>
            </div>
            <span className="text-[11px] font-bold text-cyan-600">Weighted Heuristics</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRules}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={150}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="triggerCount" name="Triggers" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Outcomes Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Investigation Case Outcomes</h3>
            <p className="text-xs text-slate-400 mb-4">Final human disposition ratio</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseOutcomes}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {caseOutcomes.map((entry: any, index: number) => (
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

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {caseOutcomes.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{item.value} cases</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row 2: Merchant Category Risk & Geolocation Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Category Risk Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Merchant Category Risk Matrix</h3>
            <p className="text-xs text-slate-500">Volume and anomaly concentration by sector</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Merchant Class</th>
                  <th className="py-3 px-4 text-right">Transactions</th>
                  <th className="py-3 px-4 text-right">Total Monitored ($)</th>
                  <th className="py-3 px-4 text-right">High-Risk Txns</th>
                  <th className="py-3 px-4 text-right">Risk %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryRisk.slice(0, 6).map((cat: any) => (
                  <tr key={cat.category} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{cat.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{cat.totalTransactions}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 font-semibold">
                      ${cat.totalValue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-bold">
                      {cat.highRiskTransactions}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          cat.riskRate >= 40
                            ? 'bg-rose-50 text-rose-700'
                            : cat.riskRate >= 20
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {cat.riskRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Hotspots */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Geographic Threat Concentrations</h3>
            <p className="text-xs text-slate-500">Cross-border origins ranked by anomaly count</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Jurisdiction / Country</th>
                  <th className="py-3 px-4 text-right">Total Transferred</th>
                  <th className="py-3 px-4 text-right">Flagged Anomalies</th>
                  <th className="py-3 px-4 text-right">Avg Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {geographicRisk.slice(0, 6).map((geo: any) => (
                  <tr key={geo.country} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {geo.country}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{geo.total}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                      {geo.flagged}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-mono font-bold text-slate-800">{geo.avgRiskScore}/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
