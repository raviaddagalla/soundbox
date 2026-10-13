import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  Battery,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Moon,
  Radio,
  HelpCircle,
  Bell
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
    resetToDefaults
  } = useSettingsStore();

  const [savedBanner, setSavedBanner] = useState(false);
  const [isPlayingPing, setIsPlayingPing] = useState(false);

  const showSaved = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handlePingTest = async () => {
    setIsPlayingPing(true);
    const testSample = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई: ₹1 प्राप्त हुए'
      : 'Soundless UPI: 1 rupee received';
    await speechManager.testVoice(testSample, settings.voice);
    setTimeout(() => setIsPlayingPing(false), 2000);
  };

  const languageTiles = [
    { code: 'hi-IN', label: 'हिंदी', sublabel: 'Hindi (Standard)' },
    { code: 'en-IN', label: 'English', sublabel: 'Indian Accent' },
    { code: 'te-IN', label: 'తెలుగు', sublabel: 'Telugu (తెలుగు)' },
    { code: 'mr-IN', label: 'मराठी', sublabel: 'Marathi (मराठी)' },
  ];

  const templates = [
    { label: 'Compact Direct', tpl: '{amount} प्राप्त हुए', desc: 'e.g. 50 रुपये प्राप्त हुए' },
    { label: 'Formal Branded', tpl: 'Payment received, {amount}', desc: 'e.g. Payment received, 50 rupees' },
    { label: 'Dual Audio', tpl: '{amount} received • प्राप्त हुए', desc: 'e.g. 50 rupees received • प्राप्त हुए' },
  ];

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12">
      
      {/* 1. Live Audio Engine Status Hero Card (matching Stitch voice_settings) */}
      <div className="relative overflow-hidden rounded-2xl bg-navy-dark text-white p-5 sm:p-6 shadow-elevated border border-slate-800 flex flex-col gap-4">
        
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-secondary-fixed">
              <Volume2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white truncate">Audio Engine</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-primary animate-ping" />
                  Active
                </span>
              </div>
              <span className="text-xs text-on-primary-container truncate mt-0.5">
                Android Native & Web Speech Synthesizer
              </span>
            </div>
          </div>

          <button
            onClick={handlePingTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition shrink-0 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-secondary-fixed" />
            <span>Ping Test</span>
          </button>
        </div>

        {/* Active Audio Spec Pill Grid */}
        <div className="grid grid-cols-2 gap-2 mt-1 relative z-10">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <Volume2 className="w-4 h-4 text-secondary-fixed shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-primary-container">Primary Voice</span>
              <span className="text-xs font-bold text-white truncate">
                {SUPPORTED_LANGUAGES[settings.voice.language]?.name || settings.voice.language}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <Sliders className="w-4 h-4 text-secondary-fixed shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-primary-container">Speech Speed</span>
              <span className="text-xs font-bold text-white">
                {settings.voice.speechRate}x (Standard)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Background Persistence Alert Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-container-high text-text-primary shadow-subtle border border-surface-border">
        <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
          <Battery className="w-5 h-5 text-emerald-primary" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-text-primary">Background Protection ON</span>
            <span className="text-[10px] text-emerald-primary font-bold uppercase tracking-wider">Optimized</span>
          </div>
          <span className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            Audio synthesized through persistent background foreground channel so screen sleep does not silence incoming payments.
          </span>
        </div>
      </div>

      {/* 3. Voice Language Selector (बोली) */}
      <div className="bg-white rounded-2xl p-5 shadow-subtle border border-surface-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wide">
            Voice Language (बोली)
          </label>
          <span className="text-xs text-text-muted">4 Regional Dialects</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {languageTiles.map((tile) => {
            const isSelected = settings.voice.language === tile.code;
            return (
              <button
                key={tile.code}
                type="button"
                onClick={() => {
                  updateVoice({ language: tile.code as any });
                  showSaved();
                }}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-navy-dark text-white border-slate-900 shadow-sm'
                    : 'bg-white text-text-primary hover:bg-slate-50 border-surface-border shadow-subtle'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base font-extrabold">{tile.label}</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-secondary-fixed" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-text-muted'}`}>
                  {tile.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Speech Speed Slider with Tactile Stops */}
      <div className="bg-white rounded-2xl p-5 shadow-subtle border border-surface-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
            Speech Rate & Tempo
          </span>
          <span className="text-xs font-bold text-emerald-primary">{settings.voice.speechRate}x</span>
        </div>

        <input
          type="range"
          min="0.8"
          max="1.4"
          step="0.1"
          value={settings.voice.speechRate}
          onChange={(e) => {
            updateVoice({ speechRate: parseFloat(e.target.value) });
            showSaved();
          }}
          className="w-full accent-emerald-primary mt-1"
        />

        <div className="flex justify-between text-[10px] text-text-muted font-semibold px-1">
          <span>0.8x (Slower)</span>
          <span>1.0x (Standard)</span>
          <span>1.2x (Fast)</span>
          <span>1.4x (High Speed)</span>
        </div>
      </div>

      {/* 5. Announcement Format Template Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-subtle border border-surface-border flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary uppercase tracking-wide">
            Announcement Style
          </label>
          <span className="text-[10px] text-emerald-primary font-bold uppercase tracking-wider">
            Tap to select
          </span>
        </div>

        <div className="space-y-2">
          {templates.map((t, idx) => {
            const isSelected = settings.voice.announcementTemplate === t.tpl;
            return (
              <div
                key={idx}
                onClick={() => {
                  updateVoice({ announcementTemplate: t.tpl });
                  showSaved();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isSelected
                    ? 'border-emerald-primary bg-emerald-50/50 text-text-primary font-bold'
                    : 'border-surface-border hover:bg-slate-50 text-text-secondary'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-text-primary block">{t.label}</span>
                  <span className="text-[11px] text-text-muted italic">{t.desc}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Night Quiet Mode Toggle */}
      <div className="bg-white rounded-2xl p-5 shadow-subtle border border-surface-border flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-text-primary block">Overnight Quiet Mode</span>
          <span className="text-[11px] text-text-muted">
            Automatically silence voice speech between 10:00 PM and 6:00 AM
          </span>
        </div>
        <button
          onClick={() => {
            updateVoice({ quietModeEnabled: !settings.voice.quietModeEnabled });
            showSaved();
          }}
          className={`w-12 h-7 px-0.5 rounded-full flex items-center transition-colors cursor-pointer ${
            settings.voice.quietModeEnabled ? 'bg-emerald-primary' : 'bg-slate-300'
          }`}
        >
          <span className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
            settings.voice.quietModeEnabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Reset Defaults */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => {
            if (confirm('Reset voice settings to defaults?')) {
              resetToDefaults();
            }
          }}
          className="text-xs text-text-muted hover:text-text-primary font-semibold"
        >
          Reset All Settings to Defaults
        </button>

        {savedBanner && (
          <span className="text-xs text-emerald-primary font-bold animate-fade">
            ✓ Preferences Updated
          </span>
        )}
      </div>

    </div>
  );
};
