import { PaymentEventType, RawNotificationPayload } from '../../types/event';
import { AppNotificationParser, NotificationParseResult } from './types';
import { extractAmount, extractReferenceId, extractPayerName } from './amountExtractor';

export class PaytmParser implements AppNotificationParser {
  readonly supportedPackages = ['net.one97.paytm'];
  readonly appName = 'Paytm';

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
      lower.includes('money sent') ||
      lower.includes('payment sent') ||
      lower.includes('sent to') ||
      lower.includes('paid to') ||
      lower.includes('you paid')
    ) {
      notes.push('Detected Paytm outgoing payment');
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
      lower.includes('could not be processed') ||
      lower.includes('failed:')
    ) {
      notes.push('Detected Paytm failed transaction');
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

    // 3. Detect Balance Update
    if (
      lower.includes('balance is low') ||
      lower.includes('wallet balance is') ||
      lower.includes('check your balance')
    ) {
      notes.push('Detected Paytm balance inquiry/update notification');
      return {
        isPaymentNotification: false,
        inferredType: PaymentEventType.BALANCE_UPDATE,
        amount: null,
        currency: 'INR',
        notes,
        confidence: 0.95
      };
    }

    // 4. Detect Pending
    if (lower.includes('pending') || lower.includes('processing')) {
      notes.push('Detected Paytm pending payment');
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

    // 5. Detect Refund
    if (lower.includes('refund received') || lower.includes('refund of')) {
      notes.push('Detected Paytm refund');
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

    // 6. Detect Incoming Payment
    // e.g. "Received ₹25.50 from Priya Sharma. Updated Paytm balance is..."
    // "₹500 received in your Bank Account from Rahul"
    const isIncoming =
      lower.includes('received') ||
      lower.includes('credited to') ||
      lower.includes('money received');

    if (isIncoming) {
      const amt = extractAmount(combined);
      if (amt && amt.value > 0) {
        notes.push(`Extracted Paytm incoming amount: ₹${amt.value}`);
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
      }
    }

    notes.push('Unrecognized Paytm notification structure');
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
