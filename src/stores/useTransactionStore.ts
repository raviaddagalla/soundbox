import { create } from 'zustand';
import { SanitizedTransactionEvent, PaymentEventType, AnnouncementStatus } from '../types/event';
import { soundboxDB } from '../services/storage/db';
import { speechManager } from '../services/announcement/speechManager';
import { useSettingsStore } from './useSettingsStore';

interface TransactionStoreState {
  transactions: SanitizedTransactionEvent[];
  selectedCategory: string; // 'ALL' or PaymentEventType
  searchQuery: string;
  dateFilter: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'ALL';
  isLoading: boolean;

  loadTransactions: () => Promise<void>;
  addTransaction: (tx: SanitizedTransactionEvent) => Promise<void>;
  setSelectedCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  setDateFilter: (filter: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'ALL') => void;
  clearAllTransactions: () => Promise<void>;
  repeatLastAnnouncement: () => Promise<boolean>;
  exportToCsv: () => void;

  // Computed statistics
  getStats: () => {
    todayTotalAmount: number;
    todayIncomingCount: number;
    todayAnnouncedCount: number;
    todayDuplicateCount: number;
    todayRejectedCount: number;
    mostRecentEligible?: SanitizedTransactionEvent;
  };
}

export const useTransactionStore = create<TransactionStoreState>((set, get) => ({
  transactions: [],
  selectedCategory: 'ALL',
  searchQuery: '',
  dateFilter: 'TODAY',
  isLoading: false,

  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const list = await soundboxDB.getAllTransactions();
      set({ transactions: list, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTransaction: async (tx: SanitizedTransactionEvent) => {
    // Add to state newest first
    set((state) => ({
      transactions: [tx, ...state.transactions]
    }));
    await soundboxDB.saveTransaction(tx);
  },

  setSelectedCategory: (cat: string) => set({ selectedCategory: cat }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),
  setDateFilter: (filter) => set({ dateFilter: filter }),

  clearAllTransactions: async () => {
    await soundboxDB.clearAllData();
    set({ transactions: [] });
  },

  repeatLastAnnouncement: async () => {
    const settings = useSettingsStore.getState().settings;
    return speechManager.repeatLastAnnouncement(settings.voice);
  },

  exportToCsv: () => {
    const list = get().transactions;
    if (list.length === 0) return;

    const headers = [
      'Event ID',
      'Timestamp',
      'Date Time',
      'App',
      'Event Type',
      'Amount (INR)',
      'Payer Name',
      'Reference ID',
      'Announcement Status',
      'Spoken Text',
      'Is Simulated',
      'Rejection Reason'
    ];

    const rows = list.map(tx => [
      tx.eventId,
      tx.eventTimestamp,
      new Date(tx.eventTimestamp).toLocaleString(),
      tx.sourceAppName,
      tx.eventType,
      tx.amount,
      `"${tx.payerName || ''}"`,
      `"${tx.referenceId || ''}"`,
      tx.announcementStatus,
      `"${tx.announcementText || ''}"`,
      tx.isSimulated ? 'YES' : 'NO',
      `"${tx.rejectionReason || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `soundless_upi_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  getStats: () => {
    const txs = get().transactions;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startTs = startOfToday.getTime();

    const todayTxs = txs.filter(t => t.eventTimestamp >= startTs);

    let todayTotalAmount = 0;
    let todayIncomingCount = 0;
    let todayAnnouncedCount = 0;
    let todayDuplicateCount = 0;
    let todayRejectedCount = 0;

    for (const t of todayTxs) {
      if (t.eventType === PaymentEventType.INCOMING_PAYMENT) {
        todayTotalAmount += t.amount;
        todayIncomingCount++;
      }
      if (t.announcementStatus === AnnouncementStatus.ANNOUNCED) {
        todayAnnouncedCount++;
      }
      if (t.announcementStatus === AnnouncementStatus.SUPPRESSED_DUPLICATE) {
        todayDuplicateCount++;
      }
      if (
        t.announcementStatus === AnnouncementStatus.REJECTED_CATEGORY ||
        t.announcementStatus === AnnouncementStatus.DISABLED_SOURCE
      ) {
        todayRejectedCount++;
      }
    }

    const mostRecentEligible = txs.find(t => t.eventType === PaymentEventType.INCOMING_PAYMENT);

    return {
      todayTotalAmount,
      todayIncomingCount,
      todayAnnouncedCount,
      todayDuplicateCount,
      todayRejectedCount,
      mostRecentEligible
    };
  }
}));
