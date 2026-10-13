import React from 'react';
import {
  Volume2,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Clock,
  HelpCircle,
  Copy,
  Sliders
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useDeviceStore } from '../../stores/useDeviceStore';
import { PaymentEventType, AnnouncementStatus, DeviceConnectionStatus } from '../../types/event';
import { speechManager } from '../../services/announcement/speechManager';

interface DashboardViewProps {
  onOpenDemo: () => void;
  onOpenOnboarding: () => void;
  onNavigateTransactions: () => void;
  onNavigateDiagnostics: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenDemo,
  onOpenOnboarding,
  onNavigateTransactions,
  onNavigateDiagnostics,
}) => {
  const { settings, toggleActiveListening } = useSettingsStore();
  const { transactions, getStats, repeatLastAnnouncement } = useTransactionStore();
  const { connectionStatus, notificationPermissionGranted } = useDeviceStore();

  const stats = getStats();
  const isListening = settings.merchant.activeListening;

  const handleTestVoice = async () => {
    const testSample = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई। सौ रुपये प्राप्त हुए।'
      : 'Payment received, one hundred rupees.';
    await speechManager.testVoice(testSample, settings.voice);
  };

  return (
    <div className="space-y-6">
      
      {/* Soundbox Hero Status Card */}
      <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl transition-all relative overflow-hidden ${
        isListening
          ? 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 shadow-indigo-200'
          : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-slate-200'
      }`}>
        
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          
          {/* Main Soundbox Listening Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`flex h-3 w-3 relative ${isListening ? '' : 'opacity-60'}`}>
                {isListening && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </span>
              <span className="text-xs uppercase tracking-widest font-bold text-indigo-200">
                {isListening ? 'Soundbox Active' : 'Soundbox Paused'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isListening ? 'Listening for Incoming UPI' : 'Voice Announcements Muted'}
            </h1>

            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-lg leading-relaxed">
              {isListening
                ? `Ready to announce incoming payments in ${settings.voice.language.toUpperCase()} through your phone speakers.`
                : 'Tap Resume to start announcing incoming customer payments aloud again.'}
            </p>
          </div>

          {/* Primary Pause/Resume Action */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={toggleActiveListening}
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center space-x-2 shadow-lg ${
                isListening
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-900/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/20'
              }`}
            >
              {isListening ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause Soundbox</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Resume Soundbox</span>
                </>
              )}
            </button>

            <button
              onClick={handleTestVoice}
              className="px-4 py-3.5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur transition flex items-center space-x-2"
              title="Speak a test announcement"
            >
              <Volume2 className="w-4 h-4 text-emerald-300" />
              <span>Test Voice</span>
            </button>
          </div>

        </div>

        {/* Quick Diagnostics Strip */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-indigo-200">
          <div>
            <span className="text-[10px] text-white/60 block">Connection State</span>
            <span className="font-semibold text-white">
              {connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE ? 'Companion Linked' : 'Web Simulator'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/60 block">Voice Language</span>
            <span className="font-semibold text-white">{settings.voice.language} ({settings.voice.speechRate}x)</span>
          </div>
          <div>
            <span className="text-[10px] text-white/60 block">Notification Access</span>
            <span className={`font-semibold ${notificationPermissionGranted ? 'text-emerald-300' : 'text-amber-300'}`}>
              {notificationPermissionGranted ? 'Granted' : 'Needs Check'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/60 block">Monthly Rental Saved</span>
            <span className="font-bold text-emerald-300">~ ₹{settings.merchant.estimatedSoundboxRentalFee}</span>
          </div>
        </div>

      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Notification-Derived Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Collection</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ₹{stats.todayTotalAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            From {stats.todayIncomingCount} incoming payment alert{stats.todayIncomingCount === 1 ? '' : 's'}
          </p>
        </div>

        {/* Total Spoken Announcements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Announcements Spoken</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.todayAnnouncedCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Clear voice playback completed
          </p>
        </div>

        {/* Duplicates Suppressed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Duplicates Suppressed</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.todayDuplicateCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Prevented repeated noise
          </p>
        </div>

        {/* Blocked Ineligible Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Blocked Non-Incoming</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.todayRejectedCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Debits, failed & pending silenced
          </p>
        </div>

      </div>

      {/* Quick Action & Most Recent Announcement Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Most Recent Eligible Payment Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-slate-900 text-sm">Most Recent Incoming Payment</h3>
            </div>
            {stats.mostRecentEligible && (
              <button
                onClick={() => repeatLastAnnouncement()}
                className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Repeat Voice</span>
              </button>
            )}
          </div>

          {stats.mostRecentEligible ? (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <div>
                <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                  {stats.mostRecentEligible.sourceAppName}
                </span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-0.5">
                  ₹{stats.mostRecentEligible.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center space-x-2">
                  <span>From: {stats.mostRecentEligible.payerName || 'UPI Customer'}</span>
                  {stats.mostRecentEligible.referenceId && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      UTR: {stats.mostRecentEligible.referenceId}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 italic">
                  "{stats.mostRecentEligible.announcementText}"
                </div>
              </div>

              <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  Announced
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  {new Date(stats.mostRecentEligible.eventTimestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">No payments received yet today.</p>
              <button
                onClick={onOpenDemo}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Click here to test a demo payment
              </button>
            </div>
          )}
        </div>

        {/* Hackathon Demo Quick Launch Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-indigo-700 mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm">Demo Mode Simulator</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Demonstrate the full pipeline with PhonePe, GPay, Paytm, BHIM notifications. Test outgoing debit rejection, failed payment rejection, and duplicate suppression.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-100 space-y-2">
            <button
              onClick={onOpenDemo}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm shadow-indigo-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Hackathon Demo Hub</span>
            </button>
            <button
              onClick={onOpenOnboarding}
              className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Re-run Setup Wizard
            </button>
          </div>
        </div>

      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Notification Events</h3>
            <p className="text-xs text-slate-400">Processed through the 12-step safety pipeline</p>
          </div>
          <button
            onClick={onNavigateTransactions}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>View All ({transactions.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {transactions.slice(0, 5).map((tx) => {
            const isEligible = tx.eventType === PaymentEventType.INCOMING_PAYMENT;
            const isAnnounced = tx.announcementStatus === AnnouncementStatus.ANNOUNCED;

            return (
              <div key={tx.eventId} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isAnnounced
                      ? 'bg-emerald-100 text-emerald-700'
                      : tx.announcementStatus === AnnouncementStatus.SUPPRESSED_DUPLICATE
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tx.sourceAppName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {tx.sourceAppName}
                      </span>
                      {tx.isSimulated && (
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold text-[10px] rounded uppercase">
                          Simulated
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {tx.eventType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-md">
                      {tx.rawSummary.textPreview}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-extrabold text-sm sm:text-base ${
                    isEligible ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {tx.amount > 0 ? `₹${tx.amount.toLocaleString('en-IN')}` : '—'}
                  </div>
                  <span className={`text-[10px] font-semibold ${
                    isAnnounced
                      ? 'text-emerald-600'
                      : tx.announcementStatus === AnnouncementStatus.SUPPRESSED_DUPLICATE
                      ? 'text-amber-600'
                      : 'text-slate-400'
                  }`}>
                    {tx.announcementStatus.replace('_', ' ')}
                  </span>
                </div>

              </div>
            );
          })}

          {transactions.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400">
              No payment notifications received yet. Launch Demo Hub above to test.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
