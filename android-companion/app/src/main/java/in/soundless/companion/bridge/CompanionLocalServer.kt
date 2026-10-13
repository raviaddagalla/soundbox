package `in`.soundless.companion.bridge

import android.os.Build
import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import `in`.soundless.companion.notification.SanitizedPaymentEvent
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.net.InetSocketAddress

class CompanionLocalServer(port: Int = 8765) : WebSocketServer(InetSocketAddress(port)) {

    private val TAG = "CompanionBridge"
    private val expectedAuthToken = "snd_sec_key_7894"
    private val gson = Gson()

    override fun onStart() {
        Log.i(TAG, "Companion WebSocket bridge server started on port ${address.port}")
    }

    override fun onOpen(conn: WebSocket?, handshake: ClientHandshake?) {
        Log.i(TAG, "Web Dashboard connected from ${conn?.remoteSocketAddress}")
    }

    override fun onClose(conn: WebSocket?, code: Int, reason: String?, remote: Boolean) {
        Log.i(TAG, "Web Dashboard disconnected")
    }

    override fun onMessage(conn: WebSocket?, message: String?) {
        if (message == null || conn == null) return

        try {
            val json = gson.fromJson(message, JsonObject::class.java)
            val token = json.get("authToken")?.asString
            val type = json.get("type")?.asString

            if (token != expectedAuthToken) {
                Log.w(TAG, "Rejected unauthorized frame from client")
                conn.close(4001, "Unauthorized pairing token")
                return
            }

            when (type) {
                "HANDSHAKE_INIT" -> {
                    val ack = JsonObject().apply {
                        addProperty("type", "HANDSHAKE_ACK")
                        addProperty("authToken", expectedAuthToken)
                        addProperty("timestamp", System.currentTimeMillis())
                    }
                    conn.send(gson.toJson(ack))

                    // Broadcast device status
                    sendDeviceStatus(conn)
                }

                "HEARTBEAT_PING" -> {
                    val pong = JsonObject().apply {
                        addProperty("type", "HEARTBEAT_PONG")
                        addProperty("authToken", expectedAuthToken)
                        addProperty("timestamp", System.currentTimeMillis())
                    }
                    conn.send(gson.toJson(pong))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing incoming websocket frame: ${e.message}")
        }
    }

    override fun onError(conn: WebSocket?, ex: Exception?) {
        Log.e(TAG, "WebSocket bridge error: ${ex?.message}")
    }

    fun broadcastEvent(event: SanitizedPaymentEvent) {
        val payload = JsonObject().apply {
            addProperty("type", "NOTIFICATION_EVENT")
            addProperty("authToken", expectedAuthToken)
            add("payload", gson.toJsonTree(event))
            addProperty("timestamp", System.currentTimeMillis())
        }
        val message = gson.toJson(payload)
        broadcast(message)
    }

    private fun sendDeviceStatus(conn: WebSocket) {
        val status = JsonObject().apply {
            addProperty("type", "DEVICE_STATUS")
            addProperty("authToken", expectedAuthToken)
            val devInfo = JsonObject().apply {
                addProperty("notificationAccessEnabled", true)
                addProperty("batteryOptimizationIgnored", true)
                addProperty("ttsEngineReady", true)
                addProperty("appVersion", "1.0.0")
                addProperty("androidVersion", Build.VERSION.RELEASE)
                addProperty("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL}")
            }
            add("payload", devInfo)
            addProperty("timestamp", System.currentTimeMillis())
        }
        conn.send(gson.toJson(status))
    }
}
