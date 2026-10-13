package in.soundless.companion.classifier

import in.soundless.companion.notification.EventType
import in.soundless.companion.notification.ParsedNotificationData

data class ClassificationDecision(
    val isEligible: Boolean,
    val eventType: EventType,
    val reason: String,
    val isTrustSafetyRejected: Boolean
)

object PaymentClassifier {

    fun evaluate(parsed: ParsedNotificationData, isAllowedPackage: Boolean): ClassificationDecision {
        if (!isAllowedPackage) {
            return ClassificationDecision(
                isEligible = false,
                eventType = EventType.AMBIGUOUS,
                reason = "Package is not on the merchant allowlist",
                isTrustSafetyRejected = true
            )
        }

        if (!parsed.isPayment || parsed.eventType == EventType.AMBIGUOUS) {
            return ClassificationDecision(
                isEligible = false,
                eventType = EventType.AMBIGUOUS,
                reason = "Non-payment or promotional alert",
                isTrustSafetyRejected = true
            )
        }

        // CRITICAL TRUST & SAFETY: Outgoing debit MUST NEVER be announced as received
        if (parsed.eventType == EventType.OUTGOING_PAYMENT) {
            return ClassificationDecision(
                isEligible = false,
                eventType = EventType.OUTGOING_PAYMENT,
                reason = "Debit alert. Money sent by user must never be announced as received.",
                isTrustSafetyRejected = true
            )
        }

        if (parsed.eventType == EventType.FAILED_PAYMENT) {
            return ClassificationDecision(
                isEligible = false,
                eventType = EventType.FAILED_PAYMENT,
                reason = "Failed payment notification. Must not announce.",
                isTrustSafetyRejected = true
            )
        }

        if (parsed.eventType == EventType.PENDING_PAYMENT) {
            return ClassificationDecision(
                isEligible = false,
                eventType = EventType.PENDING_PAYMENT,
                reason = "Pending payment notification awaiting bank settlement.",
                isTrustSafetyRejected = true
            )
        }

        if (parsed.eventType == EventType.BALANCE_UPDATE) {
            return ClassificationDecision(
                isEligible = false,
                eventType = EventType.BALANCE_UPDATE,
                reason = "Balance update notice.",
                isTrustSafetyRejected = false
            )
        }

        if (parsed.eventType == EventType.REFUND_REVERSAL) {
            return ClassificationDecision(
                isEligible = (parsed.amount != null && parsed.amount > 0),
                eventType = EventType.REFUND_REVERSAL,
                reason = "Refund / reversal received: ₹${parsed.amount}",
                isTrustSafetyRejected = false
            )
        }

        if (parsed.eventType == EventType.INCOMING_PAYMENT) {
            if (parsed.amount == null || parsed.amount <= 0) {
                return ClassificationDecision(
                    isEligible = false,
                    eventType = EventType.AMBIGUOUS,
                    reason = "Incoming notification missing positive numeric amount",
                    isTrustSafetyRejected = true
                )
            }

            return ClassificationDecision(
                isEligible = true,
                eventType = EventType.INCOMING_PAYMENT,
                reason = "Eligible incoming payment of ₹${parsed.amount}",
                isTrustSafetyRejected = false
            )
        }

        return ClassificationDecision(
            isEligible = false,
            eventType = EventType.AMBIGUOUS,
            reason = "Unknown classification",
            isTrustSafetyRejected = true
        )
    }
}
