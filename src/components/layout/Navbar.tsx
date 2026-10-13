import React from 'react';
import { Volume2, Play, Pause, RotateCcw, Smartphone, Sparkles, HelpCircle } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useDeviceStore } from '../../stores/useDeviceStore';
import { DeviceConnectionStatus } from '../../types/event';
import { speechManager } from '../../services/announcement/speechManager';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo, onOpenOnboarding }) => {
  const { settings, toggleActiveListening } = useSettingsStore();
  const { repeatLastAnnouncement } = useTransactionStore();
  const { connectionStatus } = useDeviceStore();

  const isListening = settings.merchant.activeListening;

  const handleTestVoice = async () => {
    const testText = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई परीक्षण आवाज। पच्चीस रुपये प्राप्त हुए।'
      : 'Soundless UPI voice test. Twenty-five rupees received.';
    await speechManager.testVoice(testText, settings.voice);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Shop */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">Soundless</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">UPI</span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] sm:max-w-[220px]">
                {settings.merchant.businessName}
              </p>
            </div>
          </div>

          {/* Center: Device Connection Status */}
          <div className="hidden md:flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : connectionStatus === DeviceConnectionStatus.SIMULATED_DEMO
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <Smartphone className="w-3.5 h-3.5" />
              <span>
                {connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE
                  ? 'Companion Connected'
                  : connectionStatus === DeviceConnectionStatus.SIMULATED_DEMO
                  ? 'Demo Simulation'
                  : 'Web Standalone'}
              </span>
            </div>
          </div>

          {/* Right: Soundbox Quick Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Active Listening Toggle */}
            <button
              onClick={toggleActiveListening}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                isListening
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
              }`}
              title={isListening ? 'Click to Pause Soundbox' : 'Click to Resume Soundbox'}
            >
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Listening</span>
                  <Pause className="w-3 h-3 ml-0.5 opacity-80" />
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Paused</span>
                  <Play className="w-3 h-3 ml-0.5" />
                </>
              )}
            </button>

            {/* Test Voice Button */}
            <button
              onClick={handleTestVoice}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              title="Test Voice Announcement"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Voice</span>
            </button>

            {/* Repeat Last Announcement */}
            <button
              onClick={() => repeatLastAnnouncement()}
              className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
              title="Repeat Last Payment Announcement"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Quick Demo Simulator Trigger */}
            <button
              onClick={onOpenDemo}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-300 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-spin" />
              <span>Demo</span>
            </button>

            {/* Help / Setup Guide */}
            <button
              onClick={onOpenOnboarding}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition"
              title="Setup Guide & Onboarding"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
