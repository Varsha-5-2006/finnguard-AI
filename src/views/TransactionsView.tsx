import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  ArrowUpDown,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Transaction, RiskLevel, TransactionStatus } from '../types/index.js';
import { RiskBadge } from '../components/common/RiskBadge.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { useToast } from '../context/ToastContext.js';

interface TransactionsViewProps {
  onSelectTransaction: (id: string) => void;
  externalSearch?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onSelectTransaction,
  externalSearch = '',
}) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination State
  const [search, setSearch] = useState<string>(externalSearch);
  const [status, setStatus] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Import Modal State
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [importCsvText, setImportCsvText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  useEffect(() => {
    if (externalSearch) {
      setSearch(externalSearch);
    }
  }, [externalSearch]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        search,
        status,
        riskLevel,
        paymentMethod,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setTransactions(res.transactions);
      setTotalCount(res.pagination.total);
      setTotalVolume(res.summary.totalVolume);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, status, riskLevel, paymentMethod, sortBy, sortOrder, page]);

  const handleExportCsv = () => {
    window.location.href = '/api/transactions/export';
  };

  const handleProcessImport = async () => {
    if (!importCsvText.trim()) return;
    setIsImporting(true);
    setImportStatus(null);
    try {
      // Client-side parse of CSV rows
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must contain a header line and at least one data row.');
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const parsedTransactions: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;
        const values = rawLine.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });

        parsedTransactions.push({
          customerId: rowObj['customerid'] || rowObj['customer_id'] || `CUST-IMP-${i}`,
          customerName: rowObj['customername'] || rowObj['customer_name'] || 'Imported User',
          amount: parseFloat(rowObj['amount'] || '0'),
          currency: rowObj['currency'] || 'USD',
          merchant: rowObj['merchant'] || 'Imported Merchant',
          merchantCategory: rowObj['category'] || rowObj['merchantcategory'] || 'retail',
          location: {
            city: rowObj['city'] || 'New York',
            country: rowObj['country'] || 'United States',
          },
          paymentMethod: rowObj['paymentmethod'] || 'credit_card',
        });
      }

      const res = await api.importTransactions(parsedTransactions);
      setImportStatus(res);
      fetchTransactions();
      toast.success(
        `Successfully ingested ${res.summary?.importedCount || parsedTransactions.length} records. Automated risk scoring completed.`,
        'CSV Import Ingested'
      );
    } catch (err: any) {
      setImportStatus({ error: err.message });
      toast.error(err.message || 'Failed to parse and import CSV file');
    } finally {
      setIsImporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Counts */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID, customer, merchant, location..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Showing <span className="font-bold font-mono text-slate-900">{totalCount}</span> txns
            <span className="mx-1.5">•</span>
            Total: <span className="font-bold font-mono text-slate-900">${Math.round(totalVolume).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            CSV Import
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters:
        </div>

        {/* Risk Level */}
        <select
          value={riskLevel}
          onChange={e => {
            setRiskLevel(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical (75-100)</option>
          <option value="high">High (50-74)</option>
          <option value="medium">Medium (25-49)</option>
          <option value="low">Low (0-24)</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="flagged">Flagged</option>
          <option value="blocked">Blocked</option>
          <option value="under_review">Under Review</option>
        </select>

        {/* Payment Method */}
        <select
          value={paymentMethod}
          onChange={e => {
            setPaymentMethod(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="all">All Payment Methods</option>
          <option value="credit_card">Credit Card</option>
          <option value="wire_transfer">Wire Transfer</option>
          <option value="crypto">Cryptocurrency</option>
          <option value="debit_card">Debit Card</option>
          <option value="digital_wallet">Digital Wallet</option>
        </select>

        {/* Sort Order */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="timestamp">Date & Time</option>
            <option value="amount">Amount</option>
            <option value="riskScore">Risk Score</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Merchant & Class</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
                    <span>Loading transactions ledger...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx.id)}
                    className="hover:bg-cyan-50/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">{tx.transactionId}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.customerId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{tx.merchant}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{tx.merchantCategory}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {tx.location.city}, {tx.location.country}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge score={tx.riskScore} level={tx.riskLevel} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button className="text-cyan-600 font-bold hover:underline flex items-center gap-1 ml-auto">
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Page <span className="font-bold text-slate-800">{page}</span> of{' '}
            <span className="font-bold text-slate-800">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportStatus(null);
        }}
        title="Batch Import Financial Transactions (CSV)"
        subtitle="Upload or paste comma-delimited transaction records to run heuristic scoring and ingestion."
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Paste CSV Data or Sample:</label>
            <textarea
              rows={6}
              value={importCsvText}
              onChange={e => setImportCsvText(e.target.value)}
              placeholder={`customerId,customerName,amount,merchant,category,city,country,paymentMethod
CUST-109,Victor Vance,12000.00,Binance OTC,crypto,Zurich,Switzerland,wire_transfer
CUST-402,Alice Walker,45.50,Whole Foods,groceries,Seattle,United States,credit_card
CUST-781,Raj Patel,9900.00,Macau Chips,gambling,Macau,Macau,credit_card`}
              className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Required headers: amount, merchant. Optional: customerId, customerName, category, city, country.</span>
            <button
              type="button"
              onClick={() =>
                setImportCsvText(`customerId,customerName,amount,merchant,category,city,country,paymentMethod
CUST-109,Victor Vance,12000.00,Binance OTC,crypto,Zurich,Switzerland,wire_transfer
CUST-402,Alice Walker,45.50,Whole Foods,groceries,Seattle,United States,credit_card
CUST-781,Raj Patel,9900.00,Macau Chips,gambling,Macau,Macau,credit_card`)
              }
              className="text-cyan-600 font-semibold hover:underline cursor-pointer"
            >
              Insert Demo CSV Sample
            </button>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                importStatus.error
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {importStatus.error ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importStatus.error}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Import completed successfully!</span>
                  </div>
                  <p>
                    Imported: {importStatus.summary?.importedCount} txns | Skipped: {importStatus.summary?.skippedDuplicates} duplicates | Alerts Generated: {importStatus.summary?.alertCount}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isImporting || !importCsvText.trim()}
              onClick={handleProcessImport}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Process & Ingest
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
