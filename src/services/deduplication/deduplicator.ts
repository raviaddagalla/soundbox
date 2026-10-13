import { RawNotificationPayload } from '../../types/event';
import { NotificationParseResult } from '../parser/types';
import { DeduplicationConfig } from '../../types/settings';

export interface FingerprintResult {
  fingerprint: string;
  hasReferenceId: boolean;
  components: {
    packageName: string;
    amount: number;
    referenceId?: string;
    payerName?: string;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  matchedEventId?: string;
  previousTimestamp?: number;
  fingerprint: string;
}

interface CachedEventSignature {
  eventId: string;
  fingerprint: string;
  referenceId?: string;
  amount: number;
  timestamp: number;
  payerName?: string;
  packageName: string;
}

export class EventDeduplicator {
  private cache: Map<string, CachedEventSignature> = new Map();

  /**
   * Generates a stable cryptographic-style string hash for an event.
   */
  public generateFingerprint(
    notification: RawNotificationPayload,
    parseResult: NotificationParseResult
  ): FingerprintResult {
    const pkg = notification.packageName;
    const amount = parseResult.amount || 0;
    const refId = parseResult.referenceId;
    const payer = parseResult.payerName ? parseResult.payerName.toLowerCase().trim() : '';

    let fingerprint: string;

    if (refId && refId.length >= 6) {
      // Definitive reference ID exists (e.g. UPI UTR 328910482910)
      fingerprint = `fp_ref_${pkg}_${amount.toFixed(2)}_${refId}`;
    } else {
      // Heuristic fingerprint with payer name
      const sanitizedTitle = (notification.title || '').replace(/\s+/g, '_').toLowerCase();
      fingerprint = `fp_heur_${pkg}_${amount.toFixed(2)}_${payer || sanitizedTitle}`;
    }

    return {
      fingerprint,
      hasReferenceId: Boolean(refId && refId.length >= 6),
      components: {
        packageName: pkg,
        amount,
        referenceId: refId,
        payerName: parseResult.payerName
      }
    };
  }

  /**
   * Checks if an event is a duplicate within the configured window.
   */
  public checkDuplicate(
    fingerprintResult: FingerprintResult,
    timestamp: number,
    config: DeduplicationConfig
  ): DuplicateCheckResult {
    const windowMs = config.windowSeconds * 1000;
    const fp = fingerprintResult.fingerprint;

    // Prune stale cache entries older than windowMs * 3 (or at least 15 minutes)
    const cleanupThreshold = timestamp - Math.max(windowMs * 3, 15 * 60 * 1000);
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < cleanupThreshold) {
        this.cache.delete(key);
      }
    }

    // 1. Strict Reference ID match
    if (fingerprintResult.hasReferenceId) {
      const existing = this.cache.get(fp);
      if (existing) {
        // Any matching reference ID within the deduplication window is a duplicate
        if (Math.abs(timestamp - existing.timestamp) <= windowMs) {
          return {
            isDuplicate: true,
            reason: `Duplicate transaction reference ID '${fingerprintResult.components.referenceId}' received within ${config.windowSeconds}s`,
            matchedEventId: existing.eventId,
            previousTimestamp: existing.timestamp,
            fingerprint: fp
          };
        }
      }
    } else {
      // 2. Heuristic check when reference ID is missing:
      // If amount and package match:
      const existing = this.cache.get(fp);
      if (existing) {
        const timeDiff = Math.abs(timestamp - existing.timestamp);
        if (timeDiff <= windowMs) {
          // Check if payer is identical
          const samePayer =
            fingerprintResult.components.payerName &&
            existing.payerName &&
            fingerprintResult.components.payerName.toLowerCase() === existing.payerName.toLowerCase();

          if (samePayer || !config.allowSameAmountDistinctPayers) {
            return {
              isDuplicate: true,
              reason: `Identical notification received within ${Math.round(timeDiff / 1000)}s (dedup window: ${config.windowSeconds}s)`,
              matchedEventId: existing.eventId,
              previousTimestamp: existing.timestamp,
              fingerprint: fp
            };
          }
        }
      }
    }

    return {
      isDuplicate: false,
      fingerprint: fp
    };
  }

  /**
   * Records processed event into deduplication memory cache
   */
  public recordEvent(
    eventId: string,
    fingerprintResult: FingerprintResult,
    timestamp: number
  ): void {
    this.cache.set(fingerprintResult.fingerprint, {
      eventId,
      fingerprint: fingerprintResult.fingerprint,
      referenceId: fingerprintResult.components.referenceId,
      amount: fingerprintResult.components.amount,
      timestamp,
      payerName: fingerprintResult.components.payerName,
      packageName: fingerprintResult.components.packageName
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const eventDeduplicator = new EventDeduplicator();
