package `in`.soundless.companion.notification

enum class EventType {
    INCOMING_PAYMENT,
    OUTGOING_PAYMENT,
    PENDING_PAYMENT,
    FAILED_PAYMENT,
    BALANCE_UPDATE,
    REFUND_REVERSAL,
    AMBIGUOUS
}

enum class AnnouncementStatus {
    ANNOUNCED,
    SUPPRESSED_DUPLICATE,
    REJECTED_CATEGORY,
    DISABLED_SOURCE,
    FAILED_TTS
}

data class RawNotification(
    val packageName: String,
    val title: String,
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class ParsedNotificationData(
    val isPayment: Boolean,
    val eventType: EventType,
    val amount: Double?,
    val currency: String = "INR",
    val payerName: String? = null,
    val referenceId: String? = null,
    val confidence: Float = 0.0f,
    val notes: List<String> = emptyList()
)

data class SanitizedPaymentEvent(
    val eventId: String,
    val packageName: String,
    val appDisplayName: String,
    val eventType: EventType,
    val amount: Double,
    val currency: String,
    val payerName: String?,
    val referenceId: String?,
    val timestamp: Long,
    val fingerprint: String,
    val announcementStatus: AnnouncementStatus,
    val announcementText: String?,
    val rejectionReason: String? = null
)
