import React from 'react';
import { Volume2, Sparkles, User, HelpCircle } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDeviceStore } from '../../stores/useDeviceStore';
import { DeviceConnectionStatus } from '../../types/event';
import { speechManager } from '../../services/announcement/speechManager';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo, onOpenOnboarding }) => {
  const { settings } = useSettingsStore();
  const { connectionStatus } = useDeviceStore();

  const handleTestVoice = async () => {
    const testText = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई। पच्चीस रुपये प्राप्त हुए।'
      : 'Soundless UPI. Twenty-five rupees received.';
    await speechManager.testVoice(testText, settings.voice);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-b border-surface-border shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
        
        {/* Merchant Info & Status Indicator */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-navy-dark text-white flex items-center justify-center shrink-0 font-extrabold text-sm shadow-subtle">
            <Volume2 className="w-5 h-5 text-secondary-fixed" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-text-primary truncate">
                {settings.merchant.businessName}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container font-bold text-text-secondary shrink-0">
                Kirana
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-primary animate-pulse" />
                <span className="font-bold uppercase tracking-wider">Live</span>
              </div>
              <span className="text-text-muted font-medium truncate">Soundless Soundbox</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Voice Ping Button */}
          <button
            onClick={handleTestVoice}
            aria-label="Sound Volume Test"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-text-primary hover:bg-slate-200 active:scale-95 transition-transform cursor-pointer"
            title="Ping Voice Test"
          >
            <Volume2 className="w-4 h-4 text-emerald-primary" />
          </button>

          {/* Hackathon Demo Launcher */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-primary hover:bg-emerald-600 text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
            title="Open Demo Hub"
          >
            <Sparkles className="w-3.5 h-3.5 text-secondary-fixed" />
            <span>Demo</span>
          </button>

          {/* Setup / Wizard Trigger */}
          <button
            onClick={onOpenOnboarding}
            className="w-8 h-8 rounded-full bg-navy-dark flex items-center justify-center text-white shrink-0 hover:bg-slate-800 transition cursor-pointer"
            title="Setup Wizard"
          >
            <User className="w-4 h-4 text-slate-200" />
          </button>

        </div>

      </div>
    </header>
  );
};
