import React from 'react';
import { LayoutDashboard, History, Settings, Activity, Sparkles } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'transactions' | 'diagnostics' | 'settings' | 'demo';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const DesktopNavTabs: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Soundbox Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Transaction History', icon: History },
    { id: 'diagnostics' as ActiveTab, label: 'Device Diagnostics', icon: Activity },
    { id: 'settings' as ActiveTab, label: 'Voice & App Settings', icon: Settings },
    { id: 'demo' as ActiveTab, label: 'Hackathon Demo Hub', icon: Sparkles, highlight: true },
  ];

  return (
    <div className="hidden md:flex border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center space-x-2 py-3.5 px-4 text-xs font-semibold border-b-2 transition ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              } ${tab.highlight && !isActive ? 'text-indigo-600' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : tab.highlight ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.highlight && (
                <span className="px-1.5 py-0.2 bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] text-white font-bold rounded-full uppercase tracking-wider">
                  Live
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MobileBottomNav: React.FC<NavigationProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Soundbox', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'History', icon: History },
    { id: 'demo' as ActiveTab, label: 'Demo', icon: Sparkles, highlight: true },
    { id: 'diagnostics' as ActiveTab, label: 'Diagnostics', icon: Activity },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold bg-indigo-50/50'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : tab.highlight ? 'text-purple-600' : 'text-slate-400'}`} />
                {tab.highlight && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
