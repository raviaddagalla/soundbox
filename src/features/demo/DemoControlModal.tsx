import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Play,
  Square,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useDemoStore } from '../../stores/useDemoStore';
import { DEMO_SCENARIOS, DemoScenario } from './demoPresets';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface DemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoControlModal: React.FC<DemoControlModalProps> = ({ isOpen, onClose }) => {
  const {
    isSimulating,
    activeScenarioId,
    pipelineStageIndex,
    lastResult,
    isTourRunning,
    runScenario,
    runDuplicateTest,
    runLegitimateIdenticalAmountsTest,
    runFullDemoTour,
    stopTour
  } = useDemoStore();

  const { settings } = useSettingsStore();

  if (!isOpen) return null;

  const stages = [
    { num: 1, name: 'Ingest', label: 'Push Notification' },
    { num: 2, name: 'Parse', label: 'Modular Extractor' },
    { num: 3, name: 'Classify', label: 'Trust & Safety' },
    { num: 4, name: 'Dedup', label: 'Fingerprint Check' },
    { num: 5, name: 'Speech', label: 'Voice Announce' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-indigo-900 p-6 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider">
                Hackathon Demo Mode
              </span>
              <span className="text-xs text-purple-200">Zero Android Hardware Needed</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Soundbox Pipeline Demonstration Hub</h2>
            <p className="text-xs text-indigo-200 max-w-md leading-relaxed">
              Demonstrates that incoming payments trigger voice output while debits, pending, and failed transactions are reliably silenced.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Animated 5-Stage Pipeline Visualizer */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Live Event Processing Pipeline:</span>
              </span>
              {isSimulating && (
                <span className="text-xs font-semibold text-emerald-400 animate-pulse flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Processing...</span>
                </span>
              )}
            </div>

            {/* Stages Bar */}
            <div className="grid grid-cols-5 gap-1.5">
              {stages.map((stg) => {
                const isActive = pipelineStageIndex === stg.num;
                const isPassed = pipelineStageIndex > stg.num;

                return (
                  <div
                    key={stg.num}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-400 shadow-md shadow-indigo-500/50 scale-105'
                        : isPassed
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider">{stg.name}</div>
                    <div className="text-[9px] opacity-75 truncate">{stg.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Last Result Log Strip */}
            {lastResult && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-300 truncate max-w-sm">
                  {lastResult.event.classificationReason}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  lastResult.wasAnnounced ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                }`}>
                  {lastResult.wasAnnounced ? 'Spoken' : 'Silenced'}
                </span>
              </div>
            )}
          </div>

          {/* Primary Demo Showcase Buttons */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              1. Automated Guided Tours
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Full Tour Button */}
              <button
                onClick={isTourRunning ? stopTour : runFullDemoTour}
                className="p-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-left transition space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950">Run Full 5-Step Tour</span>
                  {isTourRunning ? (
                    <Square className="w-4 h-4 text-red-600 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 text-indigo-600 fill-current" />
                  )}
                </div>
                <p className="text-[11px] text-indigo-800/70">
                  Runs incoming, debit reject, failed reject, pending reject & refund.
                </p>
              </button>

              {/* Duplicate Suppression Test */}
              <button
                onClick={runDuplicateTest}
                disabled={isSimulating}
                className="p-3 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-left transition space-y-1 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">Test Duplicate Suppression</span>
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                </div>
                <p className="text-[11px] text-amber-800/80">
                  Sends ₹50, then redelivers exact same event. Suppressed!
                </p>
              </button>

              {/* Two Customers Legitimate Payments */}
              <button
                onClick={runLegitimateIdenticalAmountsTest}
                disabled={isSimulating}
                className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition space-y-1 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">Test 2 Legitimate Payments</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-[11px] text-emerald-800/80">
                  Two customers pay ₹20 for tea. Both announced without discard!
                </p>
              </button>

            </div>
          </div>

          {/* Individual Scenario Grid */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              2. Individual Scenarios (Click to Test)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {DEMO_SCENARIOS.map((scenario) => {
                const isIncoming = scenario.badge === 'Incoming';
                const isSelected = activeScenarioId === scenario.id;

                return (
                  <button
                    key={scenario.id}
                    onClick={() => runScenario(scenario)}
                    disabled={isSimulating}
                    className={`p-3 rounded-xl border text-left transition space-y-1 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[210px]">
                        {scenario.name}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        isIncoming
                          ? 'bg-emerald-100 text-emerald-800'
                          : scenario.badge === 'Refund'
                          ? 'bg-blue-100 text-blue-800'
                          : scenario.badge === 'Outgoing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {scenario.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>*Uses Web Speech API + Web Audio chime synthesizer.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
