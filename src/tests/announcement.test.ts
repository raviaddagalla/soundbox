import { describe, it, expect } from 'vitest';
import { formatAmountForSpeech } from '../services/announcement/formatters';
import { buildAnnouncementSpeech } from '../services/announcement/templates';
import { PaymentEventType } from '../types/event';

describe('Voice Announcement Formatting and Templates', () => {
  it('formats ₹1 correctly as singular "1 rupee"', () => {
    const speech = formatAmountForSpeech(1, 'en-IN');
    expect(speech).toBe('1 rupee');
  });

  it('formats ₹25 correctly as plural "25 rupees"', () => {
    const speech = formatAmountForSpeech(25, 'en-IN');
    expect(speech).toBe('25 rupees');
  });

  it('formats ₹125.50 correctly with rupees and paise', () => {
    const speech = formatAmountForSpeech(125.5, 'en-IN');
    expect(speech).toBe('125 rupees and 50 paise');
  });

  it('formats ₹1,000 with Indian thousands formatting', () => {
    const speech = formatAmountForSpeech(1000, 'en-IN');
    expect(speech).toBe('1,000 rupees');
  });

  it('formats Hindi speech amount correctly', () => {
    const speech = formatAmountForSpeech(25, 'hi-IN');
    expect(speech).toBe('25 रुपये');

    const decimalSpeech = formatAmountForSpeech(25.5, 'hi-IN');
    expect(decimalSpeech).toBe('25 रुपये 50 पैसे');
  });

  it('builds full English payment announcement sentence', () => {
    const sentence = buildAnnouncementSpeech(100, PaymentEventType.INCOMING_PAYMENT, 'en-IN');
    expect(sentence).toBe('Payment received, 100 rupees');
  });

  it('builds full Hindi payment announcement sentence', () => {
    const sentence = buildAnnouncementSpeech(50, PaymentEventType.INCOMING_PAYMENT, 'hi-IN');
    expect(sentence).toBe('50 रुपये प्राप्त हुए');
  });

  it('builds full Hindi refund announcement sentence', () => {
    const sentence = buildAnnouncementSpeech(150, PaymentEventType.REFUND_REVERSAL, 'hi-IN');
    expect(sentence).toBe('150 रुपये का रिफंड प्राप्त हुआ');
  });

  it('builds full Telugu payment announcement sentence', () => {
    const sentence = buildAnnouncementSpeech(25, PaymentEventType.INCOMING_PAYMENT, 'te-IN');
    expect(sentence).toBe('25 రూపాయలు అందుకున్నారు');
  });
});
