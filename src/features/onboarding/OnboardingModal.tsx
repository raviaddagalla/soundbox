import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useDeviceStore } from '../../stores/useDeviceStore';
import { SUPPORTED_LANGUAGES } from '../../services/announcement/templates';
import { speechManager } from '../../services/announcement/speechManager';
import { DEMO_SCENARIOS } from '../demo/demoPresets';
import { useDemoStore } from '../../stores/useDemoStore';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const { settings, updateVoice, toggleSource, completeOnboarding } = useSettingsStore();
  const { notificationPermissionGranted, setNotificationPermission } = useDeviceStore();
  const { runScenario } = useDemoStore();

  const [businessNameInput, setBusinessNameInput] = useState(settings.merchant.businessName);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);

  if (!isOpen) return null;

  const handleTestVoiceAudio = async () => {
    setIsSpeakingTest(true);
    const testSample = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई। पचास रुपये प्राप्त हुए।'
      : 'Soundless UPI. Fifty rupees received.';
    await speechManager.testVoice(testSample, settings.voice);
    setIsSpeakingTest(false);
  };

  const handleRunSimulatedPaymentTest = async () => {
    setIsSpeakingTest(true);
    const result = await runScenario(DEMO_SCENARIOS[0]); // PhonePe ₹50
    setIsSpeakingTest(false);
    if (result.wasAnnounced) {
      setTestSuccess(true);
    }
  };

  const handleFinish = () => {
    completeOnboarding(businessNameInput, settings.voice.language);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                {step}
              </span>
              <span className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">
                Setup Step {step} of 6
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
            >
              Skip
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* STEP 1: WELCOME & SAVINGS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
                  <Volume2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Welcome to Soundless UPI</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Turn your existing Android phone into a powerful, voice-enabled UPI soundbox without paying recurring rental fees.
                </p>
              </div>

              {/* Savings Calculator Card */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                      Estimated Monthly Savings
                    </span>
                    <div className="flex items-baseline space-x-1.5 mt-0.5">
                      <span className="text-3xl font-extrabold text-emerald-700">₹125</span>
                      <span className="text-xs text-emerald-600">/ month saved</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mt-1">
                      Avoid ₹1,500/year in physical soundbox device rentals + SIM charges.
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-200/80 text-emerald-900 text-[10px] font-bold rounded-lg uppercase">
                    Zero Hardware
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic border-t border-emerald-200/60 pt-1.5">
                  *Savings calculation is an estimate based on standard industry rental fees. Actual merchant plans may vary.
                </p>
              </div>

              {/* Shop Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Your Shop / Stall Name</label>
                <input
                  type="text"
                  value={businessNameInput}
                  onChange={(e) => setBusinessNameInput(e.target.value)}
                  placeholder="e.g. Ramesh Tea Stall & Bakery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: NOTIFICATION SOURCES */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Choose Payment Sources</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the UPI payment apps you accept customer payments with on this phone.
                </p>
              </div>

              <div className="space-y-2">
                {Object.values(settings.sources).map((source) => (
                  <label
                    key={source.packageName}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition hover:bg-slate-50/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
                        {source.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-slate-800">{source.displayName}</span>
                        <p className="text-[11px] text-slate-400">{source.reliabilityNotice}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      onChange={(e) => toggleSource(source.packageName, e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Compatibility Note:</strong> Notification formats vary across app versions. Soundless UPI uses modular parsers specifically tuned for Indian UPI apps.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: NOTIFICATION ACCESS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Grant Notification Access</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Android requires explicit permission for an app to read incoming payment push notifications.
                </p>
              </div>

              {/* Status Display */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                notificationPermissionGranted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    notificationPermissionGranted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold">
                      {notificationPermissionGranted ? 'Access Granted' : 'Access Required'}
                    </span>
                    <p className="text-xs text-slate-500">
                      {notificationPermissionGranted
                        ? 'Ready to intercept allowed payment notifications.'
                        : 'Please grant notification access in Android Settings.'}
                    </p>
                  </div>
                </div>
                {notificationPermissionGranted && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const bridge = typeof window !== 'undefined' ? (window as unknown as { AndroidBridge?: { openNotificationSettings?: () => void } }).AndroidBridge : undefined;
                    if (bridge && typeof bridge.openNotificationSettings === 'function') {
                      bridge.openNotificationSettings();
                    } else {
                      setNotificationPermission(true);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm shadow-indigo-200"
                >
                  <span>Grant Notification Access (Android Settings)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <p className="text-[11px] text-slate-500 text-center">
                  Soundless UPI only inspects notifications from your allowed payment apps. Messages are processed locally on device.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIGURE VOICE */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Voice Announcement</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your language, volume, and speech speed to clearly hear payments in your shop.
                </p>
              </div>

              {/* Language Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Voice Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => updateVoice({ language: lang.code as any })}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        settings.voice.language === lang.code
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div>
                        <div className="text-xs">{lang.name}</div>
                        <div className="text-[10px] text-slate-400">{lang.nativeName}</div>
                      </div>
                      {settings.voice.language === lang.code && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech Rate Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Speech Speed</span>
                  <span className="font-bold text-indigo-600">{settings.voice.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={settings.voice.speechRate}
                  onChange={(e) => updateVoice({ speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Test Voice Button */}
              <button
                onClick={handleTestVoiceAudio}
                disabled={isSpeakingTest}
                className="w-full py-2 px-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>{isSpeakingTest ? 'Playing Test Audio...' : 'Test Voice Announcement Now'}</span>
              </button>
            </div>
          )}

          {/* STEP 5: TEST SYSTEM */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Test Payment Simulation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Let's trigger a simulated ₹50 incoming payment to verify chime, parsing, and voice output.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Test Event: Simulated PhonePe ₹50 Payment</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This sends a mock notification payload through the exact same parsing and deduplication engine that real payments use.
                </p>

                <button
                  onClick={handleRunSimulatedPaymentTest}
                  disabled={isSpeakingTest}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm shadow-emerald-200"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeakingTest ? 'Processing & Speaking...' : 'Trigger Test Payment (₹50)'}</span>
                </button>
              </div>

              {testSuccess && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Payment test succeeded! Chime and voice announcement confirmed.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: READY */}
          {step === 6 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Your Soundbox is Ready!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {businessNameInput} is now ready to announce customer payments aloud.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">Active & Listening</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Language:</span>
                  <span className="font-bold text-slate-800">
                    {SUPPORTED_LANGUAGES[settings.voice.language]?.name || settings.voice.language}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Sources:</span>
                  <span className="font-bold text-slate-800">
                    {Object.values(settings.sources).filter(s => s.enabled).length} Apps
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deduplication:</span>
                  <span className="font-bold text-slate-800">{settings.deduplication.windowSeconds}s Window</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center space-x-1.5 shadow-sm shadow-indigo-300"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1.5 shadow-md shadow-emerald-200"
            >
              <span>Go to Soundbox Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
