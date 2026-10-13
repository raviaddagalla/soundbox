package in.soundless.companion

import in.soundless.companion.classifier.PaymentClassifier
import in.soundless.companion.dedup.EventDeduplicator
import in.soundless.companion.notification.EventType
import in.soundless.companion.notification.RawNotification
import in.soundless.companion.parser.AmountExtractor
import in.soundless.companion.parser.GooglePayParser
import in.soundless.companion.parser.PhonePeParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ParserTest {

    @Test
    fun testAmountExtraction() {
        assertEquals(1.0, AmountExtractor.extractAmount("Received ₹1 from Test User")!!, 0.001)
        assertEquals(25.50, AmountExtractor.extractAmount("Received ₹25.50 from Priya Sharma")!!, 0.001)
        assertEquals(1000.0, AmountExtractor.extractAmount("Payment of ₹1,000 received successfully")!!, 0.001)
        assertEquals(10000.0, AmountExtractor.extractAmount("You received ₹10,000 from Rajesh via UPI")!!, 0.001)
    }

    @Test
    fun testPhonePeIncoming() {
        val parser = PhonePeParser()
        val raw = RawNotification(
            packageName = "com.phonepe.app",
            title = "Payment Received",
            text = "₹500 received from Suresh (UTR: 328910482910)"
        )
        val parsed = parser.parse(raw)
        assertEquals(EventType.INCOMING_PAYMENT, parsed.eventType)
        assertEquals(500.0, parsed.amount!!, 0.001)
        assertEquals("328910482910", parsed.referenceId)

        val decision = PaymentClassifier.evaluate(parsed, true)
        assertTrue(decision.isEligible)
    }

    @Test
    fun testPhonePeOutgoingDebitRejected() {
        val parser = PhonePeParser()
        val raw = RawNotification(
            packageName = "com.phonepe.app",
            title = "Payment Successful",
            text = "You paid ₹500 to Ramesh Kirana from State Bank account"
        )
        val parsed = parser.parse(raw)
        assertEquals(EventType.OUTGOING_PAYMENT, parsed.eventType)

        // Must NEVER announce money sent as money received
        val decision = PaymentClassifier.evaluate(parsed, true)
        assertFalse(decision.isEligible)
        assertTrue(decision.isTrustSafetyRejected)
    }

    @Test
    fun testGooglePayFailedPaymentRejected() {
        val parser = GooglePayParser()
        val raw = RawNotification(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Google Pay",
            text = "Payment of ₹250.00 failed. Bank server timed out."
        )
        val parsed = parser.parse(raw)
        assertEquals(EventType.FAILED_PAYMENT, parsed.eventType)

        val decision = PaymentClassifier.evaluate(parsed, true)
        assertFalse(decision.isEligible)
    }

    @Test
    fun testDeduplicationEngine() {
        val dedup = EventDeduplicator(windowSeconds = 120)
        val parser = PhonePeParser()

        val raw1 = RawNotification(
            packageName = "com.phonepe.app",
            title = "Payment Received",
            text = "₹50 received from Suresh (UTR: 328910482910)",
            timestamp = 1000000L
        )
        val parsed1 = parser.parse(raw1)
        val fp1 = dedup.generateFingerprint(raw1, parsed1)

        val check1 = dedup.checkDuplicate(fp1, 1000000L)
        assertFalse(check1.isDuplicate)
        dedup.record(fp1, 1000000L)

        // Exact same notification 15s later
        val check2 = dedup.checkDuplicate(fp1, 1000000L + 15000L)
        assertTrue(check2.isDuplicate)
    }
}
