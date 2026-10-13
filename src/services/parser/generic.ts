import { PaymentEventType, RawNotificationPayload } from '../../types/event';
import { AppNotificationParser, NotificationParseResult } from './types';
import { extractAmount, extractReferenceId, extractPayerName } from './amountExtractor';

export class GenericUpiParser implements AppNotificationParser {
  readonly supportedPackages = [
    'com.amazon.mShop.android.shopping',
    'com.dreamplug.androidapp',
    'in.org.npci.generic',
    'in.soundless.mock',
    'default'
  ];
  readonly appName = 'UPI Banking Alert';

  canHandle(_packageName: string): boolean {
    return true; // Fallback parser for any allowlisted package
  }

  parse(notification: RawNotificationPayload): NotificationParseResult {
    const title = (notification.title || '').trim();
    const text = (notification.text || '').trim();
    const combined = `${title} ${text} ${notification.bigText || ''}`;
    const lower = combined.toLowerCase();

    const notes: string[] = [];

    // 1. Detect Outgoing
    if (
      lower.includes('debited') ||
      lower.includes('you paid') ||
      lower.includes('sent to') ||
      lower.includes('withdrawn')
    ) {
      notes.push('Detected generic debit/outgoing payment text');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.OUTGOING_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        referenceId: extractReferenceId(combined),
        notes,
        confidence: 0.9
      };
    }

    // 2. Detect Failed
    if (lower.includes('failed') || lower.includes('declined') || lower.includes('unsuccessful')) {
      notes.push('Detected generic failed payment keyword');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.FAILED_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        notes,
        confidence: 0.95
      };
    }

    // 3. Detect Pending
    if (lower.includes('pending') || lower.includes('processing')) {
      notes.push('Detected generic pending payment keyword');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.PENDING_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        notes,
        confidence: 0.9
      };
    }

    // 4. Detect Refund
    if (lower.includes('refund received') || lower.includes('refund credited')) {
      notes.push('Detected generic refund keyword');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.REFUND_REVERSAL,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        referenceId: extractReferenceId(combined),
        notes,
        confidence: 0.9
      };
    }

    // 5. Detect Incoming Credited Payment
    if (
      lower.includes('credited') ||
      lower.includes('received') ||
      lower.includes('payment received')
    ) {
      const amt = extractAmount(combined);
      if (amt && amt.value > 0) {
        notes.push(`Extracted incoming payment amount: ₹${amt.value}`);
        return {
          isPaymentNotification: true,
          inferredType: PaymentEventType.INCOMING_PAYMENT,
          amount: amt.value,
          currency: amt.currency,
          rawAmountText: amt.rawString,
          payerName: extractPayerName(combined),
          referenceId: extractReferenceId(combined),
          notes,
          confidence: 0.92
        };
      }
    }

    notes.push('Unrecognized generic notification text');
    return {
      isPaymentNotification: false,
      inferredType: PaymentEventType.AMBIGUOUS,
      amount: null,
      currency: 'INR',
      notes,
      confidence: 0.4
    };
  }
}
