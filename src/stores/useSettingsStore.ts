import { create } from 'zustand';
import { AppSettings, VoiceAnnouncementSettings, DeduplicationConfig, PrivacyConfig, MerchantProfile } from '../types/settings';
import { PaymentAppPackage } from '../types/event';
import { soundboxDB } from '../services/storage/db';

const DEFAULT_SETTINGS: AppSettings = {
  voice: {
    language: 'hi-IN',
    speechRate: 1.0,
    volume: 1.0,
    pitch: 1.0,
    announcementTemplate: 'Payment received, {amount}',
    hindiTemplate: '{amount} प्राप्त हुए',
    repeatLastAnnouncement: true,
    quietModeEnabled: false,
    quietModeStartHour: 22,
    quietModeEndHour: 6,
    interruptOngoing: false
  },
  sources: {
    [PaymentAppPackage.PHONEPE]: {
      packageName: PaymentAppPackage.PHONEPE,
      displayName: 'PhonePe',
      enabled: true,
      iconName: 'phonepe',
      reliabilityNotice: 'High reliability on Android 10-14. Formats vary slightly by app build.'
    },
    [PaymentAppPackage.GPAY]: {
      packageName: PaymentAppPackage.GPAY,
      displayName: 'Google Pay',
      enabled: true,
      iconName: 'gpay',
      reliabilityNotice: 'Requires Google Pay notifications enabled in system settings.'
    },
    [PaymentAppPackage.PAYTM]: {
      packageName: PaymentAppPackage.PAYTM,
      displayName: 'Paytm',
      enabled: true,
      iconName: 'paytm',
      reliabilityNotice: 'Supports Paytm Business and consumer wallet/UPI notifications.'
    },
    [PaymentAppPackage.BHIM]: {
      packageName: PaymentAppPackage.BHIM,
      displayName: 'BHIM UPI',
      enabled: true,
      iconName: 'bhim',
      reliabilityNotice: 'Official NPCI reference app. Consistent notification schema.'
    },
    [PaymentAppPackage.AMAZON_PAY]: {
      packageName: PaymentAppPackage.AMAZON_PAY,
      displayName: 'Amazon Pay',
      enabled: true,
      iconName: 'amazon',
      reliabilityNotice: 'Standard credit alerts supported.'
    },
    [PaymentAppPackage.MOCK_TEST]: {
      packageName: PaymentAppPackage.MOCK_TEST,
      displayName: 'Soundless Simulator',
      enabled: true,
      iconName: 'simulator',
      reliabilityNotice: 'Simulated source for developer and hackathon verification.'
    }
  },
  deduplication: {
    windowSeconds: 120,
    strictReferenceMatching: true,
    allowSameAmountDistinctPayers: true
  },
  privacy: {
    localOnlyStorage: true,
    retentionDays: 30,
    maskPayerNames: false,
    neverStoreRawNotifications: true,
    cryptographicPairingRequired: true
  },
  merchant: {
    businessName: 'Chai & Snacks Corner',
    onboardingCompleted: false,
    activeListening: true,
    estimatedSoundboxRentalFee: 125,
    setupDate: new Date().toISOString()
  }
};

interface SettingsStoreState {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateVoice: (voice: Partial<VoiceAnnouncementSettings>) => void;
  toggleSource: (packageName: string, enabled: boolean) => void;
  updateDeduplication: (dedup: Partial<DeduplicationConfig>) => void;
  updatePrivacy: (privacy: Partial<PrivacyConfig>) => void;
  updateMerchant: (merchant: Partial<MerchantProfile>) => void;
  toggleActiveListening: () => void;
  completeOnboarding: (businessName: string, language: VoiceAnnouncementSettings['language']) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const persisted = await soundboxDB.loadSettings();
      if (persisted) {
        set({ settings: { ...DEFAULT_SETTINGS, ...persisted }, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  updateVoice: (voiceUpdates) => {
    const updated = {
      ...get().settings,
      voice: { ...get().settings.voice, ...voiceUpdates }
    };
    set({ settings: updated });
    soundboxDB.saveSettings(updated);
  },

  toggleSource: (packageName, enabled) => {
    const currentSources = { ...get().settings.sources };
    if (currentSources[packageName]) {
      currentSources[packageName] = {
        ...currentSources[packageName],
        enabled
      };
      const updated = { ...get().settings, sources: currentSources };
      set({ settings: updated });
      soundboxDB.saveSettings(updated);
    }
  },

  updateDeduplication: (dedupUpdates) => {
    const updated = {
      ...get().settings,
      deduplication: { ...get().settings.deduplication, ...dedupUpdates }
    };
    set({ settings: updated });
    soundboxDB.saveSettings(updated);
  },

  updatePrivacy: (privacyUpdates) => {
    const updated = {
      ...get().settings,
      privacy: { ...get().settings.privacy, ...privacyUpdates }
    };
    set({ settings: updated });
    soundboxDB.saveSettings(updated);
  },

  updateMerchant: (merchantUpdates) => {
    const updated = {
      ...get().settings,
      merchant: { ...get().settings.merchant, ...merchantUpdates }
    };
    set({ settings: updated });
    soundboxDB.saveSettings(updated);
  },

  toggleActiveListening: () => {
    const current = get().settings.merchant.activeListening;
    const updated = {
      ...get().settings,
      merchant: { ...get().settings.merchant, activeListening: !current }
    };
    set({ settings: updated });
    soundboxDB.saveSettings(updated);
  },

  completeOnboarding: (businessName, language) => {
    const updated = {
      ...get().settings,
      voice: { ...get().settings.voice, language },
      merchant: {
        ...get().settings.merchant,
        businessName,
        onboardingCompleted: true,
        activeListening: true
      }
    };
    set({ settings: updated });
    soundboxDB.saveSettings(updated);
  },

  resetToDefaults: () => {
    set({ settings: DEFAULT_SETTINGS });
    soundboxDB.saveSettings(DEFAULT_SETTINGS);
  }
}));
