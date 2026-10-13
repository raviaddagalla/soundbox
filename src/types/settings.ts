export interface VoiceAnnouncementSettings {
  language: 'hi-IN' | 'en-IN' | 'te-IN' | 'ta-IN' | 'kn-IN' | 'mr-IN';
  speechRate: number; // 0.8 - 1.5
  volume: number;     // 0.1 - 1.0
  pitch: number;      // 0.8 - 1.2
  announcementTemplate: string; // e.g. "Payment received, {amount} rupees"
  hindiTemplate: string;        // e.g. "{amount} rupaye prapt hue"
  repeatLastAnnouncement: boolean;
  quietModeEnabled: boolean;
  quietModeStartHour: number; // e.g. 22 (10 PM)
  quietModeEndHour: number;   // e.g. 6 (6 AM)
  interruptOngoing: boolean;
}

export interface NotificationSourceConfig {
  packageName: string;
  displayName: string;
  enabled: boolean;
  iconName: string;
  reliabilityNotice: string;
}

export interface DeduplicationConfig {
  windowSeconds: number; // 30s to 600s, default 120s
  strictReferenceMatching: boolean;
  allowSameAmountDistinctPayers: boolean;
}

export interface PrivacyConfig {
  localOnlyStorage: boolean;
  retentionDays: number;
  maskPayerNames: boolean;
  neverStoreRawNotifications: boolean;
  cryptographicPairingRequired: boolean;
}

export interface MerchantProfile {
  businessName: string;
  upiId?: string;
  onboardingCompleted: boolean;
  activeListening: boolean;
  estimatedSoundboxRentalFee: number; // default ₹125/month
  setupDate: string;
}

export interface AppSettings {
  voice: VoiceAnnouncementSettings;
  sources: Record<string, NotificationSourceConfig>;
  deduplication: DeduplicationConfig;
  privacy: PrivacyConfig;
  merchant: MerchantProfile;
}
