package in.soundless.companion.parser

import in.soundless.companion.notification.EventType
import in.soundless.companion.notification.ParsedNotificationData
import in.soundless.companion.notification.RawNotification

interface AppParser {
    val supportedPackages: List<String>
    val appDisplayName: String
    fun canHandle(packageName: String): Boolean = supportedPackages.contains(packageName)
    fun parse(notification: RawNotification): ParsedNotificationData
}

class PhonePeParser : AppParser {
    override val supportedPackages = listOf("com.phonepe.app")
    override val appDisplayName = "PhonePe"

    override fun parse(notification: RawNotification): ParsedNotificationData {
        val combined = "${notification.title} ${notification.text}".trim()
        val lower = combined.lowercase()

        // 1. Outgoing / Debited
        if (lower.contains("you paid") || lower.contains("paid to") || lower.contains("debited from") || lower.contains("sent to")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.OUTGOING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                referenceId = AmountExtractor.extractReferenceId(combined),
                confidence = 0.95f
            )
        }

        // 2. Failed
        if (lower.contains("payment failed") || lower.contains("transaction failed") || lower.contains("declined")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.FAILED_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.98f
            )
        }

        // 3. Pending
        if (lower.contains("pending") || lower.contains("processing") || lower.contains("payment initiated")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.PENDING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.92f
            )
        }

        // 4. Refund
        if (lower.contains("refund received") || lower.contains("refund of")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.REFUND_REVERSAL,
                amount = AmountExtractor.extractAmount(combined),
                referenceId = AmountExtractor.extractReferenceId(combined),
                confidence = 0.95f
            )
        }

        // 5. Promotional / Coupons
        if (lower.contains("scratch card") || lower.contains("cashback coupon") || lower.contains("win up to")) {
            return ParsedNotificationData(
                isPayment = false,
                eventType = EventType.AMBIGUOUS,
                amount = null,
                confidence = 0.99f
            )
        }

        // 6. Incoming Payment
        if (lower.contains("received") || lower.contains("credited") || lower.contains("payment received")) {
            val amt = AmountExtractor.extractAmount(combined)
            if (amt != null && amt > 0) {
                return ParsedNotificationData(
                    isPayment = true,
                    eventType = EventType.INCOMING_PAYMENT,
                    amount = amt,
                    payerName = AmountExtractor.extractPayerName(combined),
                    referenceId = AmountExtractor.extractReferenceId(combined),
                    confidence = 0.95f
                )
            }
        }

        return ParsedNotificationData(
            isPayment = false,
            eventType = EventType.AMBIGUOUS,
            amount = null,
            confidence = 0.4f
        )
    }
}

class GooglePayParser : AppParser {
    override val supportedPackages = listOf("com.google.android.apps.nbu.paisa.user")
    override val appDisplayName = "Google Pay"

    override fun parse(notification: RawNotification): ParsedNotificationData {
        val combined = "${notification.title} ${notification.text}".trim()
        val lower = combined.lowercase()

        if (lower.contains("you paid") || lower.contains("paid to") || lower.contains("using your")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.OUTGOING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.95f
            )
        }

        if (lower.contains("payment failed") || lower.contains("could not be completed")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.FAILED_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.98f
            )
        }

        if (lower.contains("processing") || lower.contains("payment pending")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.PENDING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.92f
            )
        }

        if (lower.contains("refund received") || lower.contains("refund from")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.REFUND_REVERSAL,
                amount = AmountExtractor.extractAmount(combined),
                referenceId = AmountExtractor.extractReferenceId(combined),
                confidence = 0.95f
            )
        }

        if (lower.contains("received") || lower.contains("credited")) {
            val amt = AmountExtractor.extractAmount(combined)
            if (amt != null && amt > 0) {
                return ParsedNotificationData(
                    isPayment = true,
                    eventType = EventType.INCOMING_PAYMENT,
                    amount = amt,
                    payerName = AmountExtractor.extractPayerName(combined),
                    referenceId = AmountExtractor.extractReferenceId(combined),
                    confidence = 0.96f
                )
            }
        }

        return ParsedNotificationData(isPayment = false, eventType = EventType.AMBIGUOUS, amount = null)
    }
}

class PaytmParser : AppParser {
    override val supportedPackages = listOf("net.one97.paytm")
    override val appDisplayName = "Paytm"

    override fun parse(notification: RawNotification): ParsedNotificationData {
        val combined = "${notification.title} ${notification.text}".trim()
        val lower = combined.lowercase()

        if (lower.contains("sent to") || lower.contains("money sent") || lower.contains("you paid")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.OUTGOING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.95f
            )
        }

        if (lower.contains("failed") || lower.contains("could not be processed")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.FAILED_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.98f
            )
        }

        if (lower.contains("balance is low") || lower.contains("wallet balance is")) {
            return ParsedNotificationData(
                isPayment = false,
                eventType = EventType.BALANCE_UPDATE,
                amount = null,
                confidence = 0.95f
            )
        }

        if (lower.contains("received") || lower.contains("credited") || lower.contains("money received")) {
            val amt = AmountExtractor.extractAmount(combined)
            if (amt != null && amt > 0) {
                return ParsedNotificationData(
                    isPayment = true,
                    eventType = EventType.INCOMING_PAYMENT,
                    amount = amt,
                    payerName = AmountExtractor.extractPayerName(combined),
                    referenceId = AmountExtractor.extractReferenceId(combined),
                    confidence = 0.95f
                )
            }
        }

        return ParsedNotificationData(isPayment = false, eventType = EventType.AMBIGUOUS, amount = null)
    }
}

class BhimParser : AppParser {
    override val supportedPackages = listOf("in.org.npci.upiapp")
    override val appDisplayName = "BHIM UPI"

    override fun parse(notification: RawNotification): ParsedNotificationData {
        val combined = "${notification.title} ${notification.text}".trim()
        val lower = combined.lowercase()

        if (lower.contains("debited") || lower.contains("sent")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.OUTGOING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.96f
            )
        }

        if (lower.contains("failed") || lower.contains("declined")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.FAILED_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.98f
            )
        }

        if (lower.contains("credited") || lower.contains("received")) {
            val amt = AmountExtractor.extractAmount(combined)
            if (amt != null && amt > 0) {
                return ParsedNotificationData(
                    isPayment = true,
                    eventType = EventType.INCOMING_PAYMENT,
                    amount = amt,
                    referenceId = AmountExtractor.extractReferenceId(combined),
                    confidence = 0.97f
                )
            }
        }

        return ParsedNotificationData(isPayment = false, eventType = EventType.AMBIGUOUS, amount = null)
    }
}

class GenericUpiParser : AppParser {
    override val supportedPackages = listOf("default", "in.soundless.mock")
    override val appDisplayName = "UPI Alert"

    override fun canHandle(packageName: String): Boolean = true

    override fun parse(notification: RawNotification): ParsedNotificationData {
        val combined = "${notification.title} ${notification.text}".trim()
        val lower = combined.lowercase()

        if (lower.contains("debited") || lower.contains("you paid") || lower.contains("sent to")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.OUTGOING_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.9f
            )
        }

        if (lower.contains("failed") || lower.contains("declined")) {
            return ParsedNotificationData(
                isPayment = true,
                eventType = EventType.FAILED_PAYMENT,
                amount = AmountExtractor.extractAmount(combined),
                confidence = 0.95f
            )
        }

        if (lower.contains("credited") || lower.contains("received")) {
            val amt = AmountExtractor.extractAmount(combined)
            if (amt != null && amt > 0) {
                return ParsedNotificationData(
                    isPayment = true,
                    eventType = EventType.INCOMING_PAYMENT,
                    amount = amt,
                    payerName = AmountExtractor.extractPayerName(combined),
                    referenceId = AmountExtractor.extractReferenceId(combined),
                    confidence = 0.9f
                )
            }
        }

        return ParsedNotificationData(isPayment = false, eventType = EventType.AMBIGUOUS, amount = null)
    }
}

object ParserRegistry {
    private val parsers: List<AppParser> = listOf(
        PhonePeParser(),
        GooglePayParser(),
        PaytmParser(),
        BhimParser(),
        GenericUpiParser()
    )

    fun getParser(packageName: String): AppParser {
        return parsers.firstOrNull { it.canHandle(packageName) } ?: parsers.last()
    }
}
