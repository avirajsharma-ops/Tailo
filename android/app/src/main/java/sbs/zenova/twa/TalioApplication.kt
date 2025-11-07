package sbs.zenova.twa

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

class TalioApplication : Application() {

    companion object {
        const val TAG = "TalioApp"
        const val CHANNEL_ID_MESSAGES = "talio_messages"
        const val CHANNEL_ID_TASKS = "talio_tasks"
        const val CHANNEL_ID_ANNOUNCEMENTS = "talio_announcements"
        const val CHANNEL_ID_GENERAL = "talio_general"
    }

    override fun onCreate() {
        super.onCreate()

        // Initialize Firebase
        FirebaseApp.initializeApp(this)
        Log.d(TAG, "Firebase initialized")

        // Create notification channels
        createNotificationChannels()

        // Get FCM token
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }

            // Get new FCM registration token
            val token = task.result
            Log.d(TAG, "FCM Token: $token")

            // TODO: Send token to your server
            // This will be handled by the WebView when user logs in
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Messages Channel
            val messagesChannel = NotificationChannel(
                CHANNEL_ID_MESSAGES,
                "Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "New message notifications"
                enableVibration(true)
                enableLights(true)
            }

            // Tasks Channel
            val tasksChannel = NotificationChannel(
                CHANNEL_ID_TASKS,
                "Tasks",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Task assignment and update notifications"
                enableVibration(true)
                enableLights(true)
            }

            // Announcements Channel
            val announcementsChannel = NotificationChannel(
                CHANNEL_ID_ANNOUNCEMENTS,
                "Announcements",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Company announcements"
            }

            // General Channel
            val generalChannel = NotificationChannel(
                CHANNEL_ID_GENERAL,
                "General",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General notifications"
            }

            notificationManager.createNotificationChannel(messagesChannel)
            notificationManager.createNotificationChannel(tasksChannel)
            notificationManager.createNotificationChannel(announcementsChannel)
            notificationManager.createNotificationChannel(generalChannel)

            Log.d(TAG, "Notification channels created")
        }
    }
}

