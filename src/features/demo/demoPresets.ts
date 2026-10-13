import { RawNotificationPayload, PaymentAppPackage } from '../../types/event';

export interface DemoScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  expectedOutcome: 'ANNOUNCED' | 'REJECTED_OUTGOING' | 'REJECTED_FAILED' | 'REJECTED_PENDING' | 'REJECTED_AMBIGUOUS' | 'SUPPRESSED_DUPLICATE' | 'REFUND_ANNOUNCED';
  payload: RawNotificationPayload;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'phonepe_chai_50',
    name: 'PhonePe: ₹50.00 Received (Chai & Bun)',
    badge: 'Incoming',
    description: 'Typical tea stall payment with UTR reference number. Should announce.',
    expectedOutcome: 'ANNOUNCED',
    payload: {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Received',
      text: '₹50 received from Suresh Kumar (UTR: 328910482910)',
      bigText: '₹50 received from Suresh Kumar (UTR: 328910482910) on PhonePe QR',
      timestamp: Date.now()
    }
  },
  {
    id: 'gpay_1250_50',
    name: 'Google Pay: ₹1,250.50 Received (Kirana Order)',
    badge: 'Incoming',
    description: 'Decimal amount with Indian thousands formatting and VPA handle.',
    expectedOutcome: 'ANNOUNCED',
    payload: {
      packageName: PaymentAppPackage.GPAY,
      title: 'Google Pay',
      text: '₹1,250.50 received from Amit Singh (amit@oksbi). Ref: 402910492810',
      bigText: '₹1,250.50 received from Amit Singh (amit@oksbi). Ref: 402910492810',
      timestamp: Date.now()
    }
  },
  {
    id: 'paytm_25_50',
    name: 'Paytm: ₹25.50 Received',
    badge: 'Incoming',
    description: 'Paytm merchant notification format with paise fraction.',
    expectedOutcome: 'ANNOUNCED',
    payload: {
      packageName: PaymentAppPackage.PAYTM,
      title: 'Money Received',
      text: 'Received ₹25.50 from Priya Sharma. Updated balance available.',
      bigText: 'Received ₹25.50 from Priya Sharma (Txn ID: 938210492810)',
      timestamp: Date.now()
    }
  },
  {
    id: 'bhim_1000',
    name: 'BHIM: Rs.1,000.00 Credited',
    badge: 'Incoming',
    description: 'Official NPCI BHIM credit alert with account tail number.',
    expectedOutcome: 'ANNOUNCED',
    payload: {
      packageName: PaymentAppPackage.BHIM,
      title: 'BHIM UPI Alert',
      text: 'Amount of Rs.1000.00 credited to your A/c ending 4589 by UPI/P2A/329482910',
      timestamp: Date.now()
    }
  },
  {
    id: 'gpay_large_10000',
    name: 'Google Pay: ₹10,000.00 High Value',
    badge: 'Incoming',
    description: 'Five figure payment. Tests Indian numbering and speech formatting.',
    expectedOutcome: 'ANNOUNCED',
    payload: {
      packageName: PaymentAppPackage.GPAY,
      title: 'Payment received',
      text: 'You received ₹10,000 from Rajesh Verma via UPI. UTR: 418291048291',
      timestamp: Date.now()
    }
  },
  {
    id: 'phonepe_outgoing_reject',
    name: 'PhonePe: You Paid ₹500 (Outgoing / Debit)',
    badge: 'Outgoing',
    description: 'CRITICAL SAFETY: Merchant sent money. Must NEVER announce as received!',
    expectedOutcome: 'REJECTED_OUTGOING',
    payload: {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Successful',
      text: 'You paid ₹500 to Ramesh Kirana from State Bank of India account',
      bigText: 'You paid ₹500 to Ramesh Kirana from State Bank of India account ending in 5678',
      timestamp: Date.now()
    }
  },
  {
    id: 'gpay_failed_reject',
    name: 'Google Pay: Payment Failed ₹250',
    badge: 'Failed',
    description: 'CRITICAL SAFETY: Customer transaction failed. Must NOT announce.',
    expectedOutcome: 'REJECTED_FAILED',
    payload: {
      packageName: PaymentAppPackage.GPAY,
      title: 'Google Pay',
      text: 'Payment of ₹250.00 to Sharma Sweets failed. Bank server timed out.',
      timestamp: Date.now()
    }
  },
  {
    id: 'phonepe_pending_reject',
    name: 'PhonePe: Payment Pending ₹1,000',
    badge: 'Pending',
    description: 'CRITICAL SAFETY: Awaiting bank settlement. Must NOT announce as successful.',
    expectedOutcome: 'REJECTED_PENDING',
    payload: {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Payment Pending',
      text: 'Payment of ₹1,000 is pending. We will notify when the bank confirms.',
      timestamp: Date.now()
    }
  },
  {
    id: 'phonepe_refund_150',
    name: 'PhonePe: Refund of ₹150 Received',
    badge: 'Refund',
    description: 'Legitimate refund reversal. Spoken with custom refund voice wording.',
    expectedOutcome: 'REFUND_ANNOUNCED',
    payload: {
      packageName: PaymentAppPackage.PHONEPE,
      title: 'Refund Received',
      text: 'Refund of ₹150 from Swiggy received in your bank account',
      timestamp: Date.now()
    }
  },
  {
    id: 'marketing_coupon_spam',
    name: 'Paytm: Win ₹500 Cashback (Coupon / Spam)',
    badge: 'Ambiguous',
    description: 'Promotional marketing notification. Lacks payment semantics. Must be rejected.',
    expectedOutcome: 'REJECTED_AMBIGUOUS',
    payload: {
      packageName: PaymentAppPackage.PAYTM,
      title: 'Cashback Offer!',
      text: 'Win flat ₹500 cashback on recharge today! Click here to claim coupon.',
      timestamp: Date.now()
    }
  }
];
