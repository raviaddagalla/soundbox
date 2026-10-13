import { PaymentEventType, RawNotificationPayload } from '../../types/event';
import { AppNotificationParser, NotificationParseResult } from './types';
import { extractAmount, extractReferenceId } from './amountExtractor';

export class BhimParser implements AppNotificationParser {
  readonly supportedPackages = ['in.org.npci.upiapp'];
  readonly appName = 'BHIM UPI';

  canHandle(packageName: string): boolean {
    return this.supportedPackages.includes(packageName);
  }

  parse(notification: RawNotificationPayload): NotificationParseResult {
    const title = (notification.title || '').trim();
    const text = (notification.text || '').trim();
    const combined = `${title} ${text} ${notification.bigText || ''}`;
    const lower = combined.toLowerCase();

    const notes: string[] = [];

    // 1. Detect Outgoing / Debited
    if (lower.includes('debited') || lower.includes('sent') || lower.includes('paid')) {
      notes.push('Detected BHIM debit/outgoing transaction');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.OUTGOING_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        referenceId: extractReferenceId(combined),
        notes,
        confidence: 0.96
      };
    }

    // 2. Detect Failed
    if (lower.includes('failed') || lower.includes('declined') || lower.includes('timed out')) {
      notes.push('Detected BHIM failed transaction');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.FAILED_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        notes,
        confidence: 0.98
      };
    }

    // 3. Detect Incoming / Credited
    // e.g. "Amount of Rs.1000.00 credited to your A/c ending 4589 by UPI/P2A/329482910..."
    if (lower.includes('credited') || lower.includes('received')) {
      const amt = extractAmount(combined);
      if (amt && amt.value > 0) {
        notes.push(`Extracted BHIM credited amount: ₹${amt.value}`);
        return {
          isPaymentNotification: true,
          inferredType: PaymentEventType.INCOMING_PAYMENT,
          amount: amt.value,
          currency: amt.currency,
          rawAmountText: amt.rawString,
          referenceId: extractReferenceId(combined),
          notes,
          confidence: 0.97
        };
      }
    }

    notes.push('Unrecognized BHIM notification text structure');
    return {
      isPaymentNotification: false,
      inferredType: PaymentEventType.AMBIGUOUS,
      amount: null,
      currency: 'INR',
      notes,
      confidence: 0.5
    };
  }
}
