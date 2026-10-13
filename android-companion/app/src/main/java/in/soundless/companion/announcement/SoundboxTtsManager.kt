package in.soundless.companion.announcement

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import in.soundless.companion.notification.EventType
import java.util.Locale
import java.util.concurrent.ConcurrentLinkedQueue

class SoundboxTtsManager(private val context: Context) : TextToSpeech.OnInitListener {

    private val TAG = "SoundboxTTS"
    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private val speechQueue = ConcurrentLinkedQueue<String>()
    private var isSpeaking = false

    private var selectedLocale = Locale("hi", "IN")
    private var speechRate = 1.0f

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(selectedLocale)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "Hindi not supported on device, falling back to English (India)")
                selectedLocale = Locale("en", "IN")
                tts?.setLanguage(selectedLocale)
            }
            tts?.setSpeechRate(speechRate)

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    isSpeaking = true
                }

                override fun onDone(utteranceId: String?) {
                    isSpeaking = false
                    processNextInQueue()
                }

                override fun onError(utteranceId: String?) {
                    isSpeaking = false
                    processNextInQueue()
                }
            })

            isInitialized = true
            Log.i(TAG, "Soundless TTS Engine initialized successfully")
        } else {
            Log.e(TAG, "Failed to initialize Android TextToSpeech engine")
        }
    }

    fun playSoundboxChime() {
        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 250)
        } catch (e: Exception) {
            Log.w(TAG, "Error generating chime tone: ${e.message}")
        }
    }

    fun announce(amount: Double, eventType: EventType, customText: String? = null) {
        val speechText = if (!customText.isNullOrBlank()) {
            customText
        } else if (eventType == EventType.REFUND_REVERSAL) {
            if (selectedLocale.language == "hi") {
                "${amount.toInt()} रुपये का रिफंड प्राप्त हुआ"
            } else {
                "Refund received, ${amount.toInt()} rupees"
            }
        } else {
            if (selectedLocale.language == "hi") {
                "${amount.toInt()} रुपये प्राप्त हुए"
            } else {
                "Payment received, ${amount.toInt()} rupees"
            }
        }

        speechQueue.offer(speechText)
        if (!isSpeaking) {
            processNextInQueue()
        }
    }

    private fun processNextInQueue() {
        val nextText = speechQueue.poll() ?: return
        if (!isInitialized || tts == null) {
            Log.w(TAG, "TTS not ready yet; skipping")
            return
        }

        playSoundboxChime()

        val params = Bundle()
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC)

        tts?.speak(nextText, TextToSpeech.QUEUE_ADD, params, "utt_${System.currentTimeMillis()}")
    }

    fun setLanguage(languageCode: String) {
        val loc = when (languageCode) {
            "hi-IN" -> Locale("hi", "IN")
            "te-IN" -> Locale("te", "IN")
            "ta-IN" -> Locale("ta", "IN")
            "kn-IN" -> Locale("kn", "IN")
            else -> Locale("en", "IN")
        }
        selectedLocale = loc
        tts?.setLanguage(loc)
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}
