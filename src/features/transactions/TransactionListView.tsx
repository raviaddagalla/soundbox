import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  Filter,
  Volume2,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { SanitizedTransactionEvent, PaymentEventType, AnnouncementStatus } from '../../types/event';
import { TransactionDetailModal } from './TransactionDetailModal';
import { speechManager } from '../../services/announcement/speechManager';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const TransactionListView: React.FC = () => {
  const {
    transactions,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    clearAllTransactions,
    exportToCsv
  } = useTransactionStore();
  const { settings } = useSettingsStore();

  const [selectedTx, setSelectedTx] = useState<SanitizedTransactionEvent | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // App Filter state
  const [appFilter, setAppFilter] = useState<string>('all');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. App Filter
      if (appFilter !== 'all') {
        const appLower = tx.sourceAppName.toLowerCase();
        if (appFilter === 'phonepe' && !appLower.includes('phonepe')) return false;
        if (appFilter === 'gpay' && !appLower.includes('google') && !appLower.includes('gpay')) return false;
        if (appFilter === 'paytm' && !appLower.includes('paytm')) return false;
        if (appFilter === 'bhim' && !appLower.includes('bhim')) return false;
        if (appFilter === 'blocked' && tx.eventType === PaymentEventType.INCOMING_PAYMENT) return false;
      }

      // 2. Date Filter
      const now = new Date();
      const txDate = new Date(tx.eventTimestamp);
      if (dateFilter === 'TODAY') {
        if (txDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'YESTERDAY') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (txDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (dateFilter === 'WEEK') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (tx.eventTimestamp < sevenDaysAgo) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAmount = tx.amount.toString().includes(q);
        const matchesPayer = (tx.payerName || '').toLowerCase().includes(q);
        const matchesRef = (tx.referenceId || '').toLowerCase().includes(q);
        const matchesApp = tx.sourceAppName.toLowerCase().includes(q);
        if (!matchesAmount && !matchesPayer && !matchesRef && !matchesApp) return false;
      }

      return true;
    });
  }, [transactions, appFilter, dateFilter, searchQuery]);

  // Split into Today vs Past
  const todayTransactions = useMemo(() => {
    const todayStr = new Date().toDateString();
    return filteredTransactions.filter(t => new Date(t.eventTimestamp).toDateString() === todayStr);
  }, [filteredTransactions]);

  const pastTransactions = useMemo(() => {
    const todayStr = new Date().toDateString();
    return filteredTransactions.filter(t => new Date(t.eventTimestamp).toDateString() !== todayStr);
  }, [filteredTransactions]);

  const totalIncomingToday = useMemo(() => {
    return todayTransactions
      .filter(t => t.eventType === PaymentEventType.INCOMING_PAYMENT)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [todayTransactions]);

  const handleCopy = (utr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleReplayVoice = async (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = settings.voice.language === 'hi-IN'
      ? `${amount} रुपये प्राप्त हुए`
      : `Payment received, ${amount} rupees`;
    await speechManager.enqueue(text, settings.voice, true);
  };

  const getAppColor = (appName: string) => {
    const lower = appName.toLowerCase();
    if (lower.includes('phonepe')) return { bg: 'bg-[#5f259f]/10', text: 'text-[#5f259f]', dot: 'bg-[#5f259f]' };
    if (lower.includes('google') || lower.includes('gpay')) return { bg: 'bg-[#1a73e8]/10', text: 'text-[#1a73e8]', dot: 'bg-[#1a73e8]' };
    if (lower.includes('paytm')) return { bg: 'bg-[#00b9f5]/10', text: 'text-[#00b9f5]', dot: 'bg-[#00b9f5]' };
    if (lower.includes('bhim')) return { bg: 'bg-[#00897b]/10', text: 'text-[#00897b]', dot: 'bg-[#00897b]' };
    return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-600' };
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-12">
      
      {/* 1. Top Operational Banner & Rupee Summary Pill */}
      <div className="flex items-center justify-between bg-primary-container text-white px-4 py-3 rounded-2xl shadow-subtle border border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-ping shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
              Ledger Ingestion Live
            </span>
            <span className="text-xs font-semibold text-slate-100 truncate">
              {todayTransactions.length} transactions today •{' '}
              <span className="text-sm font-extrabold text-secondary-fixed tabular-nums">
                ₹{totalIncomingToday.toLocaleString('en-IN')}.00
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={exportToCsv}
          disabled={transactions.length === 0}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer disabled:opacity-40 shrink-0"
          title="Export CSV Ledger"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* 2. Search Bar with Cancel Clear */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by payer, UTR (e.g. 4082...), or ₹ amount"
          className="w-full h-12 pl-10 pr-10 bg-white text-text-primary placeholder:text-text-muted text-xs font-medium rounded-2xl shadow-subtle border border-surface-border focus:outline-none focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Filter Badges / Apps Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: `All (${transactions.length})` },
          { id: 'phonepe', label: 'PhonePe', dot: '#5f259f' },
          { id: 'gpay', label: 'Google Pay', dot: '#1a73e8' },
          { id: 'paytm', label: 'Paytm', dot: '#00b9f5' },
          { id: 'bhim', label: 'BHIM UPI', dot: '#00897b' },
          { id: 'blocked', label: 'Blocked / Silenced', dot: '#94a3b8' },
        ].map((tab) => {
          const isActive = appFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAppFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-navy-dark text-white shadow-sm'
                  : 'bg-white text-text-secondary hover:text-text-primary border border-surface-border shadow-subtle'
              }`}
            >
              {tab.dot && (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tab.dot }} />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Transparency & Settlement Disclosure Banner */}
      <div className="bg-white p-4 rounded-2xl shadow-subtle border border-surface-border flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0 text-on-secondary-fixed">
          <ShieldCheck className="w-4 h-4 text-emerald-800" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">Hardware-Free Soundbox Sync</span>
            <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
              NPCI Compliant
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
            Notification-detected payments are announced instantly. Final bank settlements reconcile automatically via your merchant bank account at 11:59 PM.
          </p>
        </div>
      </div>

      {/* 5. Today's Transactions Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary">Today</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-primary" />
            <span className="text-xs text-text-muted">{todayTransactions.length} payments listed</span>
          </div>
          <span className="text-xs font-bold text-text-secondary">
            Total: ₹{totalIncomingToday.toLocaleString('en-IN')}.00
          </span>
        </div>

        {todayTransactions.length > 0 ? (
          <div className="space-y-2.5">
            {todayTransactions.map((tx) => {
              const isEligible = tx.eventType === PaymentEventType.INCOMING_PAYMENT;
              const isAnnounced = tx.announcementStatus === AnnouncementStatus.ANNOUNCED;
              const appColors = getAppColor(tx.sourceAppName);

              return (
                <article
                  key={tx.eventId}
                  onClick={() => setSelectedTx(tx)}
                  className="bg-white p-4 rounded-2xl shadow-subtle border border-surface-border flex flex-col gap-2.5 active:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Branded Micro App Badge */}
                      <div className={`w-10 h-10 rounded-xl ${appColors.bg} ${appColors.text} flex items-center justify-center shrink-0 font-extrabold text-xs shadow-sm`}>
                        {tx.sourceAppName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-primary text-xs sm:text-sm truncate">
                            {tx.payerName || tx.sourceAppName}
                          </span>
                          <span className="text-[10px] bg-surface-container px-1.5 py-0.2 rounded font-bold text-text-secondary shrink-0">
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
                  <div className="flex items-center justify-between pt-1.5 bg-surface-container-low px-3 py-1.5 rounded-xl text-xs -mx-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-text-secondary font-semibold flex items-center gap-1 shadow-subtle border border-surface-border">
                        <Volume2 className="w-3 h-3 text-emerald-primary" />
                        <span>{settings.voice.language === 'hi-IN' ? 'Hindi Voice' : 'English Voice'}</span>
                      </span>

                      {tx.referenceId && (
                        <button
                          onClick={(e) => handleCopy(tx.referenceId!, e)}
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

                    {isEligible && (
                      <button
                        onClick={(e) => handleReplayVoice(tx.amount, e)}
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
          </div>
        ) : (
          <div className="py-8 bg-white rounded-2xl border border-surface-border text-center text-xs text-text-muted">
            No transactions found for the selected filter.
          </div>
        )}
      </section>

      {/* 6. Past Transactions Section (if any) */}
      {pastTransactions.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
              Earlier Transactions
            </span>
            <span className="text-xs text-text-muted">{pastTransactions.length} records</span>
          </div>

          <div className="space-y-2.5">
            {pastTransactions.map((tx) => (
              <article
                key={tx.eventId}
                onClick={() => setSelectedTx(tx)}
                className="bg-white p-4 rounded-2xl shadow-subtle border border-surface-border flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  <span className="font-bold text-xs text-text-primary block">{tx.payerName || tx.sourceAppName}</span>
                  <span className="text-[11px] text-text-muted">{new Date(tx.eventTimestamp).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-emerald-primary block">
                    +₹{tx.amount.toLocaleString('en-IN')}.00
                  </span>
                  <span className="text-[10px] text-text-muted font-semibold">{tx.announcementStatus}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onRepeatVoice={(tx) => speechManager.enqueue(`${tx.amount} rupees received`, settings.voice, true)}
      />

    </div>
  );
};
