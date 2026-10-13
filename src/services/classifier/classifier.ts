import { PaymentEventType } from '../../types/event';
import { NotificationParseResult } from '../parser/types';

export interface ClassificationDecision {
  isEligibleForAnnouncement: boolean;
  eventType: PaymentEventType;
  reason: string;
  isTrustSafetyRejected: boolean;
  requiresSpecialAnnouncement?: boolean; // e.g. for Refund
}

export class PaymentClassifier {
  /**
   * Strictly evaluates whether a parsed notification event may trigger an announcement.
   * Enforces trust and safety rules.
   */
  public static evaluate(
    parseResult: NotificationParseResult,
    isSourceAllowed: boolean
  ): ClassificationDecision {
    // Rule 1: Untrusted or disabled application
    if (!isSourceAllowed) {
      return {
        isEligibleForAnnouncement: false,
        eventType: PaymentEventType.AMBIGUOUS,
        reason: 'Source package is disabled or untrusted in merchant preferences',
        isTrustSafetyRejected: true
      };
    }

    // Rule 2: Ambiguous or not a payment notification
    if (!parseResult.isPaymentNotification || parseResult.inferredType === PaymentEventType.AMBIGUOUS) {
      return {
        isEligibleForAnnouncement: false,
        eventType: PaymentEventType.AMBIGUOUS,
        reason: 'Notification content is ambiguous, promotional, or unverified',
        isTrustSafetyRejected: true
      };
    }

    // Rule 3: Outgoing payment (Debited) - CRITICAL SAFETY: Never announce money sent as money received
    if (parseResult.inferredType === PaymentEventType.OUTGOING_PAYMENT) {
      return {
        isEligibleForAnnouncement: false,
        eventType: PaymentEventType.OUTGOING_PAYMENT,
        reason: 'Debit/Outgoing payment detected. Merchant cannot announce money sent as received.',
        isTrustSafetyRejected: true
      };
    }

    // Rule 4: Payment Failed - CRITICAL SAFETY
    if (parseResult.inferredType === PaymentEventType.FAILED_PAYMENT) {
      return {
        isEligibleForAnnouncement: false,
        eventType: PaymentEventType.FAILED_PAYMENT,
        reason: 'Failed transaction detected. Never announce failed payments.',
        isTrustSafetyRejected: true
      };
    }

    // Rule 5: Payment Pending or Initiated - CRITICAL SAFETY
    if (parseResult.inferredType === PaymentEventType.PENDING_PAYMENT) {
      return {
        isEligibleForAnnouncement: false,
        eventType: PaymentEventType.PENDING_PAYMENT,
        reason: 'Payment is pending bank clearance. Awaiting settlement.',
        isTrustSafetyRejected: true
      };
    }

    // Rule 6: Balance updates / informational
    if (parseResult.inferredType === PaymentEventType.BALANCE_UPDATE) {
      return {
        isEligibleForAnnouncement: false,
        eventType: PaymentEventType.BALANCE_UPDATE,
        reason: 'Informational balance update, not an incoming transaction event.',
        isTrustSafetyRejected: false
      };
    }

    // Rule 7: Refund or reversal
    if (parseResult.inferredType === PaymentEventType.REFUND_REVERSAL) {
      if (parseResult.amount && parseResult.amount > 0) {
        return {
          isEligibleForAnnouncement: true,
          eventType: PaymentEventType.REFUND_REVERSAL,
          reason: `Eligible for separate refund announcement: ₹${parseResult.amount}`,
          isTrustSafetyRejected: false,
          requiresSpecialAnnouncement: true
        };
      }
    }

    // Rule 8: Incoming Payment
    if (parseResult.inferredType === PaymentEventType.INCOMING_PAYMENT) {
      if (!parseResult.amount || parseResult.amount <= 0) {
        return {
          isEligibleForAnnouncement: false,
          eventType: PaymentEventType.AMBIGUOUS,
          reason: 'Incoming payment message lacks a valid parsed amount (> 0)',
          isTrustSafetyRejected: true
        };
      }

      if (parseResult.confidence < 0.7) {
        return {
          isEligibleForAnnouncement: false,
          eventType: PaymentEventType.AMBIGUOUS,
          reason: 'Parser confidence below safety threshold (< 70%)',
          isTrustSafetyRejected: true
        };
      }

      return {
        isEligibleForAnnouncement: true,
        eventType: PaymentEventType.INCOMING_PAYMENT,
        reason: `Eligible incoming payment notification indicating ₹${parseResult.amount}`,
        isTrustSafetyRejected: false
      };
    }

    // Fallback reject
    return {
      isEligibleForAnnouncement: false,
      eventType: PaymentEventType.AMBIGUOUS,
      reason: 'Unknown classification state',
      isTrustSafetyRejected: true
    };
  }
}
