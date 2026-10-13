package `in`.soundless.companion.notification

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import `in`.soundless.companion.SoundlessApp
import `in`.soundless.companion.classifier.PaymentClassifier
import `in`.soundless.companion.parser.ParserRegistry
import java.util.UUID

class SoundlessNotificationListenerService : NotificationListenerService() {

    private val TAG = "NotificationListener"

    private val ALLOWED_PACKAGES = setOf(
        "com.phonepe.app",
        "com.google.android.apps.nbu.paisa.user",
        "net.one97.paytm",
        "in.org.npci.upiapp",
        "com.amazon.mShop.android.shopping",
        "in.soundless.mock"
    )

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "Soundless NotificationListener connected and active")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val pkg = sbn.packageName
        // Filter against explicit package allowlist
        if (!ALLOWED_PACKAGES.contains(pkg)) {
            return
        }

        val extras = sbn.notification.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()

        val fullText = if (!bigText.isNullOrBlank()) "$text $bigText" else text
        val raw = RawNotification(
            packageName = pkg,
            title = title,
            text = fullText,
            timestamp = sbn.postTime
        )

        Log.d(TAG, "Ingested alert from $pkg: $title - $text")

        // 1. Parse
        val parser = ParserRegistry.getParser(pkg)
        val parsed = parser.parse(raw)

        // 2. Classify (Enforce Trust & Safety)
        val decision = PaymentClassifier.evaluate(parsed, isAllowedPackage = true)

        val app = application as? SoundlessApp
        val dedup = app?.deduplicator

        // 3. Deduplication Check
        val fp = dedup?.generateFingerprint(raw, parsed)
        val isDuplicate = if (fp != null) {
            val dedupResult = dedup.checkDuplicate(fp, raw.timestamp)
            dedupResult.isDuplicate
        } else false

        val eventId = "evt_${UUID.randomUUID()}"
        val announcementStatus = when {
            !decision.isEligible -> AnnouncementStatus.REJECTED_CATEGORY
            isDuplicate -> AnnouncementStatus.SUPPRESSED_DUPLICATE
            else -> AnnouncementStatus.ANNOUNCED
        }

        val sanitizedEvent = SanitizedPaymentEvent(
            eventId = eventId,
            packageName = pkg,
            appDisplayName = parser.appDisplayName,
            eventType = decision.eventType,
            amount = parsed.amount ?: 0.0,
            currency = parsed.currency,
            payerName = parsed.payerName,
            referenceId = parsed.referenceId,
            timestamp = raw.timestamp,
            fingerprint = fp?.hash ?: "fp_unknown",
            announcementStatus = announcementStatus,
            announcementText = if (announcementStatus == AnnouncementStatus.ANNOUNCED) {
                "${parsed.amount?.toInt() ?: 0} rupees received"
            } else null,
            rejectionReason = decision.reason
        )

        // 4. Announce Aloud via TTS if Eligible
        if (announcementStatus == AnnouncementStatus.ANNOUNCED && parsed.amount != null) {
            if (fp != null) {
                dedup.record(fp, raw.timestamp)
            }
            app?.ttsManager?.announce(parsed.amount, decision.eventType)
        }

        // 5. Broadcast to Connected Web Dashboard
        app?.bridgeServer?.broadcastEvent(sanitizedEvent)
        app?.addRecentEvent(sanitizedEvent)
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "Soundless NotificationListener disconnected")
    }
}
