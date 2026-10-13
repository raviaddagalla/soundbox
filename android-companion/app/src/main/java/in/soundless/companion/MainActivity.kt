package in.soundless.companion

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat
import com.google.android.material.card.MaterialCardView
import in.soundless.companion.notification.EventType

class MainActivity : AppCompatActivity() {

    private lateinit var cardPermission: MaterialCardView
    private lateinit var textPermissionTitle: TextView
    private lateinit var textPermissionDesc: TextView
    private lateinit var btnGrantPermission: Button
    private lateinit var btnTestVoice: Button
    private lateinit var textEventLog: TextView
    private lateinit var textServiceStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        cardPermission = findViewById(R.id.cardPermission)
        textPermissionTitle = findViewById(R.id.textPermissionTitle)
        textPermissionDesc = findViewById(R.id.textPermissionDesc)
        btnGrantPermission = findViewById(R.id.btnGrantPermission)
        btnTestVoice = findViewById(R.id.btnTestVoice)
        textEventLog = findViewById(R.id.textEventLog)
        textServiceStatus = findViewById(R.id.textServiceStatus)

        btnGrantPermission.setOnClickListener {
            // Open Android system notification listener settings
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            startActivity(intent)
        }

        btnTestVoice.setOnClickListener {
            val app = application as SoundlessApp
            app.ttsManager.announce(25.0, EventType.INCOMING_PAYMENT, "Soundless UPI. Twenty-five rupees received.")
            appendLog("Test announcement triggered: ₹25.00")
        }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatus()
        renderRecentLogs()
    }

    private fun updatePermissionStatus() {
        val isGranted = isNotificationServiceEnabled()
        if (isGranted) {
            textPermissionTitle.text = getString(R.string.permission_granted)
            textPermissionDesc.text = "Soundless UPI is actively listening for incoming payment notifications."
            btnGrantPermission.visibility = View.GONE
            cardPermission.setCardBackgroundColor(getColor(R.color.white))
            cardPermission.strokeColor = getColor(R.color.teal_confirm)
            textServiceStatus.text = "Listening"
            textServiceStatus.setBackgroundColor(0xFFD1FAE5.toInt()) // light emerald
            textServiceStatus.setTextColor(0xFF065F46.toInt())
        } else {
            textPermissionTitle.text = getString(R.string.permission_required)
            textPermissionDesc.text = getString(R.string.permission_desc)
            btnGrantPermission.visibility = View.VISIBLE
            cardPermission.setCardBackgroundColor(0xFFFFFBEB.toInt()) // amber
            cardPermission.strokeColor = 0xFFFCD34D.toInt()
            textServiceStatus.text = "Permission Needed"
            textServiceStatus.setBackgroundColor(0xFFFEF3C7.toInt())
            textServiceStatus.setTextColor(0xFF92400E.toInt())
        }
    }

    private fun isNotificationServiceEnabled(): Boolean {
        val pkgName = packageName
        val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(this)
        return enabledPackages.contains(pkgName)
    }

    private fun renderRecentLogs() {
        val app = application as SoundlessApp
        val events = app.recentEvents
        if (events.isEmpty()) {
            textEventLog.text = "Soundless Companion active.\nWaiting for incoming UPI payments..."
        } else {
            val sb = StringBuilder()
            for (evt in events) {
                sb.append("[${evt.appDisplayName}] ${evt.eventType} - ₹${evt.amount} -> ${evt.announcementStatus}\n")
            }
            textEventLog.text = sb.toString()
        }
    }

    private fun appendLog(msg: String) {
        val current = textEventLog.text.toString()
        textEventLog.text = "$msg\n$current"
    }
}
