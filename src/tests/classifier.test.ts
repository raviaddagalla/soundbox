import { describe, it, expect } from 'vitest';
import { PaymentClassifier } from '../services/classifier/classifier';
import { PaymentEventType } from '../types/event';
import { NotificationParseResult } from '../services/parser/types';

describe('PaymentClassifier Trust & Safety Enforcement', () => {
  it('permits announcement for valid incoming payment with amount > 0', () => {
    const input: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.INCOMING_PAYMENT,
      amount: 100,
      currency: 'INR',
      confidence: 0.95,
      notes: []
    };

    const decision = PaymentClassifier.evaluate(input, true);
    expect(decision.isEligibleForAnnouncement).toBe(true);
    expect(decision.isTrustSafetyRejected).toBe(false);
    expect(decision.eventType).toBe(PaymentEventType.INCOMING_PAYMENT);
  });

  it('strictly REJECTS outgoing payment from announcement', () => {
    const input: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.OUTGOING_PAYMENT,
      amount: 500,
      currency: 'INR',
      confidence: 0.95,
      notes: []
    };

    const decision = PaymentClassifier.evaluate(input, true);
    expect(decision.isEligibleForAnnouncement).toBe(false);
    expect(decision.isTrustSafetyRejected).toBe(true);
    expect(decision.reason).toContain('Debit/Outgoing payment detected');
  });

  it('strictly REJECTS failed payments from announcement', () => {
    const input: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.FAILED_PAYMENT,
      amount: 250,
      currency: 'INR',
      confidence: 0.98,
      notes: []
    };

    const decision = PaymentClassifier.evaluate(input, true);
    expect(decision.isEligibleForAnnouncement).toBe(false);
    expect(decision.isTrustSafetyRejected).toBe(true);
    expect(decision.reason).toContain('Failed transaction');
  });

  it('strictly REJECTS pending payments from announcement', () => {
    const input: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.PENDING_PAYMENT,
      amount: 1000,
      currency: 'INR',
      confidence: 0.92,
      notes: []
    };

    const decision = PaymentClassifier.evaluate(input, true);
    expect(decision.isEligibleForAnnouncement).toBe(false);
    expect(decision.isTrustSafetyRejected).toBe(true);
    expect(decision.reason).toContain('pending');
  });

  it('strictly REJECTS disabled or untrusted package sources', () => {
    const input: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.INCOMING_PAYMENT,
      amount: 50,
      currency: 'INR',
      confidence: 0.95,
      notes: []
    };

    const decision = PaymentClassifier.evaluate(input, false); // isSourceAllowed = false
    expect(decision.isEligibleForAnnouncement).toBe(false);
    expect(decision.isTrustSafetyRejected).toBe(true);
    expect(decision.reason).toContain('disabled or untrusted');
  });

  it('permits refund event with special announcement flag', () => {
    const input: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.REFUND_REVERSAL,
      amount: 150,
      currency: 'INR',
      confidence: 0.95,
      notes: []
    };

    const decision = PaymentClassifier.evaluate(input, true);
    expect(decision.isEligibleForAnnouncement).toBe(true);
    expect(decision.requiresSpecialAnnouncement).toBe(true);
  });
});
