import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Ban,
  Clock,
  Flame,
  CheckCheck,
  XCircle,
  FileSearch,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'transaction' | 'alert' | 'case';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'transaction' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Transaction statuses
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Completed',
          icon: CheckCircle2,
        };
      case 'flagged':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Flagged',
          icon: AlertCircle,
        };
      case 'blocked':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
          label: 'Blocked',
          icon: Ban,
        };
      case 'under_review':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          label: 'Under Review',
          icon: Clock,
        };

      // Alert statuses
      case 'new':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          label: 'New Alert',
          icon: Flame,
        };
      case 'acknowledged':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Acknowledged',
          icon: Clock,
        };
      case 'under_investigation':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'Investigating',
          icon: FileSearch,
        };
      case 'escalated':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
          label: 'Escalated',
          icon: AlertCircle,
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Resolved',
          icon: CheckCheck,
        };
      case 'dismissed':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          label: 'Dismissed',
          icon: XCircle,
        };

      // Case statuses / dispositions
      case 'open':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
          label: 'Open Case',
          icon: Clock,
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'In Progress',
          icon: FileSearch,
        };
      case 'closed':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Closed',
          icon: CheckCheck,
        };
      case 'confirmed_fraud':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          label: 'Confirmed Fraud',
          icon: Ban,
        };
      case 'legitimate_activity':
      case 'legitimate':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Legitimate Activity',
          icon: CheckCircle2,
        };
      case 'inconclusive':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-300',
          label: 'Inconclusive',
          icon: AlertCircle,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: status.replace(/_/g, ' '),
          icon: Clock,
        };
    }
  };

  const { bg, label, icon: Icon } = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} transition-colors capitalize`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
