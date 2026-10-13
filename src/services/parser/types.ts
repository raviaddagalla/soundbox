import { PaymentEventType, RawNotificationPayload } from '../../types/event';

export interface ExtractedAmount {
  value: number;
  currency: string;
  rawString: string;
}

export interface NotificationParseResult {
  isPaymentNotification: boolean;
  inferredType: PaymentEventType;
  amount: number | null;
  currency: string;
  rawAmountText?: string;
  payerName?: string;
  payerVpa?: string;
  referenceId?: string; // UTR or Ref ID
  notes: string[];
  confidence: number; // 0.0 to 1.0 (Informational ONLY, not proof of settlement)
}

export interface AppNotificationParser {
  readonly supportedPackages: string[];
  readonly appName: string;
  canHandle(packageName: string): boolean;
  parse(notification: RawNotificationPayload): NotificationParseResult;
}
