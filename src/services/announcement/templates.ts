import { PaymentEventType } from '../../types/event';
import { formatAmountForSpeech } from './formatters';

export interface SupportedLanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  defaultTemplate: string;
  defaultRefundTemplate: string;
}

export const SUPPORTED_LANGUAGES: Record<string, SupportedLanguageInfo> = {
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    defaultTemplate: '{amount} प्राप्त हुए',
    defaultRefundTemplate: '{amount} का रिफंड प्राप्त हुआ'
  },
  'en-IN': {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    defaultTemplate: 'Payment received, {amount}',
    defaultRefundTemplate: 'Refund received, {amount}'
  },
  'te-IN': {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    defaultTemplate: '{amount} అందుకున్నారు',
    defaultRefundTemplate: '{amount} రీఫండ్ అందుకున్నారు'
  },
  'ta-IN': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    defaultTemplate: '{amount} பெறப்பட்டது',
    defaultRefundTemplate: '{amount} ரீஃபண்ட் பெறப்பட்டது'
  },
  'kn-IN': {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    defaultTemplate: '{amount} ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    defaultRefundTemplate: '{amount} ಮರುಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ'
  },
  'mr-IN': {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    defaultTemplate: '{amount} प्राप्त झाले',
    defaultRefundTemplate: '{amount} परतावा प्राप्त झाला'
  }
};

/**
 * Builds the announcement sentence for a payment or refund event.
 */
export function buildAnnouncementSpeech(
  amount: number,
  eventType: PaymentEventType,
  languageCode: string,
  customTemplate?: string
): string {
  const langConfig = SUPPORTED_LANGUAGES[languageCode] || SUPPORTED_LANGUAGES['en-IN'];
  const formattedAmount = formatAmountForSpeech(amount, languageCode);

  let template: string;
  if (eventType === PaymentEventType.REFUND_REVERSAL) {
    template = langConfig.defaultRefundTemplate;
  } else {
    template = customTemplate && customTemplate.includes('{amount}')
      ? customTemplate
      : langConfig.defaultTemplate;
  }

  return template.replace('{amount}', formattedAmount);
}
