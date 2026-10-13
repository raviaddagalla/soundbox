import React, { useState } from 'react';
import {
  Volume2,
  Sliders,
  Bell,
  Shield,
  Moon,
  Trash2,
  Save,
  Check,
  RotateCcw,
  Smartphone,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SUPPORTED_LANGUAGES } from '../../services/announcement/templates';
import { speechManager } from '../../services/announcement/speechManager';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateVoice,
    toggleSource,
    updateDeduplication,
    updatePrivacy,
    updateMerchant,
    resetToDefaults
  } = useSettingsStore();

  const [savedBanner, setSavedBanner] = useState(false);

  const showSaved = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleTestVoiceAudio = async () => {
    const testSample = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई। सौ रुपये प्राप्त हुए।'
      : 'Payment received, one hundred rupees.';
    await speechManager.testVoice(testSample, settings.voice);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Soundbox & App Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure announcement speech, supported apps, deduplication, and privacy preferences
          </p>
        </div>

        {savedBanner && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-1 animate-fade">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </span>
        )}
      </div>

      {/* 1. Voice Announcement Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center space-x-2 text-indigo-700 pb-3 border-b border-slate-100">
          <Volume2 className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">Voice Announcement Engine</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Announcement Language</label>
            <select
              value={settings.voice.language}
              onChange={(e) => {
                updateVoice({ language: e.target.value as any });
                showSaved();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Object.values(SUPPORTED_LANGUAGES).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Speech Speed</span>
              <span className="text-indigo-600 font-bold">{settings.voice.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={settings.voice.speechRate}
              onChange={(e) => {
                updateVoice({ speechRate: parseFloat(e.target.value) });
                showSaved();
              }}
              className="w-full accent-indigo-600 mt-2"
            />
          </div>

          {/* Announcement Template */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Spoken Announcement Template (use <code className="text-indigo-600 font-mono">{"{amount}"}</code> placeholder)
            </label>
            <input
              type="text"
              value={settings.voice.announcementTemplate}
              onChange={(e) => {
                updateVoice({ announcementTemplate: e.target.value });
                showSaved();
              }}
              placeholder="Payment received, {amount}"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Test Voice Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleTestVoiceAudio}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-2"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice Announcement</span>
          </button>
        </div>

      </div>

      {/* 2. Notification Sources Allowlist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-700 pb-3 border-b border-slate-100">
          <Bell className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">Supported Payment Applications</h3>
        </div>

        <p className="text-xs text-slate-500">
          Enable or disable notification monitoring for individual UPI payment providers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.values(settings.sources).map((src) => (
            <div
              key={src.packageName}
              className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50"
            >
              <div>
                <span className="font-bold text-xs text-slate-800">{src.displayName}</span>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{src.packageName}</p>
              </div>
              <input
                type="checkbox"
                checked={src.enabled}
                onChange={(e) => {
                  toggleSource(src.packageName, e.target.checked);
                  showSaved();
                }}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Deduplication Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-700 pb-3 border-b border-slate-100">
          <RotateCcw className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">Deduplication & False-Positive Prevention</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Deduplication Window</span>
              <span className="text-indigo-600 font-bold">{settings.deduplication.windowSeconds} Seconds</span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={settings.deduplication.windowSeconds}
              onChange={(e) => {
                updateDeduplication({ windowSeconds: parseInt(e.target.value) });
                showSaved();
              }}
              className="w-full accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">
              Identical notifications arriving within this window are suppressed to prevent double-announcing.
            </p>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800">Allow Distinct Customers with Same Amount</span>
              <p className="text-[11px] text-slate-500">
                Preserve consecutive payments with identical amounts (e.g. two separate ₹20 chai bills).
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.deduplication.allowSameAmountDistinctPayers}
              onChange={(e) => {
                updateDeduplication({ allowSameAmountDistinctPayers: e.target.checked });
                showSaved();
              }}
              className="w-4 h-4 text-indigo-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* 4. Quiet Mode & Night Hours */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-700 pb-3 border-b border-slate-100">
          <Moon className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">Quiet Mode (Night Mute)</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800">Enable Quiet Mode</span>
              <p className="text-[11px] text-slate-500">
                Automatically silence voice announcements during non-business overnight hours.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.voice.quietModeEnabled}
              onChange={(e) => {
                updateVoice({ quietModeEnabled: e.target.checked });
                showSaved();
              }}
              className="w-4 h-4 text-indigo-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* 5. Privacy & Security */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-700 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5" />
          <h3 className="font-bold text-slate-900 text-sm">Privacy & Security</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800">Mask Customer Payer Names in Logs</span>
              <p className="text-[11px] text-slate-500">
                Obfuscate customer names in transaction displays (e.g. R*** K***).
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacy.maskPayerNames}
              onChange={(e) => {
                updatePrivacy({ maskPayerNames: e.target.checked });
                showSaved();
              }}
              className="w-4 h-4 text-indigo-600 rounded"
            />
          </label>

          <div className="p-3.5 bg-slate-100 rounded-xl text-slate-600 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">Zero Cloud Transmission Policy:</span>
            <p className="text-[11px] leading-relaxed">
              All payment parsing, classification, and text-to-speech occur locally in your browser and on your Android device. No raw notifications or transaction amounts are transmitted to third-party AI or analytics services.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Defaults */}
      <div className="pt-2 flex justify-between items-center">
        <button
          onClick={() => {
            if (confirm('Reset all settings to default factory values?')) {
              resetToDefaults();
            }
          }}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
        >
          Reset All Settings to Defaults
        </button>
      </div>

    </div>
  );
};
