package `in`.soundless.companion

import android.app.Application
import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import `in`.soundless.companion.announcement.SoundboxTtsManager
import `in`.soundless.companion.bridge.CompanionLocalServer
import `in`.soundless.companion.dedup.EventDeduplicator
import `in`.soundless.companion.notification.SanitizedPaymentEvent
import java.util.concurrent.CopyOnWriteArrayList

class SoundlessApp : Application() {

    private val TAG = "SoundlessApp"
    private val PREFS_NAME = "soundless_companion_prefs"
    private val KEY_RECENT_EVENTS = "saved_recent_events"
    private val gson = Gson()

    lateinit var ttsManager: SoundboxTtsManager
        private set

    lateinit var deduplicator: EventDeduplicator
        private set

    lateinit var bridgeServer: CompanionLocalServer
        private set

    val recentEvents = CopyOnWriteArrayList<SanitizedPaymentEvent>()
    val eventListeners = CopyOnWriteArrayList<(SanitizedPaymentEvent) -> Unit>()

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Initializing Soundless Companion Application")

        loadSavedEvents()

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

    private fun loadSavedEvents() {
        try {
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(KEY_RECENT_EVENTS, null)
            if (!json.isNullOrBlank()) {
                val type = object : TypeToken<List<SanitizedPaymentEvent>>() {}.type
                val saved: List<SanitizedPaymentEvent> = gson.fromJson(json, type)
                recentEvents.addAll(saved)
                Log.i(TAG, "Restored ${recentEvents.size} payment events from persistent storage")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not restore saved events: ${e.message}")
        }
    }

    private fun persistEvents() {
        try {
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = gson.toJson(recentEvents.toList())
            prefs.edit().putString(KEY_RECENT_EVENTS, json).apply()
        } catch (e: Exception) {
            Log.w(TAG, "Could not save events to prefs: ${e.message}")
        }
    }

    fun addRecentEvent(event: SanitizedPaymentEvent) {
        recentEvents.add(0, event)
        if (recentEvents.size > 50) {
            recentEvents.removeAt(recentEvents.size - 1)
        }
        persistEvents()
        eventListeners.forEach { listener ->
            try {
                listener(event)
            } catch (e: Exception) {
                Log.w(TAG, "Listener error: ${e.message}")
            }
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
