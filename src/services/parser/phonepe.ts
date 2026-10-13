import { PaymentEventType, RawNotificationPayload } from '../../types/event';
import { AppNotificationParser, NotificationParseResult } from './types';
import { extractAmount, extractReferenceId, extractPayerName } from './amountExtractor';

export class PhonePeParser implements AppNotificationParser {
  readonly supportedPackages = ['com.phonepe.app'];
  readonly appName = 'PhonePe';

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
    if (
      lower.includes('you paid') ||
      lower.includes('paid to') ||
      lower.includes('debited from') ||
      lower.includes('sent to') ||
      lower.includes('payment sent')
    ) {
      notes.push('Detected PhonePe outgoing debit transaction keyword');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.OUTGOING_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        referenceId: extractReferenceId(combined),
        notes,
        confidence: 0.95
      };
    }

    // 2. Detect Failed
    if (
      lower.includes('payment failed') ||
      lower.includes('transaction failed') ||
      lower.includes('could not be processed') ||
      lower.includes('declined')
    ) {
      notes.push('Detected PhonePe failed transaction');
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

    // 3. Detect Pending
    if (
      lower.includes('pending') ||
      lower.includes('processing') ||
      lower.includes('payment initiated') ||
      lower.includes('awaiting confirmation')
    ) {
      notes.push('Detected PhonePe pending transaction status');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.PENDING_PAYMENT,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        notes,
        confidence: 0.92
      };
    }

    // 4. Detect Refund
    if (
      lower.includes('refund received') ||
      lower.includes('refund credited') ||
      lower.includes('refund of')
    ) {
      notes.push('Detected PhonePe refund / reversal event');
      const amt = extractAmount(combined);
      return {
        isPaymentNotification: true,
        inferredType: PaymentEventType.REFUND_REVERSAL,
        amount: amt?.value || null,
        currency: amt?.currency || 'INR',
        rawAmountText: amt?.rawString,
        referenceId: extractReferenceId(combined),
        notes,
        confidence: 0.95
      };
    }

    // 5. Detect Promotional / Scam / Ambiguous
    if (
      lower.includes('win scratch card') ||
      lower.includes('cashback coupon') ||
      lower.includes('win up to') ||
      lower.includes('offer') ||
      lower.includes('loan approved') ||
      lower.includes('earn flat')
    ) {
      notes.push('Detected marketing/promotional notification, ignoring as non-payment');
      return {
        isPaymentNotification: false,
        inferredType: PaymentEventType.AMBIGUOUS,
        amount: null,
        currency: 'INR',
        notes,
        confidence: 0.99
      };
    }

    // 6. Detect Legitimate Incoming Payment
    // Standard PhonePe incoming notification formats:
    // "Payment Received: ₹100 from Ramesh Kumar"
    // "₹500 received from Suresh"
    // "Received ₹25.50 from Anand"
    const isIncomingKeyword =
      lower.includes('received') ||
      lower.includes('credited to your') ||
      lower.includes('payment received') ||
      title.toLowerCase().includes('payment received');

    if (isIncomingKeyword) {
      const amt = extractAmount(combined);
      if (amt && amt.value > 0) {
        notes.push(`Extracted PhonePe incoming payment amount: ₹${amt.value}`);
        return {
          isPaymentNotification: true,
          inferredType: PaymentEventType.INCOMING_PAYMENT,
          amount: amt.value,
          currency: amt.currency,
          rawAmountText: amt.rawString,
          payerName: extractPayerName(combined),
          referenceId: extractReferenceId(combined),
          notes,
          confidence: 0.95
        };
      } else {
        notes.push('Incoming payment keyword matched, but no valid amount found');
        return {
          isPaymentNotification: false,
          inferredType: PaymentEventType.AMBIGUOUS,
          amount: null,
          currency: 'INR',
          notes,
          confidence: 0.8
        };
      }
    }

    // Fallback: Ambiguous / Unsupported
    notes.push('Unrecognized PhonePe notification format');
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
