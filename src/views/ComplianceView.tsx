import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Printer,
  History,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.js';
import { AuditEvent } from '../types/index.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const ComplianceView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>('aml_sar_quarterly');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportTitle, setReportTitle] = useState<string>('Quarterly AML Risk & SAR Readiness Report');

  // Generated Report Preview
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Audit Events Log
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(true);
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('all');
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const fetchAuditEvents = async () => {
    setAuditLoading(true);
    try {
      const res = await api.getAuditEvents({
        actorRole: auditRoleFilter,
        targetEntity: auditEntityFilter,
        search: auditSearch,
        limit: 50,
      });
      setAuditEvents(res.auditEvents || []);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [auditRoleFilter, auditEntityFilter, auditSearch]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateComplianceReport({
        reportType,
        startDate,
        endDate,
        title: reportTitle,
      });
      setGeneratedReport(res.report);
      setIsPreviewOpen(true);
      fetchAuditEvents();
      toast.success(`Dossier "${res.report.title}" generated successfully.`, 'Compliance Report Compiled');
    } catch (err: any) {
      toast.error('Report generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
              Institutional AML / BSA Governance
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900">Compliance & Regulatory Audit Dossiers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compile formal transaction reviews, suspicious activity summaries (SAR), and maintain append-only audit histories.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
          <span className="block font-bold text-slate-700">Governance Role: {user?.role.toUpperCase()}</span>
          <span>Append-Only Audit Logging Active</span>
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-600" />
          Generate Compliance Assessment Report
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Report Template / Profile:</label>
            <select
              value={reportType}
              onChange={e => {
                setReportType(e.target.value);
                if (e.target.value === 'aml_sar_quarterly') {
                  setReportTitle('Quarterly AML Risk & SAR Readiness Report');
                } else if (e.target.value === 'fraud_incident_brief') {
                  setReportTitle('Executive High-Value Fraud Incident Briefing');
                } else {
                  setReportTitle('System Security & Action Audit Trail');
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
            >
              <option value="aml_sar_quarterly">AML / BSA Suspicious Activity (SAR) Summary</option>
              <option value="fraud_incident_brief">Critical Fraud Losses Prevented Dossier</option>
              <option value="audit_trail_export">System Governance & Administrative Audit Trail</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
              Generate Report Dossier
            </button>
          </div>
        </div>
      </div>

      {/* Append-Only Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Append-Only System & Analyst Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Append-only historical event log tracking authentication, triage decisions, case resolutions, and rule alterations.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={auditRoleFilter}
              onChange={e => setAuditRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="analyst">Analyst</option>
              <option value="compliance">Compliance</option>
            </select>
            <select
              value={auditEntityFilter}
              onChange={e => setAuditEntityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Targets</option>
              <option value="transaction">Transaction</option>
              <option value="alert">Alert</option>
              <option value="case">Case</option>
              <option value="setting">Setting</option>
              <option value="auth">Auth</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-600 mb-1" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : auditEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                auditEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{evt.actorName}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{evt.actorRole}</div>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-cyan-800 text-[11px]">
                      {evt.action}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-slate-600">
                      {evt.targetEntity} <span className="font-mono text-[10px] text-slate-400">({evt.entityId})</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-md">{evt.details}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {evt.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Report Preview Modal */}
      {isPreviewOpen && generatedReport && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={generatedReport.title}
          subtitle={`Report Ref: ${generatedReport.reportId} | Period: ${generatedReport.period.startDate} to ${generatedReport.period.endDate}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs print:p-0">
            {/* Report Header */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                  FinGuard AI Institutional Compliance
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">{generatedReport.title}</h3>
                <p className="text-slate-400 text-[11px]">
                  Generated on {new Date(generatedReport.generatedAt).toLocaleString()} by {generatedReport.generatedBy.name} ({generatedReport.generatedBy.role})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
              </div>
            </div>

            {/* Aggregated Figures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Monitored</span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {generatedReport.summary.totalTransactionsMonitored} txns
                </span>
                <p className="text-[10px] text-slate-500 font-mono">
                  ${Math.round(generatedReport.summary.totalMonitoredVolume).toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <span className="text-amber-700 block text-[10px] uppercase font-bold">Flagged Anomalies</span>
                <span className="text-lg font-black font-mono text-amber-800">
                  {generatedReport.summary.flaggedTransactionsCount}
                </span>
                <p className="text-[10px] text-amber-700/80">Score ≥ 50 Heuristics</p>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <span className="text-rose-700 block text-[10px] uppercase font-bold">Confirmed Fraud</span>
                <span className="text-lg font-black font-mono text-rose-800">
                  {generatedReport.summary.confirmedFraudCasesCount} cases
                </span>
                <p className="text-[10px] text-rose-700/80">
                  ${Math.round(generatedReport.summary.confirmedFraudLossPrevented).toLocaleString()} blocked
                </p>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900">
                <span className="text-cyan-700 block text-[10px] uppercase font-bold">Audit Events</span>
                <span className="text-lg font-black font-mono text-cyan-800">
                  {generatedReport.summary.auditEventsLoggedCount}
                </span>
                <p className="text-[10px] text-cyan-700/80">Recorded actions</p>
              </div>
            </div>

            {/* High-Risk Highlights */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Flagged High-Risk Incident Highlights
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {generatedReport.highRiskHighlights.map((h: any) => (
                  <div key={h.transactionId} className="p-3 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{h.transactionId}</span>
                        <span className="font-semibold text-slate-700">• {h.customerName}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Rules: {h.triggeredRules.join(', ')}
                      </p>
                      <p className="text-rose-600 text-[11px] font-semibold mt-0.5">
                        Action: {h.recommendedAction}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 block">
                        ${h.amount.toLocaleString()} {h.currency}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                        Score: {h.riskScore} ({h.riskLevel})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Disclaimer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
              {generatedReport.regulatoryNote}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
