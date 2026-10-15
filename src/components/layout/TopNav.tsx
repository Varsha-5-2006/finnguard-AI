import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Sparkles,
  Zap,
  Check,
  LogOut,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface TopNavProps {
  currentTab: string;
  onOpenSimulator: () => void;
  onOpenEvaluationModal: () => void;
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
  onNavigateTab: (tab: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLivePolling?: boolean;
  onToggleLivePolling?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onOpenSimulator,
  onOpenEvaluationModal,
  globalSearch,
  setGlobalSearch,
  onNavigateTab,
  onRefresh,
  isRefreshing = false,
  isLivePolling = true,
  onToggleLivePolling,
}) => {
  const {
    user,
    logout,
    isDemoSession,
    notifications,
    unreadNotifsCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Executive Fraud Dashboard',
      subtitle: 'Real-time transaction telemetry, risk scoring, and active threat monitors',
    },
    transactions: {
      title: 'Transaction Monitoring & Ledger',
      subtitle: 'Inspect live financial transfers, filter anomalies, and run heuristic evaluations',
    },
    alerts: {
      title: 'Fraud Alert Queue',
      subtitle: 'Triage, assign, and escalate automated high-risk transaction alerts',
    },
    investigations: {
      title: 'Investigation Case Workspace',
      subtitle: 'Manage active fraud cases, collaborate on evidence, and record final dispositions',
    },
    analytics: {
      title: 'Risk Intelligence & Analytics',
      subtitle: 'Deep-dive fraud distribution trends, merchant vectors, and rule efficacy',
    },
    compliance: {
      title: 'AML & Compliance Reporting',
      subtitle: 'Generate regulatory audit dossiers and inspect the append-only action trail',
    },
    settings: {
      title: 'Detection Engine Configuration',
      subtitle: 'Fine-tune heuristic scoring weights, calibrate thresholds, and administer users',
    },
  };

  const currentInfo = tabTitles[currentTab] || { title: 'FinGuard AI', subtitle: 'Fraud Detection' };

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 z-20 shrink-0">
      {/* Title & Subtitle */}
      <div className="min-w-0 flex-1">
        <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate flex items-center gap-2">
          {currentInfo.title}
        </h1>
        <p className="text-[11px] text-slate-500 hidden sm:block truncate leading-tight">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Prominent Demo Environment Indicator */}
        {isDemoSession && (
          <button
            type="button"
            onClick={onOpenEvaluationModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer group shadow-2xs"
            title="Click to view Reviewer Evaluation Personas"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="hidden lg:inline">DEMO ENVIRONMENT</span>
            <span className="font-mono text-[10px] text-amber-700 font-semibold hidden md:inline">
              SYNTHETIC DATA
            </span>
            <Sparkles className="w-3 h-3 text-amber-600 group-hover:rotate-12 transition-transform shrink-0" />
          </button>
        )}

        {/* Real-time Polling & Refresh Toggle */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={onToggleLivePolling}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isLivePolling
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Toggle automatic 12s live data polling"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLivePolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{isLivePolling ? 'Live Feed: On' : 'Live: Paused'}</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh telemetry now"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search txn, customer..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            className="w-40 lg:w-48 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all font-sans"
          />
        </div>

        {/* Threat Simulator Action Button */}
        <button
          type="button"
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer shadow-xs"
          title="Inject synthetic test transaction"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-cyan-400" />
          <span className="hidden sm:inline">Threat Simulator</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-900">
                  System Alerts ({unreadNotifsCount} new)
                </span>
                {unreadNotifsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[10px] text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) {
                          setShowNotifs(false);
                          if (n.link === '/alerts') onNavigateTab('alerts');
                          if (n.link === '/investigations') onNavigateTab('investigations');
                          if (n.link === '/compliance') onNavigateTab('compliance');
                        }
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-cyan-50/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-slate-900 text-[11px]">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu with Explicit Logout */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                (user?.name?.[0] || 'U')
              )}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {user?.name}
              </p>
              <span className="text-[10px] font-semibold text-cyan-700 capitalize">
                {user?.role} Role
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-40 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold uppercase">
                  {user?.role}
                </span>
              </div>
              {isDemoSession && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenEvaluationModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-cyan-700 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Switch Reviewer Persona</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors cursor-pointer font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
