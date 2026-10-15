import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  AlertTriangle,
  FolderSearch2,
  LineChart,
  FileCheck2,
  Sliders,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeAlertsCount?: number;
  onOpenEvaluationModal: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  activeAlertsCount = 0,
  onOpenEvaluationModal,
  collapsed,
  setCollapsed,
}) => {
  const { user, logout, isDemoSession } = useAuth();
  const userRole = user?.role || 'analyst';

  // Role-based navigation matrix
  // Admin: full access
  // Analyst: Overview, Transactions, Alerts, Investigations, Analytics
  // Compliance: Overview, Transactions, Alerts, Investigations, Analytics, Compliance
  const allNavItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'analyst', 'compliance'],
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ReceiptText,
      allowedRoles: ['admin', 'analyst', 'compliance'],
    },
    {
      id: 'alerts',
      label: 'Fraud Alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      allowedRoles: ['admin', 'analyst', 'compliance'],
    },
    {
      id: 'investigations',
      label: 'Investigations',
      icon: FolderSearch2,
      allowedRoles: ['admin', 'analyst', 'compliance'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: LineChart,
      allowedRoles: ['admin', 'analyst', 'compliance'],
    },
    {
      id: 'compliance',
      label: 'Compliance Reports',
      icon: FileCheck2,
      allowedRoles: ['admin', 'compliance'], // Restricted from Analyst
    },
    {
      id: 'settings',
      label: 'Settings & Rules',
      icon: Sliders,
      allowedRoles: ['admin'], // Restricted from Analyst and Compliance
    },
  ];

  const visibleNavItems = allNavItems.filter(item =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <aside
      className={`${
        collapsed ? 'w-18' : 'w-64'
      } bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transition-all duration-200 z-30`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 px-4 border-b border-slate-800/80 flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0 ring-1 ring-white/10">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">FinGuard</span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono">
                  AI
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase truncate">
                Risk & Fraud Intelligence
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Workspace
          </div>
        )}
        {visibleNavItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-2.5'
              } rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono shrink-0">
                  {item.badge}
                </span>
              )}

              {/* Collapsed Badge Dot */}
              {collapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
              )}
            </button>
          );
        })}

        {/* Collapsed Sidebar Expand Button */}
        {collapsed && (
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </nav>

      {/* Demo Evaluation Mode Pill */}
      {isDemoSession && (
        <div className={`p-3 mx-3 mb-3 bg-slate-900/90 border border-slate-800 rounded-2xl ${collapsed ? 'text-center p-2' : ''}`}>
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Demo Mode
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 capitalize font-bold">
                  {user?.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Reviewer evaluation mode active with synthetic demo data.
              </p>
              <button
                onClick={onOpenEvaluationModal}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Switch Review Persona</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenEvaluationModal}
              title="Reviewer Evaluation Mode"
              className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer mx-auto block"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* User Info & Logout Card */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden ring-1 ring-white/10">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user?.name?.[0] || 'U')
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize font-medium">
                {user?.role} Officer
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={logout}
            title="Sign out of FinGuard"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
