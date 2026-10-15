import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';
import { RiskLevel } from '../../types/index.js';

interface RiskBadgeProps {
  score: number;
  level?: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  level,
  size = 'md',
  showIcon = true,
}) => {
  const computedLevel: RiskLevel =
    level ||
    (score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low');

  const config = {
    low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Low Risk',
      icon: ShieldCheck,
      ring: 'ring-emerald-500/20',
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Medium Risk',
      icon: AlertTriangle,
      ring: 'ring-amber-500/20',
    },
    high: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      label: 'High Risk',
      icon: ShieldAlert,
      ring: 'ring-orange-500/20',
    },
    critical: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
      dot: 'bg-rose-600',
      label: 'Critical Risk',
      icon: AlertOctagon,
      ring: 'ring-rose-500/30',
    },
  }[computedLevel];

  const IconComponent = config.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.ring}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span className="font-mono">{score}/100</span>
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${config.bg} shadow-xs`}
      >
        {showIcon && <IconComponent className="w-6 h-6 shrink-0" />}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight font-mono">{score}</span>
            <span className="text-xs opacity-75 font-medium font-mono">/ 100</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider">{config.label}</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${config.bg} shadow-xs`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span className="font-mono">{score}</span>
      <span className="opacity-70 font-normal">| {config.label}</span>
    </span>
  );
};
