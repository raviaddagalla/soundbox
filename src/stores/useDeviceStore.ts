import { create } from 'zustand';
import { DeviceConnectionStatus, PipelineExecutionLog } from '../types/event';
import { DiagnosticLogEntry } from '../types/diagnostics';
import { devicePairingService } from '../services/pairing/pairingService';
import { soundboxDB } from '../services/storage/db';

interface DeviceStoreState {
  connectionStatus: DeviceConnectionStatus;
  statusMessage: string;
  notificationPermissionGranted: boolean;
  batteryOptimizationIgnored: boolean;
  companionHost: string;
  companionPort: number;
  pairingToken: string;
  lastHeartbeat: number | null;
  recentPipelineLogs: PipelineExecutionLog[];
  diagnosticLogs: DiagnosticLogEntry[];

  initPairingListeners: () => void;
  connectCompanion: (host?: string) => void;
  disconnectCompanion: () => void;
  setNotificationPermission: (granted: boolean) => void;
  setBatteryOptimization: (ignored: boolean) => void;
  addPipelineLogs: (logs: PipelineExecutionLog[]) => void;
  addDiagnosticLog: (entry: Omit<DiagnosticLogEntry, 'id' | 'timestamp'>) => Promise<void>;
  loadDiagnosticLogs: () => Promise<void>;
  clearDiagnostics: () => Promise<void>;
}

export const useDeviceStore = create<DeviceStoreState>((set, get) => ({
  connectionStatus: DeviceConnectionStatus.STANDALONE_WEB,
  statusMessage: 'Standalone Web Soundbox (Companion bridge ready for connection)',
  notificationPermissionGranted: false, // Explicit: false until verified!
  batteryOptimizationIgnored: false,
  companionHost: '127.0.0.1',
  companionPort: 8765,
  pairingToken: 'snd_sec_key_7894',
  lastHeartbeat: null,
  recentPipelineLogs: [],
  diagnosticLogs: [],

  initPairingListeners: () => {
    // Check if running inside native Android companion
    const androidBridge = typeof window !== 'undefined' ? (window as unknown as { AndroidBridge?: { isNotificationAccessGranted?: () => boolean } }).AndroidBridge : undefined;
    if (androidBridge && typeof androidBridge.isNotificationAccessGranted === 'function') {
      try {
        const isGranted = Boolean(androidBridge.isNotificationAccessGranted());
        set({ notificationPermissionGranted: isGranted });
      } catch {
        // fallback
      }
      // Auto-connect to companion bridge on phone localhost
      get().connectCompanion('127.0.0.1');
    }

    devicePairingService.subscribeStatus((status, details) => {
      set({
        connectionStatus: status,
        statusMessage: details || status,
        lastHeartbeat: devicePairingService.getLastHeartbeat()
      });
    });
  },

  connectCompanion: (host) => {
    const targetHost = host || get().companionHost;
    devicePairingService.connect(targetHost, get().pairingToken);
  },

  disconnectCompanion: () => {
    devicePairingService.disconnect();
    set({
      connectionStatus: DeviceConnectionStatus.STANDALONE_WEB,
      statusMessage: 'Companion bridge disconnected'
    });
  },

  setNotificationPermission: (granted) => {
    set({ notificationPermissionGranted: granted });
    get().addDiagnosticLog({
      level: granted ? 'SUCCESS' : 'WARN',
      category: 'PERMISSION',
      message: granted
        ? 'Notification listener permission enabled by user'
        : 'Notification listener permission revoked or disabled'
    });
  },

  setBatteryOptimization: (ignored) => {
    set({ batteryOptimizationIgnored: ignored });
  },

  addPipelineLogs: (logs) => {
    set({ recentPipelineLogs: logs });
  },

  addDiagnosticLog: async (entry) => {
    const fullLog: DiagnosticLogEntry = {
      ...entry,
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    set(state => ({
      diagnosticLogs: [fullLog, ...state.diagnosticLogs.slice(0, 99)]
    }));
    await soundboxDB.saveDiagnosticLog(fullLog);
  },

  loadDiagnosticLogs: async () => {
    const logs = await soundboxDB.getAllDiagnosticLogs();
    set({ diagnosticLogs: logs });
  },

  clearDiagnostics: async () => {
    set({ diagnosticLogs: [] });
  }
}));
