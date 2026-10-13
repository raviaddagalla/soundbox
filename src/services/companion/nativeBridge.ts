import {
  SanitizedTransactionEvent,
  PaymentEventType,
  AnnouncementStatus,
  DeviceConnectionStatus
} from '../../types/event';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useDeviceStore } from '../../stores/useDeviceStore';
import { devicePairingService } from '../pairing/pairingService';

// Android Bridge interface declarations
declare global {
  interface Window {
    AndroidBridge?: {
      isNotificationAccessGranted?: () => boolean;
      openNotificationSettings?: () => void;
      speakText?: (text: string, language?: string) => void;
      playTestAnnouncement?: (amount: number) => void;
      isNativeCompanion?: () => boolean;
      getBridgePort?: () => number;
      getAppVersion?: () => string;
      getRecentEvents?: () => string;
      notifyWebReady?: () => void;
    };
    onAndroidPaymentEvent?: (event: unknown) => void;
    onAndroidRecentEvents?: (events: unknown) => void;
    onNotificationPermissionUpdate?: (granted: boolean) => void;
  }
}

/**
 * Maps raw Android companion event JSON into the web app's SanitizedTransactionEvent format.
 */
export function mapNativeToSanitizedTx(raw: Record<string, unknown>): SanitizedTransactionEvent {
  const amount = typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount || 0)) || 0;
  const rawTs = raw.timestamp || raw.eventTimestamp;
  const eventTimestamp = typeof rawTs === 'number' ? rawTs : parseInt(String(rawTs || Date.now()), 10) || Date.now();

  const rawEventType = String(raw.eventType || '');
  const eventType = (Object.values(PaymentEventType) as string[]).includes(rawEventType)
    ? (rawEventType as PaymentEventType)
    : PaymentEventType.INCOMING_PAYMENT;

  const rawStatus = String(raw.announcementStatus || '');
  const announcementStatus = (Object.values(AnnouncementStatus) as string[]).includes(rawStatus)
    ? (rawStatus as AnnouncementStatus)
    : AnnouncementStatus.ANNOUNCED;

  const sourcePackage = String(raw.packageName || raw.sourcePackage || 'in.soundless.companion');
  const sourceAppName = String(raw.appDisplayName || raw.sourceAppName || 'UPI Payment');
  const payerName = raw.payerName ? String(raw.payerName) : undefined;
  const referenceId = raw.referenceId ? String(raw.referenceId) : undefined;
  const announcementText = raw.announcementText ? String(raw.announcementText) : `${amount} rupees received`;
  const rejectionReason = raw.rejectionReason ? String(raw.rejectionReason) : undefined;

  return {
    eventId: String(raw.eventId || `evt_native_${eventTimestamp}_${Math.random().toString(36).substring(2, 7)}`),
    sourcePackage,
    sourceAppName,
    eventType,
    amount,
    currency: String(raw.currency || 'INR'),
    payerName,
    referenceId,
    eventTimestamp,
    classificationConfidence: 1.0,
    classificationReason: 'Verified by Android Companion Notification Listener',
    fingerprint: String(raw.fingerprint || `fp_${eventTimestamp}_${amount}_${referenceId || ''}`),
    announcementStatus,
    announcementText,
    announcementTimestamp: eventTimestamp,
    isSimulated: false,
    rejectionReason,
    rawSummary: {
      title: sourceAppName,
      textPreview: announcementText,
      timestamp: eventTimestamp,
    }
  };
}

/**
 * Handles a single live incoming event from Android native listener.
 */
export async function handleNativePayment(eventData: unknown): Promise<void> {
  if (!eventData) return;
  try {
    const raw = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
    if (typeof raw !== 'object' || raw === null) return;

    const sanitizedTx = mapNativeToSanitizedTx(raw as Record<string, unknown>);
    
    // Add to transaction store and persist to IndexedDB
    await useTransactionStore.getState().addTransaction(sanitizedTx);

    // Record diagnostic log
    await useDeviceStore.getState().addDiagnosticLog({
      level: sanitizedTx.eventType === PaymentEventType.INCOMING_PAYMENT ? 'SUCCESS' : 'INFO',
      category: 'PARSER',
      message: `Native payment processed: ₹${sanitizedTx.amount} from ${sanitizedTx.sourceAppName}${
        sanitizedTx.payerName ? ` (${sanitizedTx.payerName})` : ''
      }${sanitizedTx.referenceId ? ` [UTR: ${sanitizedTx.referenceId}]` : ''}`
    });
  } catch (err) {
    console.error('Error handling native payment event:', err);
  }
}

/**
 * Handles a batch of historical or restored events from Android native companion.
 */
export async function handleBatchNativePayments(eventsData: unknown): Promise<void> {
  if (!eventsData) return;
  try {
    const rawList = typeof eventsData === 'string' ? JSON.parse(eventsData) : eventsData;
    if (!Array.isArray(rawList) || rawList.length === 0) return;

    const sanitizedList: SanitizedTransactionEvent[] = [];
    for (const item of rawList) {
      if (item && typeof item === 'object') {
        sanitizedList.push(mapNativeToSanitizedTx(item as Record<string, unknown>));
      }
    }

    if (sanitizedList.length > 0) {
      await useTransactionStore.getState().addTransactionsBatch(sanitizedList);
    }
  } catch (err) {
    console.error('Error handling batch native payment events:', err);
  }
}

/**
 * Queries AndroidBridge directly to sync any pending or previously stored events.
 */
export function syncFromNativeBridge(): void {
  if (typeof window === 'undefined') return;

  const bridge = window.AndroidBridge;
  if (bridge && typeof bridge.getRecentEvents === 'function') {
    try {
      const recentJson = bridge.getRecentEvents();
      if (recentJson) {
        handleBatchNativePayments(recentJson);
      }
    } catch (err) {
      console.warn('Failed to fetch recent events from AndroidBridge:', err);
    }
  }

  if (bridge && typeof bridge.isNotificationAccessGranted === 'function') {
    try {
      const isGranted = Boolean(bridge.isNotificationAccessGranted());
      useDeviceStore.getState().setNotificationPermission(isGranted);
    } catch {
      // ignore
    }
  }
}

let isBridgeInitialized = false;

/**
 * Initializes global bridges, window handlers, and visibility listeners.
 */
export function setupNativeBridge(): void {
  if (typeof window === 'undefined' || isBridgeInitialized) return;
  isBridgeInitialized = true;

  // 1. Expose live payment listener to Android WebView evaluateJavascript
  window.onAndroidPaymentEvent = (event: unknown) => {
    handleNativePayment(event);
  };

  // 2. Expose batch historical events listener
  window.onAndroidRecentEvents = (events: unknown) => {
    handleBatchNativePayments(events);
  };

  // 3. Expose notification permission update listener
  window.onNotificationPermissionUpdate = (granted: boolean) => {
    useDeviceStore.getState().setNotificationPermission(Boolean(granted));
  };

  // 4. Subscribe to WebSocket events if connected via local bridge
  devicePairingService.subscribeEvent((event) => {
    handleNativePayment(event);
  });

  // 5. Query Android Bridge immediately on startup
  syncFromNativeBridge();

  // 6. Notify native companion that web client is ready
  if (window.AndroidBridge && typeof window.AndroidBridge.notifyWebReady === 'function') {
    try {
      window.AndroidBridge.notifyWebReady();
    } catch {
      // ignore
    }
  }

  // 7. Auto re-sync when app resumes or regains focus (e.g., returning from UPI payment app)
  window.addEventListener('focus', () => {
    syncFromNativeBridge();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncFromNativeBridge();
    }
  });

  // Update connection status in device store
  if (window.AndroidBridge?.isNativeCompanion?.()) {
    useDeviceStore.setState({
      connectionStatus: DeviceConnectionStatus.CONNECTED_NATIVE,
      statusMessage: 'Embedded in Android Native Companion (Direct JS Interface active)'
    });
  }
}
