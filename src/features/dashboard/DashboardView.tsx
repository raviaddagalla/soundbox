import React, { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Radio,
  Sliders,
  Battery,
  AlertTriangle,
  Lock
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
  onNavigateSavings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenDemo,
  onOpenOnboarding,
  onNavigateTransactions,
  onNavigateDiagnostics,
  onNavigateSavings,
}) => {
  const { settings, toggleActiveListening } = useSettingsStore();
  const { transactions, getStats, repeatLastAnnouncement } = useTransactionStore();
  const { connectionStatus, notificationPermissionGranted } = useDeviceStore();

  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);

  const stats = getStats();
  const isListening = settings.merchant.activeListening;

  const handleTestAnnouncement = async () => {
    setIsPlayingTestAudio(true);
    const testText = settings.voice.language === 'hi-IN'
      ? 'साउंडलेस यूपीआई। पच्चीस रुपये प्राप्त हुए।'
      : 'Soundless UPI. Twenty-five rupees received.';
    await speechManager.testVoice(testText, settings.voice);
    setTimeout(() => setIsPlayingTestAudio(false), 2400);
  };

  const handleReplaySingleTx = async (amount: number) => {
    const text = settings.voice.language === 'hi-IN'
      ? `${amount} रुपये प्राप्त हुए`
      : `Payment received, ${amount} rupees`;
    await speechManager.enqueue(text, settings.voice, true);
  };

  const handleCopy = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // Provider app color branding
  const getAppColor = (appName: string) => {
    const lower = appName.toLowerCase();
    if (lower.includes('phonepe')) return { bg: 'bg-[#5f259f]/10', text: 'text-[#5f259f]', dot: 'bg-[#5f259f]' };
    if (lower.includes('google') || lower.includes('gpay')) return { bg: 'bg-[#1a73e8]/10', text: 'text-[#1a73e8]', dot: 'bg-[#1a73e8]' };
    if (lower.includes('paytm')) return { bg: 'bg-[#00b9f5]/10', text: 'text-[#00b9f5]', dot: 'bg-[#00b9f5]' };
    if (lower.includes('bhim')) return { bg: 'bg-[#00897b]/10', text: 'text-[#00897b]', dot: 'bg-[#00897b]' };
    return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-600' };
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12">
      
      {/* Audio Wave Simulation Toast (Appears when voice plays) */}
      {isPlayingTestAudio && (
        <div className="fixed top-20 inset-x-4 z-50 max-w-md mx-auto bg-navy-dark text-white rounded-2xl p-4 shadow-elevated flex items-center justify-between border border-slate-700 animate-slide-down">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
              <Volume2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-secondary-fixed">Voice Test Playing...</span>
              <span className="text-xs text-slate-300 truncate">
                {settings.voice.language === 'hi-IN' ? '"साउंडलेस यूपीआई: ₹25 प्राप्त हुए"' : '"Soundless UPI: ₹25 received"'}
              </span>
            </div>
          </div>
          {/* Animated Equalizer Wave Bars */}
          <div className="flex items-end gap-1 h-5 px-2">
            <span className="w-1 bg-secondary-fixed rounded-full animate-bounce h-3" />
            <span className="w-1 bg-secondary-fixed rounded-full animate-bounce h-5" style={{ animationDelay: '0.15s' }} />
            <span className="w-1 bg-secondary-fixed rounded-full animate-bounce h-2" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 bg-secondary-fixed rounded-full animate-bounce h-4" style={{ animationDelay: '0.45s' }} />
          </div>
        </div>
      )}

      {/* 1. Live Soundbox Status Hero Card (Terminal Hero matching Stitch specification) */}
      <div className="w-full bg-navy-dark text-white rounded-2xl p-5 sm:p-6 shadow-elevated flex flex-col gap-4 border border-slate-800">
        
        {/* Top Row: Badge + Engine Power Slider */}
        <div className="flex items-center justify-between gap-3">
          
          {/* High-Contrast Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase shadow-sm ${
            isListening ? 'bg-emerald-primary text-white' : 'bg-amber-warning text-slate-950'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              {isListening && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-secondary-fixed' : 'bg-slate-950'}`} />
            </span>
            <span>{isListening ? 'ACTIVE & LISTENING' : 'STANDBY / PAUSED'}</span>
          </div>

          {/* Tactile Soundbox Power Toggle Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
              {isListening ? 'Engine ON' : 'Engine OFF'}
            </span>
            <button
              onClick={toggleActiveListening}
              className={`w-14 h-8 px-1 rounded-full flex items-center transition-colors duration-200 cursor-pointer ${
                isListening ? 'bg-emerald-primary' : 'bg-slate-700'
              }`}
              title={isListening ? 'Click to Pause Soundbox' : 'Click to Resume Soundbox'}
            >
              <span className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                isListening ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>

        {/* Subtext Primed Notice */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-secondary-fixed">
            <CheckCircle2 className="w-4 h-4 text-secondary-fixed" />
            <span className="text-sm font-bold">Virtual Terminal Active</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isListening
              ? 'Phone speaker primed • Background notification engine 100% online'
              : 'Announcements paused • Tap the toggle to resume audio'}
          </p>
        </div>

        {/* Hero Actions: Test Announcement CTA Button */}
        <div className="pt-1">
          <button
            onClick={handleTestAnnouncement}
            className="w-full h-12 px-4 rounded-xl bg-emerald-primary hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-glow-emerald cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-secondary-fixed" />
            <span>Test Announcement 🔊</span>
          </button>
        </div>

        {/* Status Indicators Grid (3 Columns) */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
          <div className="bg-white/5 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <div className={`flex items-center gap-1 text-xs font-bold ${
              notificationPermissionGranted ? 'text-secondary-fixed' : 'text-amber-warning'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{notificationPermissionGranted ? '✓ Granted' : 'Required'}</span>
            </div>
            <span className="text-[10px] text-slate-300 leading-tight">Notification Listener</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <div className="flex items-center gap-1 text-secondary-fixed text-xs font-bold">
              <Volume2 className="w-3.5 h-3.5" />
              <span>95% ✓</span>
            </div>
            <span className="text-[10px] text-slate-300 leading-tight">Media Volume</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <div className="flex items-center gap-1 text-secondary-fixed text-xs font-bold">
              <Battery className="w-3.5 h-3.5" />
              <span>✓ Ignored</span>
            </div>
            <span className="text-[10px] text-slate-300 leading-tight">Battery Optimization</span>
          </div>
        </div>

      </div>

      {/* 2. Today's Summary Rupee Metrics Card (matching Stitch specification) */}
      <div className="w-full bg-white rounded-2xl p-5 shadow-subtle border border-surface-border flex flex-col gap-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-primary" />
            <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide">
              Today's Business
            </span>
          </div>
          <span className="text-[11px] bg-surface-container-high text-text-secondary px-2.5 py-0.5 rounded-full font-bold">
            Live Sync
          </span>
        </div>

        {/* Main Rupee Amount Display */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-muted">Total Received Today</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight tabular-nums">
              ₹{stats.todayTotalAmount.toLocaleString('en-IN')}<span className="text-text-muted text-xl font-bold">.00</span>
            </span>
          </div>
        </div>

        {/* Secondary Counters Mosaic */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-0.5 border border-surface-border">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Payments</span>
            <div className="flex items-center gap-1">
              <span className="text-base font-extrabold text-text-primary">{stats.todayIncomingCount}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-primary" />
            </div>
            <span className="text-[10px] text-text-muted">100% Success</span>
          </div>

          <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-0.5 border border-surface-border">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Announced</span>
            <div className="flex items-center gap-1">
              <span className="text-base font-extrabold text-emerald-primary">{stats.todayAnnouncedCount}</span>
              <Volume2 className="w-3.5 h-3.5 text-emerald-primary" />
            </div>
            <span className="text-[10px] text-emerald-primary font-medium">Zero Delay</span>
          </div>

          <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-0.5 border border-surface-border">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Missed / Blocked</span>
            <div className="flex items-center gap-1">
              <span className="text-base font-extrabold text-text-primary">
                {stats.todayRejectedCount + stats.todayDuplicateCount}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
            </div>
            <span className="text-[10px] text-text-muted">Full Audit Log</span>
          </div>
        </div>

      </div>

      {/* 3. Rental Savings Highlight Card (matching Stitch specification) */}
      <div
        onClick={onNavigateSavings}
        className="w-full bg-secondary-container text-on-secondary-container rounded-2xl p-4 sm:p-5 shadow-subtle border border-emerald-200 flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:bg-emerald-100/80 transition"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-emerald-primary shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-secondary-fixed">Soundbox Hardware Rent Saved</span>
              <span className="text-xs text-on-secondary-container">₹125/month recurring charge eliminated</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-800 shrink-0 mt-1" />
        </div>
        <p className="text-[11px] text-emerald-800/80 pl-13 pt-1 border-t border-emerald-200/60">
          Tap to view equipment savings ledger & avoided hardware overhead breakdown &rarr;
        </p>
      </div>

      {/* 4. Recent Transactions Ledger Feed */}
      <div className="bg-white rounded-2xl p-5 shadow-subtle border border-surface-border flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-text-primary text-sm">Recent Activity</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-primary" />
          </div>
          <button
            onClick={onNavigateTransactions}
            className="text-xs font-bold text-emerald-primary hover:underline flex items-center gap-1"
          >
            <span>View Ledger ({transactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Transaction Cards List */}
        <div className="divide-y divide-surface-border -my-1">
          {transactions.slice(0, 5).map((tx) => {
            const isEligible = tx.eventType === PaymentEventType.INCOMING_PAYMENT;
            const isAnnounced = tx.announcementStatus === AnnouncementStatus.ANNOUNCED;
            const appColors = getAppColor(tx.sourceAppName);

            return (
              <article
                key={tx.eventId}
                className="py-3.5 flex flex-col gap-2.5 first:pt-1 last:pb-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Branded App Icon Badge */}
                    <div className={`w-10 h-10 rounded-xl ${appColors.bg} ${appColors.text} flex items-center justify-center shrink-0 font-extrabold text-xs shadow-sm`}>
                      {tx.sourceAppName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text-primary text-xs sm:text-sm truncate">
                          {tx.payerName || tx.sourceAppName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container font-bold text-text-secondary shrink-0">
                          {tx.sourceAppName}
                        </span>
                        {tx.isSimulated && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted text-[11px] mt-0.5">
                        <span>{new Date(tx.eventTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="font-mono truncate">
                          {tx.referenceId ? `UTR: ${tx.referenceId}` : tx.eventType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rupee Amount in Emerald */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-base font-black tabular-nums ${
                      isEligible ? 'text-emerald-primary' : 'text-text-muted'
                    }`}>
                      {tx.amount > 0 ? `+₹${tx.amount.toLocaleString('en-IN')}.00` : '—'}
                    </span>
                    <div className={`flex items-center gap-1 text-[11px] font-bold mt-0.5 ${
                      isAnnounced ? 'text-emerald-primary' : 'text-text-muted'
                    }`}>
                      {isAnnounced && <CheckCircle2 className="w-3 h-3" />}
                      <span>{tx.announcementStatus.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Action Pill Bar */}
                <div className="flex items-center justify-between pt-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-text-secondary font-semibold flex items-center gap-1 shadow-subtle border border-surface-border">
                      <Volume2 className="w-3 h-3 text-emerald-primary" />
                      <span>{settings.voice.language === 'hi-IN' ? 'Hindi Voice' : 'English Voice'}</span>
                    </span>

                    {tx.referenceId && (
                      <button
                        onClick={() => handleCopy(tx.referenceId!)}
                        className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded font-semibold cursor-pointer"
                        title="Copy UTR"
                      >
                        {copiedUtr === tx.referenceId ? (
                          <Check className="w-3 h-3 text-emerald-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedUtr === tx.referenceId ? 'Copied' : 'Copy UTR'}</span>
                      </button>
                    )}
                  </div>

                  {/* Replay Announcement Button */}
                  {isEligible && (
                    <button
                      onClick={() => handleReplaySingleTx(tx.amount)}
                      className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center hover:bg-emerald-primary hover:text-white transition shadow-sm cursor-pointer"
                      title="Replay Voice Alert"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {transactions.length === 0 && (
            <div className="py-8 text-center text-xs text-text-muted space-y-2">
              <p>No payment alerts processed yet today.</p>
              <button
                onClick={onOpenDemo}
                className="text-emerald-primary font-bold hover:underline"
              >
                Launch Demo Hub to test a simulated payment &rarr;
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
