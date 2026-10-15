import React, { useState, useEffect } from 'react';
import {
  FolderSearch2,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  User,
  Shield,
  Upload,
  RefreshCw,
  ExternalLink,
  Ban,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api.js';
import { InvestigationCase, CaseStatus, CasePriority, CaseDisposition } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface InvestigationsViewProps {
  onSelectTransaction: (id: string) => void;
  selectedCaseId?: string;
}

export const InvestigationsView: React.FC<InvestigationsViewProps> = ({
  onSelectTransaction,
  selectedCaseId,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dispositionFilter, setDispositionFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Active Case Detail Workspace
  const [activeCase, setActiveCase] = useState<InvestigationCase | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState<boolean>(false);
  const [caseTransactions, setCaseTransactions] = useState<any[]>([]);

  // Modals
  const [isNewCaseOpen, setIsNewCaseOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('medium');

  // Add Evidence Modal
  const [isEvidenceOpen, setIsEvidenceOpen] = useState<boolean>(false);
  const [evTitle, setEvTitle] = useState<string>('');
  const [evDesc, setEvDesc] = useState<string>('');
  const [evType, setEvType] = useState<string>('document');

  // Disposition Modal
  const [isDispositionOpen, setIsDispositionOpen] = useState<boolean>(false);
  const [selectedDisposition, setSelectedDisposition] = useState<CaseDisposition>('confirmed_fraud');
  const [dispositionNotes, setDispositionNotes] = useState<string>('');

  // Note Input
  const [noteInput, setNoteInput] = useState<string>('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.getCases({
        status: statusFilter,
        priority: priorityFilter,
        disposition: dispositionFilter,
        search,
      });
      setCases(res.cases);
      if (selectedCaseId && !activeCase) {
        loadCaseDetail(selectedCaseId);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetail = async (id: string) => {
    setCaseDetailLoading(true);
    try {
      const res = await api.getCaseById(id);
      setActiveCase(res.case);
      setCaseTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setCaseDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter, dispositionFilter, search]);

  const handleCreateCase = async () => {
    if (!newTitle || !newDesc) return;
    try {
      const res = await api.createCase({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
      });
      setIsNewCaseOpen(false);
      setNewTitle('');
      setNewDesc('');
      fetchCases();
      loadCaseDetail(res.case.id);
      toast.success(`Investigation case ${res.case.caseId} opened.`, 'Case Initialized');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create case');
    }
  };

  const handleAddEvidence = async () => {
    if (!activeCase || !evTitle || !evDesc) return;
    try {
      await api.addCaseEvidence(activeCase.id, {
        title: evTitle,
        description: evDesc,
        type: evType,
      });
      setIsEvidenceOpen(false);
      setEvTitle('');
      setEvDesc('');
      loadCaseDetail(activeCase.id);
      fetchCases();
      toast.success('Forensic evidence attached to case dossier.', 'Evidence Attached');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add evidence');
    }
  };

  const handleAddNote = async () => {
    if (!activeCase || !noteInput.trim()) return;
    try {
      await api.addCaseNote(activeCase.id, noteInput.trim());
      setNoteInput('');
      loadCaseDetail(activeCase.id);
      toast.success('Investigator note logged to case timeline.', 'Note Logged');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    }
  };

  const handleSetDisposition = async () => {
    if (!activeCase) return;
    try {
      await api.setCaseDisposition(activeCase.id, selectedDisposition, dispositionNotes);
      setIsDispositionOpen(false);
      setDispositionNotes('');
      loadCaseDetail(activeCase.id);
      fetchCases();
      toast.success(`Final disposition recorded as "${selectedDisposition.replace('_', ' ').toUpperCase()}".`, 'Case Closed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to set disposition');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case ID, title, investigator..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          {/* Disposition Filter */}
          <select
            value={dispositionFilter}
            onChange={e => setDispositionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
          >
            <option value="all">All Dispositions</option>
            <option value="pending">Pending</option>
            <option value="confirmed_fraud">Confirmed Fraud</option>
            <option value="legitimate_activity">Legitimate Activity</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewCaseOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Open New Case
        </button>
      </div>

      {/* Main Layout: Case List on Left, Case Workspace on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Cases List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Investigation Dossiers ({cases.length})</span>
            <span>Priority</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-600 mb-2" />
              <span className="text-xs">Loading cases...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No cases matching filters.
            </div>
          ) : (
            cases.map(c => {
              const isSelected = activeCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => loadCaseDetail(c.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-cyan-500/30'
                      : 'bg-white hover:border-slate-300 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {c.caseId}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        c.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : c.priority === 'high'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold leading-snug line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {c.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-slate-100/10">
                    <StatusBadge status={c.disposition !== 'pending' ? c.disposition : c.status} />
                    <span className={`text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {c.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Detailed Workspace (7 cols) */}
        <div className="lg:col-span-7">
          {activeCase ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
              {/* Workspace Header */}
              <div className="border-b border-slate-100 pb-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                      {activeCase.caseId}
                    </span>
                    <StatusBadge status={activeCase.status} />
                    {activeCase.disposition !== 'pending' && (
                      <StatusBadge status={activeCase.disposition} />
                    )}
                  </div>

                  {activeCase.status !== 'closed' && (
                    <button
                      onClick={() => setIsDispositionOpen(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Record Final Disposition
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{activeCase.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activeCase.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Investigator</span>
                    <span className="font-semibold text-slate-800">{activeCase.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Created</span>
                    <span className="text-slate-700">{new Date(activeCase.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Evidence Records</span>
                    <span className="font-bold text-slate-900">{activeCase.evidence?.length || 0} items</span>
                  </div>
                </div>

                {activeCase.dispositionNotes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-800">Final Investigator Disposition Decision:</span>
                    <p className="text-slate-600">{activeCase.dispositionNotes}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      Finalized by {activeCase.closedBy || 'Investigator'} on {activeCase.closedAt ? new Date(activeCase.closedAt).toLocaleString() : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Linked Financial Transactions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Financial Transactions ({caseTransactions.length})
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {caseTransactions.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No linked transactions.</div>
                  ) : (
                    caseTransactions.map(tx => (
                      <div
                        key={tx.id}
                        onClick={() => onSelectTransaction(tx.id)}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-700">{tx.transactionId}</span>
                            <span className="font-semibold text-slate-800">{tx.customerName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {tx.merchant} ({tx.location.city}, {tx.location.country})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            ${tx.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-cyan-600 font-bold group-hover:underline">
                            Inspect Dossier →
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Evidence Repository */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Evidence Repository ({activeCase.evidence?.length || 0})
                  </h4>
                  <button
                    onClick={() => setIsEvidenceOpen(true)}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach Evidence
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {(!activeCase.evidence || activeCase.evidence.length === 0) ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                      No formal evidence attached yet.
                    </div>
                  ) : (
                    activeCase.evidence.map(ev => (
                      <div key={ev.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{ev.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                            {ev.type}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{ev.description}</p>
                        <span className="text-[10px] text-slate-400 block pt-1">
                          Added by {ev.addedBy} on {new Date(ev.addedAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Audit Investigation Timeline
                </h4>
                <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-4 text-xs">
                  {activeCase.timeline?.map(item => (
                    <div key={item.id} className="relative">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 absolute -left-[21px] top-1 ring-4 ring-white" />
                      <div className="flex items-center justify-between text-slate-500 text-[11px] mb-0.5">
                        <span className="font-bold text-slate-800">{item.action}</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600">{item.details}</p>
                      <span className="text-[10px] text-slate-400">Actor: {item.actor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Notes Thread */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Internal Investigator Notes ({activeCase.notes?.length || 0})
                </h4>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                  {activeCase.notes?.map(note => (
                    <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-700">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 leading-snug">{note.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Record investigative note..."
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteInput.trim()}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-40 cursor-pointer"
                  >
                    Post Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <FolderSearch2 className="w-12 h-12 stroke-[1.2] text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Case Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select an investigation dossier from the left or create a new case to review evidence and finalize dispositions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {isNewCaseOpen && (
        <Modal
          isOpen={isNewCaseOpen}
          onClose={() => setIsNewCaseOpen(false)}
          title="Open New Investigation Case"
          subtitle="Initialize a formal fraud investigation dossier for analyst review."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Case Title:</label>
              <input
                type="text"
                placeholder="e.g. Syndicate Crypto Draining Investigation"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Scope & Objectives:</label>
              <textarea
                rows={3}
                placeholder="Describe suspicious vectors, customer anomalies, and preliminary findings..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority:</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewCaseOpen(false)}
                className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCase}
                disabled={!newTitle || !newDesc}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
              >
                Create Case Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Evidence Modal */}
      {isEvidenceOpen && (
        <Modal
          isOpen={isEvidenceOpen}
          onClose={() => setIsEvidenceOpen(false)}
          title="Attach Investigation Evidence"
          subtitle="Record forensic artifacts, IP lookups, customer affidavits, or dispute documentation."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Evidence Title:</label>
              <input
                type="text"
                placeholder="e.g. Sworn Fraud Affidavit / Tor Node IP Lookup"
                value={evTitle}
                onChange={e => setEvTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Artifact Type:</label>
              <select
                value={evType}
                onChange={e => setEvType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="document">Legal / Bank Document</option>
                <option value="ip_lookup">IP Geolocation & ISP Intelligence</option>
                <option value="customer_affidavit">Customer Sworn Affidavit</option>
                <option value="device_telemetry">Hardware / Device Telemetry</option>
                <option value="card_network_chargeback">Visa/Mastercard Dispute ARN</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Evidence Details & Findings:</label>
              <textarea
                rows={4}
                placeholder="Paste telemetry findings, reference numbers, or investigator commentary..."
                value={evDesc}
                onChange={e => setEvDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEvidenceOpen(false)}
                className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEvidence}
                disabled={!evTitle || !evDesc}
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
              >
                Attach Artifact
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Final Disposition Modal */}
      {isDispositionOpen && (
        <Modal
          isOpen={isDispositionOpen}
          onClose={() => setIsDispositionOpen(false)}
          title="Record Final Case Disposition"
          subtitle="Final human determination. Synchronizes outcomes across all linked transactions and alerts."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Investigator Decision:</label>
              <div className="space-y-2">
                {[
                  { id: 'confirmed_fraud', label: 'Confirmed Fraud', desc: 'Illegal unauthorized activity confirmed. Chargebacks filed and funds blocked.' },
                  { id: 'legitimate_activity', label: 'Legitimate Activity', desc: 'Customer verified authorization. Override rule flags and clear account.' },
                  { id: 'inconclusive', label: 'Inconclusive', desc: 'Insufficient customer response or evidence. Archived with caution.' },
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      selectedDisposition === opt.id
                        ? 'border-cyan-500 bg-cyan-50/40 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="disposition"
                      checked={selectedDisposition === opt.id}
                      onChange={() => setSelectedDisposition(opt.id as CaseDisposition)}
                      className="mt-0.5 text-cyan-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{opt.label}</span>
                      <span className="text-[11px] text-slate-500">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Disposition Notes / Regulatory Filing Summary:</label>
              <textarea
                rows={3}
                placeholder="Summarize reasons for disposition decision and any follow-up actions..."
                value={dispositionNotes}
                onChange={e => setDispositionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDispositionOpen(false)}
                className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetDisposition}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Confirm & Close Case
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
