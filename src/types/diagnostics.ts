export interface DiagnosticLogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  category: 'PERMISSION' | 'PARSER' | 'DEDUP' | 'TTS' | 'PAIRING' | 'STORAGE';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DeviceHealthReport {
  notificationPermissionGranted: boolean;
  batteryOptimizationIgnored: boolean;
  companionServiceActive: boolean;
  ttsEngineReady: boolean;
  availableVoices: string[];
  lastNotificationTime: number | null;
  lastEligibleEventTime: number | null;
  lastAnnouncementAttempt: number | null;
  lastAnnouncementSuccess: boolean | null;
  rejectedCountToday: number;
  duplicateCountToday: number;
  connectionMode: 'NATIVE' | 'LOCAL_BRIDGE' | 'STANDALONE' | 'SIMULATOR';
  androidOsVersion?: string;
}
