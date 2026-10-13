import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Mic,
  Smartphone,
  PiggyBank,
  Sparkles
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'transactions' | 'settings' | 'diagnostics' | 'savings' | 'demo';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const DesktopNavTabs: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Payments', icon: Receipt },
    { id: 'settings' as ActiveTab, label: 'Voice', icon: Mic },
    { id: 'diagnostics' as ActiveTab, label: 'Setup', icon: Smartphone },
    { id: 'savings' as ActiveTab, label: 'Savings', icon: PiggyBank },
    { id: 'demo' as ActiveTab, label: 'Demo Hub', icon: Sparkles, highlight: true },
  ];

  return (
    <div className="hidden md:flex border-b border-surface-border bg-white mt-16 sticky top-16 z-30">
      <div className="max-w-xl mx-auto px-4 w-full flex space-x-1 justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center space-x-1.5 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                isActive
                  ? 'border-emerald-primary text-emerald-primary bg-emerald-50/50'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              } ${tab.highlight && !isActive ? 'text-emerald-primary' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-primary' : tab.highlight ? 'text-emerald-primary' : 'text-text-muted'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MobileBottomNav: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Payments', icon: Receipt },
    { id: 'settings' as ActiveTab, label: 'Voice', icon: Mic },
    { id: 'diagnostics' as ActiveTab, label: 'Setup', icon: Smartphone },
    { id: 'savings' as ActiveTab, label: 'Savings', icon: PiggyBank },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-surface-border px-2 py-1 shadow-lg">
      <div className="max-w-xl mx-auto grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'text-emerald-primary font-bold'
                  : 'text-text-muted hover:text-text-primary font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-primary' : 'text-text-muted'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
