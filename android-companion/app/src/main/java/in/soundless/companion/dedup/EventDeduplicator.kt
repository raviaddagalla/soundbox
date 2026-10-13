package `in`.soundless.companion.dedup

import `in`.soundless.companion.notification.ParsedNotificationData
import `in`.soundless.companion.notification.RawNotification
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.abs

data class Fingerprint(
    val hash: String,
    val hasRefId: Boolean,
    val amount: Double,
    val refId: String?,
    val payerName: String?,
    val packageName: String
)

data class DedupCheckResult(
    val isDuplicate: Boolean,
    val reason: String? = null
)

class EventDeduplicator(private val windowSeconds: Long = 120) {

    private data class CachedEntry(
        val fingerprint: String,
        val timestamp: Long,
        val payerName: String?
    )

    private val cache = ConcurrentHashMap<String, CachedEntry>()

    fun generateFingerprint(raw: RawNotification, parsed: ParsedNotificationData): Fingerprint {
        val amount = parsed.amount ?: 0.0
        val refId = parsed.referenceId?.trim()
        val payer = parsed.payerName?.lowercase()?.trim()

        val rawSignature = if (!refId.isNullOrBlank() && refId.length >= 6) {
            "${raw.packageName}:$amount:ref:$refId"
        } else {
            "${raw.packageName}:$amount:payer:${payer ?: "none"}:${raw.title}"
        }

        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(rawSignature.toByteArray())
        val hashStr = hashBytes.joinToString("") { "%02x".format(it) }

        return Fingerprint(
            hash = hashStr,
            hasRefId = !refId.isNullOrBlank() && refId.length >= 6,
            amount = amount,
            refId = refId,
            payerName = parsed.payerName,
            packageName = raw.packageName
        )
    }

    fun checkDuplicate(fp: Fingerprint, timestamp: Long): DedupCheckResult {
        val windowMs = windowSeconds * 1000

        // Clean stale entries older than 3x the window
        val threshold = timestamp - (windowMs * 3)
        cache.entries.removeIf { it.value.timestamp < threshold }

        val existing = cache[fp.hash]
        if (existing != null) {
            val delta = abs(timestamp - existing.timestamp)
            if (delta <= windowMs) {
                return DedupCheckResult(
                    isDuplicate = true,
                    reason = "Duplicate notification fingerprint match within ${delta / 1000}s"
                )
            }
        }

        return DedupCheckResult(isDuplicate = false)
    }

    fun record(fp: Fingerprint, timestamp: Long) {
        cache[fp.hash] = CachedEntry(fp.hash, timestamp, fp.payerName)
    }

    fun clear() {
        cache.clear()
    }
}
