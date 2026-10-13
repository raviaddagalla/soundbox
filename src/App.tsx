import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { TrustBanner } from './components/layout/TrustBanner';
import { DesktopNavTabs, MobileBottomNav, ActiveTab } from './components/layout/Navigation';
import { DashboardView } from './features/dashboard/DashboardView';
import { TransactionListView } from './features/transactions/TransactionListView';
import { SettingsView } from './features/settings/SettingsView';
import { DiagnosticsView } from './features/diagnostics/DiagnosticsView';
import { SavingsView } from './features/savings/SavingsView';
import { OnboardingModal } from './features/onboarding/OnboardingModal';
import { DemoControlModal } from './features/demo/DemoControlModal';
import { useSettingsStore } from './stores/useSettingsStore';
import { useTransactionStore } from './stores/useTransactionStore';
import { useDeviceStore } from './stores/useDeviceStore';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const { settings, isLoaded: settingsLoaded, loadSettings } = useSettingsStore();
  const { loadTransactions } = useTransactionStore();
  const { initPairingListeners, loadDiagnosticLogs } = useDeviceStore();

  useEffect(() => {
    loadSettings();
    loadTransactions();
    loadDiagnosticLogs();
    initPairingListeners();
  }, [loadSettings, loadTransactions, loadDiagnosticLogs, initPairingListeners]);

  useEffect(() => {
    if (settingsLoaded && !settings.merchant.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [settingsLoaded, settings.merchant.onboardingCompleted]);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'demo') {
      setShowDemoModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-surface-background text-text-primary flex flex-col font-sans pb-20 md:pb-10">
      
      {/* 1. Trust & Compliance Banner */}
      <div className="pt-16">
        <TrustBanner />
      </div>

      {/* 2. Top App Bar */}
      <Navbar
        onOpenDemo={() => setShowDemoModal(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* 3. Desktop Navigation Tabs */}
      <DesktopNavTabs activeTab={activeTab} onChangeTab={handleTabChange} />

      {/* 4. Canonical View Body (Mobile-friendly max width matching handheld specification) */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenDemo={() => setShowDemoModal(true)}
            onOpenOnboarding={() => setShowOnboarding(true)}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onNavigateDiagnostics={() => setActiveTab('diagnostics')}
            onNavigateSavings={() => setActiveTab('savings')}
          />
        )}

        {activeTab === 'transactions' && <TransactionListView />}

        {activeTab === 'settings' && <SettingsView />}

        {activeTab === 'diagnostics' && <DiagnosticsView />}

        {activeTab === 'savings' && <SavingsView />}
      </main>

      {/* 5. Mobile Shell Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

      {/* 6. Merchant Setup Wizard */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* 7. Hackathon Demo Hub */}
      <DemoControlModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />

    </div>
  );
};

export default App;
