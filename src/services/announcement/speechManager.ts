import { chimePlayer } from './chime';
import { VoiceAnnouncementSettings } from '../../types/settings';

export interface SpeechQueueItem {
  id: string;
  text: string;
  language: string;
  rate: number;
  volume: number;
  pitch: number;
  priority: number;
  timestamp: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

export class SpeechManager {
  private queue: SpeechQueueItem[] = [];
  private isSpeaking = false;
  private lastAnnouncedText: string | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  /**
   * Checks whether quiet mode is active right now
   */
  public isQuietModeActive(settings: VoiceAnnouncementSettings): boolean {
    if (!settings.quietModeEnabled) return false;
    const currentHour = new Date().getHours();
    const start = settings.quietModeStartHour;
    const end = settings.quietModeEndHour;

    if (start < end) {
      return currentHour >= start && currentHour < end;
    } else {
      // Overnight (e.g. 22:00 to 06:00)
      return currentHour >= start || currentHour < end;
    }
  }

  /**
   * Enqueues speech and plays chime first
   */
  public async enqueue(
    text: string,
    settings: VoiceAnnouncementSettings,
    playChime = true
  ): Promise<boolean> {
    if (this.isQuietModeActive(settings)) {
      console.info('Quiet mode active; speech suppressed.');
      return false;
    }

    if (playChime) {
      await chimePlayer.playPaymentChime();
    }

    return new Promise((resolve) => {
      const item: SpeechQueueItem = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        language: settings.language,
        rate: settings.speechRate,
        volume: settings.volume,
        pitch: settings.pitch,
        priority: 1,
        timestamp: Date.now(),
        onEnd: () => {
          this.lastAnnouncedText = text;
          resolve(true);
        },
        onError: () => {
          resolve(false);
        }
      };

      if (settings.interruptOngoing && this.isSpeaking) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          this.isSpeaking = false;
        }
        this.queue.unshift(item);
      } else {
        this.queue.push(item);
      }

      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.isSpeaking || this.queue.length === 0) {
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis API not available in this environment');
      const item = this.queue.shift();
      item?.onError?.(new Error('TTS not supported'));
      return;
    }

    const currentItem = this.queue.shift();
    if (!currentItem) return;

    this.isSpeaking = true;
    currentItem.onStart?.();

    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    utterance.rate = currentItem.rate;
    utterance.volume = currentItem.volume;
    utterance.pitch = currentItem.pitch;
    utterance.lang = currentItem.language;

    // Pick best matching voice
    const voices = this.getAvailableVoices();
    const prefix = currentItem.language.split('-')[0];
    const matchedVoice =
      voices.find(v => v.lang === currentItem.language) ||
      voices.find(v => v.lang.startsWith(prefix)) ||
      voices.find(v => v.lang.includes('IN')) ||
      voices[0];

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      currentItem.onEnd?.();
      // Process next in queue
      setTimeout(() => this.processQueue(), 100);
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis utterance error:', e);
      this.isSpeaking = false;
      currentItem.onError?.(new Error(e.error || 'TTS utterance error'));
      setTimeout(() => this.processQueue(), 100);
    };

    window.speechSynthesis.speak(utterance);
  }

  public repeatLastAnnouncement(settings: VoiceAnnouncementSettings): Promise<boolean> {
    if (!this.lastAnnouncedText) {
      return Promise.resolve(false);
    }
    return this.enqueue(this.lastAnnouncedText, settings, false);
  }

  public testVoice(
    sampleText: string,
    settings: VoiceAnnouncementSettings
  ): Promise<boolean> {
    return this.enqueue(sampleText, settings, true);
  }

  public cancel(): void {
    this.queue = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }
}

export const speechManager = new SpeechManager();
