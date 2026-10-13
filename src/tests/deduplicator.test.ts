import { describe, it, expect, beforeEach } from 'vitest';
import { EventDeduplicator } from '../services/deduplication/deduplicator';
import { RawNotificationPayload, PaymentAppPackage, PaymentEventType } from '../types/event';
import { NotificationParseResult } from '../services/parser/types';
import { DeduplicationConfig } from '../types/settings';

describe('EventDeduplicator Reliability Engine', () => {
  let dedup: EventDeduplicator;
  const config: DeduplicationConfig = {
    windowSeconds: 120,
    strictReferenceMatching: true,
    allowSameAmountDistinctPayers: true
  };

  beforeEach(() => {
    dedup = new EventDeduplicator();
  });

  it('detects duplicate event when same UTR is received within deduplication window', () => {
    const payload: RawNotificationPayload = {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Received',
      text: '₹50 received from Suresh (UTR: 328910482910)',
      timestamp: 1000000
    };
    const parsed: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.INCOMING_PAYMENT,
      amount: 50,
      currency: 'INR',
      referenceId: '328910482910',
      confidence: 0.95,
      notes: []
    };

    const fp = dedup.generateFingerprint(payload, parsed);
    expect(fp.hasReferenceId).toBe(true);

    // First arrival
    const check1 = dedup.checkDuplicate(fp, 1000000, config);
    expect(check1.isDuplicate).toBe(false);

    dedup.recordEvent('evt_1', fp, 1000000);

    // Re-delivery 15 seconds later (e.g. system notification update or companion reconnect)
    const check2 = dedup.checkDuplicate(fp, 1000000 + 15000, config);
    expect(check2.isDuplicate).toBe(true);
    expect(check2.reason).toContain('Duplicate transaction reference ID');
  });

  it('PRESERVES two legitimate customer payments having the exact same amount', () => {
    // Customer 1 pays ₹20 for tea
    const payload1: RawNotificationPayload = {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Received',
      text: '₹20 received from Rahul Verma (UTR: 111122223333)',
      timestamp: 1000000
    };
    const parsed1: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.INCOMING_PAYMENT,
      amount: 20,
      currency: 'INR',
      payerName: 'Rahul Verma',
      referenceId: '111122223333',
      confidence: 0.95,
      notes: []
    };
    const fp1 = dedup.generateFingerprint(payload1, parsed1);
    expect(dedup.checkDuplicate(fp1, 1000000, config).isDuplicate).toBe(false);
    dedup.recordEvent('evt_1', fp1, 1000000);

    // Customer 2 ALSO pays ₹20 for tea 30 seconds later (distinct UTR and distinct payer!)
    const payload2: RawNotificationPayload = {
      packageName: PaymentAppPackage.GPAY,
      title: 'Google Pay',
      text: '₹20.00 received from Sneha Roy (Ref: 444455556666)',
      timestamp: 1000000 + 30000
    };
    const parsed2: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.INCOMING_PAYMENT,
      amount: 20,
      currency: 'INR',
      payerName: 'Sneha Roy',
      referenceId: '444455556666',
      confidence: 0.95,
      notes: []
    };
    const fp2 = dedup.generateFingerprint(payload2, parsed2);

    // CRITICAL: Must NOT be considered duplicate
    const check2 = dedup.checkDuplicate(fp2, 1000000 + 30000, config);
    expect(check2.isDuplicate).toBe(false);
  });

  it('allows same event outside the deduplication window (e.g. after window expiry)', () => {
    const payload: RawNotificationPayload = {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Received',
      text: '₹50 received from Suresh (UTR: 328910482910)',
      timestamp: 1000000
    };
    const parsed: NotificationParseResult = {
      isPaymentNotification: true,
      inferredType: PaymentEventType.INCOMING_PAYMENT,
      amount: 50,
      currency: 'INR',
      referenceId: '328910482910',
      confidence: 0.95,
      notes: []
    };
    const fp = dedup.generateFingerprint(payload, parsed);
    dedup.recordEvent('evt_1', fp, 1000000);

    // Arrives 300 seconds later (window is 120s)
    const checkExpiry = dedup.checkDuplicate(fp, 1000000 + 300 * 1000, config);
    expect(checkExpiry.isDuplicate).toBe(false);
  });
});
