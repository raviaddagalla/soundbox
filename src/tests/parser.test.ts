import { describe, it, expect } from 'vitest';
import { extractAmount, extractReferenceId, extractPayerName } from '../services/parser/amountExtractor';
import { PhonePeParser } from '../services/parser/phonepe';
import { GooglePayParser } from '../services/parser/gpay';
import { PaytmParser } from '../services/parser/paytm';
import { BhimParser } from '../services/parser/bhim';
import { PaymentEventType, PaymentAppPackage } from '../types/event';

describe('Amount and Reference Extraction', () => {
  it('correctly extracts ₹1 amount', () => {
    const res = extractAmount('Received ₹1 from Test User');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(1);
    expect(res?.currency).toBe('INR');
  });

  it('correctly extracts ₹25.50 decimal amount', () => {
    const res = extractAmount('Received ₹25.50 from Priya Sharma for Chai');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(25.5);
  });

  it('correctly extracts ₹1,000 comma separated amount', () => {
    const res = extractAmount('Payment of ₹1,000 received successfully');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(1000);
  });

  it('correctly extracts ₹10,000 five-figure amount', () => {
    const res = extractAmount('You received ₹10,000 from Rajesh via UPI');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(10000);
  });

  it('correctly extracts Indian lakh format ₹1,00,000.50', () => {
    const res = extractAmount('Credit alert: ₹1,00,000.50 credited');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(100000.5);
  });

  it('does not confuse account numbers with amounts', () => {
    const res = extractAmount('Rs.500 credited to A/c ending 4589');
    expect(res?.value).toBe(500);
  });

  it('extracts UTR reference IDs accurately', () => {
    const ref1 = extractReferenceId('Received ₹50 from Ramesh (UTR: 328910482910)');
    expect(ref1).toBe('328910482910');

    const ref2 = extractReferenceId('Amount credited with UPI Ref: 402910492810');
    expect(ref2).toBe('402910492810');
  });

  it('extracts payer name from notification strings', () => {
    const payer = extractPayerName('Received ₹500 from Ramesh Kumar via UPI');
    expect(payer).toBe('Ramesh Kumar');
  });

  it('returns null for text with no valid money figures', () => {
    const res = extractAmount('Welcome to PhonePe. Please update your KYC.');
    expect(res).toBeNull();
  });
});

describe('PhonePe Parser', () => {
  const parser = new PhonePeParser();

  it('parses incoming payment notification', () => {
    const result = parser.parse({
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Received',
      text: '₹500 received from Suresh (UTR: 328910482910)',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.INCOMING_PAYMENT);
    expect(result.amount).toBe(500);
    expect(result.referenceId).toBe('328910482910');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('correctly classifies outgoing debit as OUTGOING_PAYMENT', () => {
    const result = parser.parse({
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Successful',
      text: 'You paid ₹500 to Ramesh Kirana from A/c XX1234',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.OUTGOING_PAYMENT);
    expect(result.amount).toBe(500);
  });

  it('correctly classifies failed payment as FAILED_PAYMENT', () => {
    const result = parser.parse({
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Failed',
      text: 'Payment of ₹250 to Ramesh failed. Any debited amount will be refunded.',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.FAILED_PAYMENT);
  });

  it('correctly classifies pending payment as PENDING_PAYMENT', () => {
    const result = parser.parse({
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Pending',
      text: 'Payment of ₹1,000 is pending with your bank.',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.PENDING_PAYMENT);
  });

  it('rejects marketing coupons as AMBIGUOUS', () => {
    const result = parser.parse({
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Win Scratch Card!',
      text: 'Win scratch card up to ₹500 on recharge today',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.AMBIGUOUS);
    expect(result.isPaymentNotification).toBe(false);
  });
});

describe('Google Pay & Paytm Parsers', () => {
  const gpayParser = new GooglePayParser();
  const paytmParser = new PaytmParser();

  it('parses Google Pay incoming payment', () => {
    const result = gpayParser.parse({
      packageName: PaymentAppPackage.GPAY,
      title: 'Google Pay',
      text: '₹1,250.50 received from Amit Singh (amit@oksbi)',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.INCOMING_PAYMENT);
    expect(result.amount).toBe(1250.5);
  });

  it('parses Google Pay outgoing payment and flags as OUTGOING_PAYMENT', () => {
    const result = gpayParser.parse({
      packageName: PaymentAppPackage.GPAY,
      title: 'Paid ₹200',
      text: 'You paid ₹200.00 using your State Bank of India account',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.OUTGOING_PAYMENT);
  });

  it('parses Paytm wallet balance update as BALANCE_UPDATE', () => {
    const result = paytmParser.parse({
      packageName: PaymentAppPackage.PAYTM,
      title: 'Paytm Alert',
      text: 'Your wallet balance is low: ₹14.50 remaining',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.BALANCE_UPDATE);
  });
});

describe('BHIM Parser', () => {
  const bhimParser = new BhimParser();

  it('parses BHIM credited notification', () => {
    const result = bhimParser.parse({
      packageName: PaymentAppPackage.BHIM,
      title: 'BHIM UPI',
      text: 'Amount of Rs.1000.00 credited to your A/c ending 4589 by UPI/P2A/329482910',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.INCOMING_PAYMENT);
    expect(result.amount).toBe(1000);
  });

  it('parses BHIM debited notification as OUTGOING_PAYMENT', () => {
    const result = bhimParser.parse({
      packageName: PaymentAppPackage.BHIM,
      title: 'BHIM UPI',
      text: 'Rs.500.00 debited from A/c ending 4589 for UPI Ref 3829104',
      timestamp: Date.now()
    });

    expect(result.inferredType).toBe(PaymentEventType.OUTGOING_PAYMENT);
  });
});
