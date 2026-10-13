export enum PaymentAppPackage {
  PHONEPE = 'com.phonepe.app',
  GPAY = 'com.google.android.apps.nbu.paisa.user',
  PAYTM = 'net.one97.paytm',
  BHIM = 'in.org.npci.upiapp',
  AMAZON_PAY = 'com.amazon.mShop.android.shopping',
  CRED = 'com.dreamplug.androidapp',
  GENERIC_UPI = 'in.org.npci.generic',
  MOCK_TEST = 'in.soundless.mock'
}

export enum PaymentEventType {
  INCOMING_PAYMENT = 'INCOMING_PAYMENT',
  OUTGOING_PAYMENT = 'OUTGOING_PAYMENT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  FAILED_PAYMENT = 'FAILED_PAYMENT',
  BALANCE_UPDATE = 'BALANCE_UPDATE',
  REFUND_REVERSAL = 'REFUND_REVERSAL',
  AMBIGUOUS = 'AMBIGUOUS'
}

export enum AnnouncementStatus {
  QUEUED = 'QUEUED',
  ANNOUNCED = 'ANNOUNCED',
  SUPPRESSED_DUPLICATE = 'SUPPRESSED_DUPLICATE',
  REJECTED_CATEGORY = 'REJECTED_CATEGORY',
  MUTED_QUIET_MODE = 'MUTED_QUIET_MODE',
  FAILED_TTS = 'FAILED_TTS',
  DISABLED_SOURCE = 'DISABLED_SOURCE',
  PAUSED = 'PAUSED'
}

export enum DeviceConnectionStatus {
  CONNECTED_NATIVE = 'CONNECTED_NATIVE',
  CONNECTED_LOCAL_BRIDGE = 'CONNECTED_LOCAL_BRIDGE',
  STANDALONE_WEB = 'STANDALONE_WEB',
  SIMULATED_DEMO = 'SIMULATED_DEMO',
  DISCONNECTED = 'DISCONNECTED'
}

export interface RawNotificationPayload {
  packageName: string;
  title: string;
  text: string;
  subText?: string;
  bigText?: string;
  timestamp: number;
  notificationId?: number | string;
  key?: string;
}

export interface ParsedPaymentData {
  amount: number | null;
  currency: string;
  rawAmountString?: string;
  payerName?: string;
  payerVpa?: string;
  referenceId?: string; // UTR or UPI Txn Ref
  inferredType: PaymentEventType;
  confidence: number; // 0.0 - 1.0 (Informational only, NOT proof of payment)
  parsingNotes: string[];
}

export interface SanitizedTransactionEvent {
  eventId: string;
  sourcePackage: string;
  sourceAppName: string;
  eventType: PaymentEventType;
  amount: number;
  currency: string;
  payerName?: string;
  referenceId?: string;
  eventTimestamp: number;
  classificationConfidence: number;
  classificationReason: string;
  fingerprint: string;
  announcementStatus: AnnouncementStatus;
  announcementText?: string;
  announcementTimestamp?: number;
  isSimulated: boolean;
  rejectionReason?: string;
  rawSummary: {
    title: string;
    textPreview: string; // sanitized preview, NEVER full raw sensitive data
    timestamp: number;
  };
}

export interface PipelineExecutionLog {
  stage: 'ingest' | 'normalize' | 'parse' | 'classify' | 'dedup' | 'queue' | 'announce';
  status: 'SUCCESS' | 'REJECTED' | 'SUPPRESSED' | 'INFO';
  detail: string;
  timestamp: number;
}
