import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  Filter,
  Calendar,
  Volume2,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Sparkles
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
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'DUPLICATE') {
          if (tx.announcementStatus !== AnnouncementStatus.SUPPRESSED_DUPLICATE) return false;
        } else if (tx.eventType !== selectedCategory) {
          return false;
        }
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
  }, [transactions, selectedCategory, dateFilter, searchQuery]);

  const handleRepeatVoice = async (tx: SanitizedTransactionEvent) => {
    if (tx.announcementText) {
      await speechManager.enqueue(tx.announcementText, settings.voice, true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Transaction Activity & Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sanitized notification events processed by Soundless UPI
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCsv}
            disabled={transactions.length === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={transactions.length === 0}
            className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition disabled:opacity-50"
            title="Clear transaction history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by amount (₹), customer name, UTR reference, or app..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {(['TODAY', 'YESTERDAY', 'WEEK', 'ALL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  dateFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'TODAY'
                  ? 'Today'
                  : filter === 'YESTERDAY'
                  ? 'Yesterday'
                  : filter === 'WEEK'
                  ? 'Last 7 Days'
                  : 'All Time'}
              </button>
            ))}
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: PaymentEventType.INCOMING_PAYMENT, label: 'Incoming (Eligible)' },
            { id: 'DUPLICATE', label: 'Duplicates (Suppressed)' },
            { id: PaymentEventType.OUTGOING_PAYMENT, label: 'Outgoing (Blocked)' },
            { id: PaymentEventType.FAILED_PAYMENT, label: 'Failed (Blocked)' },
            { id: PaymentEventType.PENDING_PAYMENT, label: 'Pending (Blocked)' },
            { id: PaymentEventType.REFUND_REVERSAL, label: 'Refunds' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isEligible = tx.eventType === PaymentEventType.INCOMING_PAYMENT;
              const isAnnounced = tx.announcementStatus === AnnouncementStatus.ANNOUNCED;

              return (
                <div
                  key={tx.eventId}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex items-center justify-between group"
                >
                  {/* Left Column */}
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                      isAnnounced
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.announcementStatus === AnnouncementStatus.SUPPRESSED_DUPLICATE
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tx.sourceAppName.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {tx.payerName || tx.sourceAppName}
                        </span>
                        {tx.isSimulated && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold text-[10px] rounded uppercase">
                            Demo
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isEligible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.eventType === PaymentEventType.OUTGOING_PAYMENT
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {tx.eventType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-1">
                        <span>{tx.sourceAppName}</span>
                        {tx.referenceId && (
                          <span className="font-mono text-[11px] text-slate-500">
                            Ref: {tx.referenceId}
                          </span>
                        )}
                        <span>{new Date(tx.eventTimestamp).toLocaleTimeString()}</span>
                      </div>

                      {tx.announcementText && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          Spoken: "{tx.announcementText}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <div className={`font-black text-base sm:text-lg ${
                        isEligible ? 'text-emerald-600' : 'text-slate-700'
                      }`}>
                        {tx.amount > 0 ? `₹${tx.amount.toLocaleString('en-IN')}` : '—'}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isAnnounced
                          ? 'text-emerald-600'
                          : tx.announcementStatus === AnnouncementStatus.SUPPRESSED_DUPLICATE
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}>
                        {tx.announcementStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition" />
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Filter className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold text-slate-600">No transactions match your filter</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, category filter, or date range.
            </p>
          </div>
        )}

      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onRepeatVoice={handleRepeatVoice}
      />

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Clear All Transaction Records?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete all sanitized transaction records stored locally in your browser's IndexedDB. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearAllTransactions();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
