package in.soundless.companion

import android.app.Application
import android.util.Log
import in.soundless.companion.announcement.SoundboxTtsManager
import in.soundless.companion.bridge.CompanionLocalServer
import in.soundless.companion.dedup.EventDeduplicator
import in.soundless.companion.notification.SanitizedPaymentEvent
import java.util.concurrent.CopyOnWriteArrayList

class SoundlessApp : Application() {

    private val TAG = "SoundlessApp"

    lateinit var ttsManager: SoundboxTtsManager
        private set

    lateinit var deduplicator: EventDeduplicator
        private set

    lateinit var bridgeServer: CompanionLocalServer
        private set

    val recentEvents = CopyOnWriteArrayList<SanitizedPaymentEvent>()

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Initializing Soundless Companion Application")

        ttsManager = SoundboxTtsManager(this)
        deduplicator = EventDeduplicator(windowSeconds = 120)

        // Start embedded local WebSocket pairing server on 127.0.0.1:8765
        try {
            bridgeServer = CompanionLocalServer(8765)
            bridgeServer.start()
            Log.i(TAG, "Companion bridge server listening on 8765")
        } catch (e: Exception) {
            Log.e(TAG, "Could not start local bridge server: ${e.message}")
        }
    }

    fun addRecentEvent(event: SanitizedPaymentEvent) {
        recentEvents.add(0, event)
        if (recentEvents.size > 50) {
            recentEvents.removeAt(recentEvents.size - 1)
        }
    }

    override fun onTerminate() {
        super.onTerminate()
        ttsManager.shutdown()
        try {
            bridgeServer.stop()
        } catch (_: Exception) {}
    }
}
