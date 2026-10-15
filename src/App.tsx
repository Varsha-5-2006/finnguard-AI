import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { TopNav } from './components/layout/TopNav.js';
import { OverviewView } from './views/OverviewView.js';
import { TransactionsView } from './views/TransactionsView.js';
import { AlertsView } from './views/AlertsView.js';
import { InvestigationsView } from './views/InvestigationsView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { ComplianceView } from './views/ComplianceView.js';
import { SettingsView } from './views/SettingsView.js';
import { AuthView } from './views/AuthView.js';
import { SimulatorModal } from './components/common/SimulatorModal.js';
import { TransactionDetailDrawer } from './components/common/TransactionDetailDrawer.js';
import { EvaluationModal } from './components/common/EvaluationModal.js';
import { RefreshCw } from 'lucide-react';
import { api } from './services/api.js';

function DashboardApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('finguard_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('finguard_sidebar_collapsed', collapsed ? 'true' : 'false');
  };

  // Enforce role-based view restrictions on tab change or persona switch
  useEffect(() => {
    if (!user) return;
    if (user.role === 'analyst') {
      if (currentTab === 'settings' || currentTab === 'compliance') {
        setCurrentTab('overview');
      }
    } else if (user.role === 'compliance') {
      if (currentTab === 'settings') {
        setCurrentTab('overview');
      }
    }
  }, [user, currentTab]);

  // Load summary alerts count
  useEffect(() => {
    if (!user) return;
    async function loadAlertsCount() {
      try {
        const res = await api.getDashboardSummary();
        setActiveAlertsCount(res.kpis?.activeAlertsCount || 0);
      } catch {
        // silent
      }
    }
    loadAlertsCount();
  }, [user, refreshKey]);

  // 12-second live feed background polling
  useEffect(() => {
    if (!user || !isLivePolling) return;
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, [user, isLivePolling]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 font-mono">
          Verifying Institutional Session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactionId(id);
  };

  const handleNavigateToCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('investigations');
  };

  const handleSimulatorSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Navigation Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeAlertsCount={activeAlertsCount}
        onOpenEvaluationModal={() => setIsEvaluationOpen(true)}
        collapsed={sidebarCollapsed}
        setCollapsed={handleToggleSidebar}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <TopNav
          currentTab={currentTab}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenEvaluationModal={() => setIsEvaluationOpen(true)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onNavigateTab={setCurrentTab}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          isLivePolling={isLivePolling}
          onToggleLivePolling={() => setIsLivePolling(prev => !prev)}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" key={refreshKey}>
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <OverviewView
                onSelectTransaction={handleSelectTransaction}
                onNavigateTab={setCurrentTab}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />
            )}
            {currentTab === 'transactions' && (
              <TransactionsView
                onSelectTransaction={handleSelectTransaction}
                externalSearch={globalSearch}
              />
            )}
            {currentTab === 'alerts' && (
              <AlertsView
                onSelectTransaction={handleSelectTransaction}
                onNavigateToCase={handleNavigateToCase}
              />
            )}
            {currentTab === 'investigations' && (
              <InvestigationsView
                onSelectTransaction={handleSelectTransaction}
                selectedCaseId={selectedCaseId}
              />
            )}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'compliance' && <ComplianceView />}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Real-time Attack Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={handleSimulatorSuccess}
      />

      {/* Reviewer Evaluation Persona Switcher */}
      <EvaluationModal
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        onPersonaSwitched={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Detailed Transaction Dossier Drawer */}
      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        onViewAlert={() => {
          setSelectedTransactionId(null);
          setCurrentTab('alerts');
        }}
        onViewCase={(caseId) => {
          setSelectedTransactionId(null);
          handleNavigateToCase(caseId);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardApp />
      </ToastProvider>
    </AuthProvider>
  );
}
