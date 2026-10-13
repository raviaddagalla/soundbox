package `in`.soundless.companion

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat
import androidx.webkit.WebViewAssetLoader
import com.google.gson.Gson
import `in`.soundless.companion.notification.EventType

class MainActivity : AppCompatActivity() {

    private val TAG = "MainActivity"
    private lateinit var webView: WebView
    private lateinit var bannerPermission: LinearLayout
    private lateinit var btnEnablePermission: Button
    private val gson = Gson()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        bannerPermission = findViewById(R.id.bannerPermission)
        btnEnablePermission = findViewById(R.id.btnEnablePermission)

        btnEnablePermission.setOnClickListener {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            startActivity(intent)
        }

        // Configure modern WebView for local HTML/JS/CSS app
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        // Use modern Google WebViewAssetLoader to serve Vite web app from assets securely
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d(TAG, "WebView page finished loading: $url")
                syncStateToWebView()
            }
        }

        // Expose native companion bridge to window.AndroidBridge in JavaScript
        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")

        // Load the bundled Stitch Web Application
        webView.loadUrl("https://appassets.androidplatform.net/index.html")

        // Intercept back button for web navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Forward real-time payment notifications to the WebView
        val app = application as SoundlessApp
        app.eventListeners.add { event ->
            val json = gson.toJson(event)
            Log.i(TAG, "Forwarding live payment event to WebView: ${event.amount} from ${event.appDisplayName}")
            webView.post {
                webView.evaluateJavascript(
                    "if (typeof window.onAndroidPaymentEvent === 'function') { window.onAndroidPaymentEvent($json); }",
                    null
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionBanner()
        syncStateToWebView()
    }

    private fun syncStateToWebView() {
        val isGranted = isNotificationServiceEnabled()
        val app = application as SoundlessApp
        val recentEventsJson = gson.toJson(app.recentEvents)

        webView.post {
            webView.evaluateJavascript(
                "if (typeof window.onNotificationPermissionUpdate === 'function') { window.onNotificationPermissionUpdate($isGranted); }",
                null
            )
            webView.evaluateJavascript(
                "if (typeof window.onAndroidRecentEvents === 'function') { window.onAndroidRecentEvents($recentEventsJson); }",
                null
            )
        }
    }

    fun isNotificationServiceEnabled(): Boolean {
        val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(this)
        return enabledPackages.contains(packageName)
    }

    private fun updatePermissionBanner() {
        val granted = isNotificationServiceEnabled()
        bannerPermission.visibility = if (granted) View.GONE else View.VISIBLE
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun isNotificationAccessGranted(): Boolean {
            return isNotificationServiceEnabled()
        }

        @JavascriptInterface
        fun openNotificationSettings() {
            runOnUiThread {
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                startActivity(intent)
            }
        }

        @JavascriptInterface
        fun speakText(text: String, language: String?) {
            runOnUiThread {
                val app = application as SoundlessApp
                app.ttsManager.announce(0.0, EventType.INCOMING_PAYMENT, text)
            }
        }

        @JavascriptInterface
        fun playTestAnnouncement(amount: Double) {
            runOnUiThread {
                val app = application as SoundlessApp
                app.ttsManager.announce(amount, EventType.INCOMING_PAYMENT)
            }
        }

        @JavascriptInterface
        fun getRecentEvents(): String {
            val app = application as SoundlessApp
            return gson.toJson(app.recentEvents)
        }

        @JavascriptInterface
        fun notifyWebReady() {
            runOnUiThread {
                syncStateToWebView()
            }
        }

        @JavascriptInterface
        fun isNativeCompanion(): Boolean = true

        @JavascriptInterface
        fun getBridgePort(): Int = 8765

        @JavascriptInterface
        fun getAppVersion(): String = "1.0.0"
    }
}
