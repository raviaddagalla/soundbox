import { PaymentEventType, RawNotificationPayload } from '../../types/event';
import { AppNotificationParser, NotificationParseResult } from './types';
import { extractAmount, extractReferenceId, extractPayerName } from './amountExtractor';

export class GooglePayParser implements AppNotificationParser {
  readonly supportedPackages = ['com.google.android.apps.nbu.paisa.user'];
  readonly appName = 'Google Pay';

  canHandle(packageName: string): boolean {
    return this.supportedPackages.includes(packageName);
  }

  parse(notification: RawNotificationPayload): NotificationParseResult {
    const title = (notification.title || '').trim();
    const text = (notification.text || '').trim();
    const combined = `${title} ${text} ${notification.bigText || ''}`;
    const lower = combined.toLowerCase();

    const notes: string[] = [];

    // 1. Detect Outgoing
    if (
      lower.includes('you paid') ||
      lower.includes('paid to') ||
      lower.includes('money sent') ||
      lower.includes('using your') // "You paid ₹... using your account"
    ) {
      notes.push('Detected Google Pay outgoing payment');
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
      lower.includes('could not be completed') ||
      lower.includes('transaction failed')
    ) {
      notes.push('Detected Google Pay failed transaction');
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
      lower.includes('processing') ||
      lower.includes('payment pending') ||
      lower.includes('waiting for bank')
    ) {
      notes.push('Detected Google Pay processing/pending transaction');
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
    if (lower.includes('refund received') || lower.includes('refund from')) {
      notes.push('Detected Google Pay refund');
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

    // 5. Detect Promotional / Rewards
    if (
      lower.includes('reward earned') ||
      lower.includes('cashback won') ||
      lower.includes('refer a friend') ||
      lower.includes('scratch card')
    ) {
      notes.push('Detected Google Pay reward/promotional message');
      return {
        isPaymentNotification: false,
        inferredType: PaymentEventType.AMBIGUOUS,
        amount: null,
        currency: 'INR',
        notes,
        confidence: 0.99
      };
    }

    // 6. Detect Incoming Payment
    // e.g. "₹1,250.00 received from Amit Singh"
    // "You received ₹10,000 from Rajesh Kumar via UPI."
    const isIncoming =
      lower.includes('received') ||
      lower.includes('payment received') ||
      lower.includes('credited');

    if (isIncoming) {
      const amt = extractAmount(combined);
      if (amt && amt.value > 0) {
        notes.push(`Extracted Google Pay incoming amount: ₹${amt.value}`);
        return {
          isPaymentNotification: true,
          inferredType: PaymentEventType.INCOMING_PAYMENT,
          amount: amt.value,
          currency: amt.currency,
          rawAmountText: amt.rawString,
          payerName: extractPayerName(combined),
          referenceId: extractReferenceId(combined),
          notes,
          confidence: 0.96
        };
      }
    }

    notes.push('Unrecognized Google Pay notification structure');
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
