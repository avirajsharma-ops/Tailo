package sbs.zenova.twa.services

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import sbs.zenova.twa.MainActivity
import sbs.zenova.twa.R
import sbs.zenova.twa.TalioApplication

/**
 * Firebase Cloud Messaging Service
 * Handles incoming push notifications from Firebase
 */
class TalioFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "TalioFCM"
    }

    /**
     * Called when a new FCM token is generated
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        
        // Send token to server
        sendTokenToServer(token)
    }

    /**
     * Called when a message is received
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "Message received from: ${remoteMessage.from}")

        // Check if message contains a notification payload
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Notification Title: ${notification.title}")
            Log.d(TAG, "Notification Body: ${notification.body}")
            
            showNotification(
                title = notification.title ?: "Talio HRMS",
                message = notification.body ?: "",
                data = remoteMessage.data
            )
        }

        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            
            // If no notification payload, create one from data
            if (remoteMessage.notification == null) {
                showNotification(
                    title = remoteMessage.data["title"] ?: "Talio HRMS",
                    message = remoteMessage.data["body"] ?: remoteMessage.data["message"] ?: "",
                    data = remoteMessage.data
                )
            }
        }
    }

    /**
     * Show notification to user
     */
    private fun showNotification(
        title: String,
        message: String,
        data: Map<String, String>
    ) {
        val notificationType = data["type"] ?: "general"
        val url = data["url"] ?: "https://zenova.sbs/dashboard"
        
        // Determine notification channel based on type
        val channelId = when (notificationType) {
            "message" -> TalioApplication.CHANNEL_ID_MESSAGES
            "task_assigned", "task_status_update", "task_completed" -> TalioApplication.CHANNEL_ID_TASKS
            "announcement" -> TalioApplication.CHANNEL_ID_ANNOUNCEMENTS
            else -> TalioApplication.CHANNEL_ID_GENERAL
        }

        // Create intent to open app
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("url", url)
            putExtra("notification_type", notificationType)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        // Get notification icon
        val icon = when (notificationType) {
            "message" -> android.R.drawable.ic_dialog_email
            "task_assigned", "task_status_update", "task_completed" -> android.R.drawable.ic_menu_agenda
            "announcement" -> android.R.drawable.ic_dialog_info
            else -> R.mipmap.ic_launcher
        }

        // Build notification
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(icon)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))

        // Show notification
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
        
        Log.d(TAG, "Notification shown: $title")
    }

    /**
     * Send FCM token to server
     */
    private fun sendTokenToServer(token: String) {
        // Store token locally
        val sharedPreferences = getSharedPreferences("talio_prefs", Context.MODE_PRIVATE)
        sharedPreferences.edit().putString("fcm_token", token).apply()
        
        Log.d(TAG, "FCM token stored locally: $token")
        
        // The WebView will handle sending the token to the server when user logs in
        // This is because we need the auth token to make the API call
    }
}

