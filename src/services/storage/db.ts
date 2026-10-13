import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SanitizedTransactionEvent } from '../../types/event';
import { DiagnosticLogEntry } from '../../types/diagnostics';
import { AppSettings } from '../../types/settings';

interface SoundboxDBSchema extends DBSchema {
  transactions: {
    key: string;
    value: SanitizedTransactionEvent;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
      'by-status': string;
    };
  };
  diagnostics: {
    key: string;
    value: DiagnosticLogEntry;
    indexes: {
      'by-timestamp': number;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'soundless_upi_db';
const DB_VERSION = 1;

class SoundboxDatabase {
  private dbPromise: Promise<IDBPDatabase<SoundboxDBSchema>> | null = null;

  private getDB(): Promise<IDBPDatabase<SoundboxDBSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<SoundboxDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Store 1: Transactions
          if (!db.objectStoreNames.contains('transactions')) {
            const txStore = db.createObjectStore('transactions', { keyPath: 'eventId' });
            txStore.createIndex('by-timestamp', 'eventTimestamp');
            txStore.createIndex('by-type', 'eventType');
            txStore.createIndex('by-status', 'announcementStatus');
          }

          // Store 2: Diagnostics
          if (!db.objectStoreNames.contains('diagnostics')) {
            const diagStore = db.createObjectStore('diagnostics', { keyPath: 'id' });
            diagStore.createIndex('by-timestamp', 'timestamp');
          }

          // Store 3: Settings
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });
    }
    return this.dbPromise;
  }

  public async saveTransaction(tx: SanitizedTransactionEvent): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('transactions', tx);
    } catch (e) {
      console.error('Error saving transaction to IndexedDB:', e);
    }
  }

  public async getAllTransactions(): Promise<SanitizedTransactionEvent[]> {
    try {
      const db = await this.getDB();
      const all = await db.getAllFromIndex('transactions', 'by-timestamp');
      return all.reverse(); // Newest first
    } catch (e) {
      console.warn('Falling back from IndexedDB getAllTransactions:', e);
      return [];
    }
  }

  public async deleteTransaction(eventId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('transactions', eventId);
  }

  public async clearAllData(): Promise<void> {
    const db = await this.getDB();
    await db.clear('transactions');
    await db.clear('diagnostics');
  }

  public async saveDiagnosticLog(log: DiagnosticLogEntry): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('diagnostics', log);
    } catch {
      // ignore
    }
  }

  public async getAllDiagnosticLogs(): Promise<DiagnosticLogEntry[]> {
    try {
      const db = await this.getDB();
      const all = await db.getAllFromIndex('diagnostics', 'by-timestamp');
      return all.reverse();
    } catch {
      return [];
    }
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    await db.put('settings', settings, 'app_settings');
  }

  public async loadSettings(): Promise<AppSettings | null> {
    try {
      const db = await this.getDB();
      const s = await db.get('settings', 'app_settings');
      return (s as AppSettings) || null;
    } catch {
      return null;
    }
  }
}

export const soundboxDB = new SoundboxDatabase();
