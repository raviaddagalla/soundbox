import {
  RawNotificationPayload,
  SanitizedTransactionEvent,
  AnnouncementStatus,
  PipelineExecutionLog,
  PaymentEventType
} from '../../types/event';
import { AppSettings } from '../../types/settings';
import { parserRegistry } from '../parser';
import { PaymentClassifier } from '../classifier/classifier';
import { eventDeduplicator } from '../deduplication/deduplicator';
import { speechManager } from '../announcement/speechManager';
import { buildAnnouncementSpeech } from '../announcement/templates';

export interface PipelineResult {
  event: SanitizedTransactionEvent;
  logs: PipelineExecutionLog[];
  wasAnnounced: boolean;
}

export class NotificationProcessingPipeline {
  /**
   * Executes the full 12-step notification processing pipeline.
   */
  public async processNotification(
    payload: RawNotificationPayload,
    settings: AppSettings,
    isSimulated = false
  ): Promise<PipelineResult> {
    const logs: PipelineExecutionLog[] = [];
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    // Step 1: Ingest
    logs.push({
      stage: 'ingest',
      status: 'SUCCESS',
      detail: `Received notification from package '${payload.packageName}' at ${new Date(payload.timestamp).toLocaleTimeString()}`,
      timestamp: Date.now()
    });

    // Step 2: Source Allowlist check
    const sourceConfig = settings.sources[payload.packageName];
    const isAllowed = isSimulated || (sourceConfig ? sourceConfig.enabled : true);

    if (!isAllowed) {
      logs.push({
        stage: 'ingest',
        status: 'REJECTED',
        detail: `Source package '${payload.packageName}' is disabled in merchant settings`,
        timestamp: Date.now()
      });

      const rejectedEvent: SanitizedTransactionEvent = {
        eventId,
        sourcePackage: payload.packageName,
        sourceAppName: sourceConfig?.displayName || payload.packageName,
        eventType: PaymentEventType.AMBIGUOUS,
        amount: 0,
        currency: 'INR',
        eventTimestamp: payload.timestamp || now,
        classificationConfidence: 0,
        classificationReason: 'Source package is disabled in settings',
        fingerprint: `fp_disabled_${payload.packageName}`,
        announcementStatus: AnnouncementStatus.DISABLED_SOURCE,
        isSimulated,
        rejectionReason: 'Source application disabled',
        rawSummary: {
          title: payload.title || '',
          textPreview: (payload.text || '').substring(0, 60),
          timestamp: payload.timestamp
        }
      };

      return { event: rejectedEvent, logs, wasAnnounced: false };
    }

    // Step 3 & 4: Normalize & Parse using source-specific parser
    const { parserName, result: parseResult } = parserRegistry.parse(payload);
    logs.push({
      stage: 'parse',
      status: parseResult.isPaymentNotification ? 'SUCCESS' : 'INFO',
      detail: `Parsed with ${parserName}: Inferred=${parseResult.inferredType}, Amount=₹${parseResult.amount ?? 'N/A'}, Ref=${parseResult.referenceId ?? 'None'}`,
      timestamp: Date.now()
    });

    // Step 5 & 6 & 7: Classification & Trust/Safety Check
    const classification = PaymentClassifier.evaluate(parseResult, isAllowed);
    logs.push({
      stage: 'classify',
      status: classification.isEligibleForAnnouncement ? 'SUCCESS' : 'REJECTED',
      detail: `Classification: ${classification.eventType} - ${classification.reason}`,
      timestamp: Date.now()
    });

    // Step 8: Deduplication Check
    const fingerprintResult = eventDeduplicator.generateFingerprint(payload, parseResult);
    const dedupResult = eventDeduplicator.checkDuplicate(
      fingerprintResult,
      payload.timestamp || now,
      settings.deduplication
    );

    let announcementStatus: AnnouncementStatus;
    let rejectionReason: string | undefined;

    if (!classification.isEligibleForAnnouncement) {
      announcementStatus = AnnouncementStatus.REJECTED_CATEGORY;
      rejectionReason = classification.reason;
    } else if (dedupResult.isDuplicate) {
      announcementStatus = AnnouncementStatus.SUPPRESSED_DUPLICATE;
      rejectionReason = dedupResult.reason;
      logs.push({
        stage: 'dedup',
        status: 'SUPPRESSED',
        detail: `Deduplication suppressed event: ${dedupResult.reason}`,
        timestamp: Date.now()
      });
    } else if (!settings.merchant.activeListening) {
      announcementStatus = AnnouncementStatus.PAUSED;
      rejectionReason = 'Soundbox active listening is paused by merchant';
      logs.push({
        stage: 'queue',
        status: 'INFO',
        detail: 'Soundbox announcement paused; speech bypassed',
        timestamp: Date.now()
      });
    } else {
      announcementStatus = AnnouncementStatus.QUEUED;
      logs.push({
        stage: 'dedup',
        status: 'SUCCESS',
        detail: `Fingerprint valid (${fingerprintResult.fingerprint.substring(0, 24)}...). Ready for speech queue.`,
        timestamp: Date.now()
      });
    }

    // Record fingerprint in deduplication cache if eligible
    if (classification.isEligibleForAnnouncement && !dedupResult.isDuplicate) {
      eventDeduplicator.recordEvent(eventId, fingerprintResult, payload.timestamp || now);
    }

    // Step 9 & 10: Apply merchant preferences & Speech Announcement
    let announcementText: string | undefined;
    let announcementTimestamp: number | undefined;
    let wasAnnounced = false;

    if (announcementStatus === AnnouncementStatus.QUEUED) {
      const amountVal = parseResult.amount || 0;
      announcementText = buildAnnouncementSpeech(
        amountVal,
        classification.eventType,
        settings.voice.language,
        settings.voice.announcementTemplate
      );

      logs.push({
        stage: 'queue',
        status: 'SUCCESS',
        detail: `Queued announcement: "${announcementText}" [${settings.voice.language}]`,
        timestamp: Date.now()
      });

      // Execute announcement
      try {
        const speechSuccess = await speechManager.enqueue(announcementText, settings.voice, true);
        if (speechSuccess) {
          announcementStatus = AnnouncementStatus.ANNOUNCED;
          announcementTimestamp = Date.now();
          wasAnnounced = true;
          logs.push({
            stage: 'announce',
            status: 'SUCCESS',
            detail: `Voice announced successfully through TextToSpeech engine`,
            timestamp: Date.now()
          });
        } else {
          announcementStatus = AnnouncementStatus.MUTED_QUIET_MODE;
          logs.push({
            stage: 'announce',
            status: 'INFO',
            detail: `Speech suppressed (Quiet mode active)`,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        announcementStatus = AnnouncementStatus.FAILED_TTS;
        rejectionReason = err instanceof Error ? err.message : 'TTS failure';
        logs.push({
          stage: 'announce',
          status: 'REJECTED',
          detail: `TTS voice error: ${rejectionReason}`,
          timestamp: Date.now()
        });
      }
    }

    // Step 11: Create sanitized transaction event (NO raw sensitive strings persisted)
    const sanitizedEvent: SanitizedTransactionEvent = {
      eventId,
      sourcePackage: payload.packageName,
      sourceAppName: sourceConfig?.displayName || parserName,
      eventType: classification.eventType,
      amount: parseResult.amount || 0,
      currency: parseResult.currency || 'INR',
      payerName: settings.privacy.maskPayerNames && parseResult.payerName
        ? `${parseResult.payerName.slice(0, 1)}***`
        : parseResult.payerName,
      referenceId: parseResult.referenceId,
      eventTimestamp: payload.timestamp || now,
      classificationConfidence: parseResult.confidence,
      classificationReason: classification.reason,
      fingerprint: fingerprintResult.fingerprint,
      announcementStatus,
      announcementText,
      announcementTimestamp,
      isSimulated,
      rejectionReason,
      rawSummary: {
        title: (payload.title || '').substring(0, 40),
        textPreview: (payload.text || '').substring(0, 60),
        timestamp: payload.timestamp || now
      }
    };

    return {
      event: sanitizedEvent,
      logs,
      wasAnnounced
    };
  }
}

export const notificationPipeline = new NotificationProcessingPipeline();
