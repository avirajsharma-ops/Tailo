package sbs.zenova.twa

import android.app.Application
import com.onesignal.OneSignal
import com.onesignal.debug.LogLevel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class TalioApplication : Application() {

    companion object {
        const val ONESIGNAL_APP_ID = "f7b9d1a1-5095-4be8-8a74-2af13058e7b2"
    }

    override fun onCreate() {
        super.onCreate()

        // Enable verbose OneSignal logging to debug issues
        OneSignal.Debug.logLevel = LogLevel.VERBOSE

        // Initialize OneSignal
        OneSignal.initWithContext(this, ONESIGNAL_APP_ID)

        // Request notification permission in a coroutine
        CoroutineScope(Dispatchers.Main).launch {
            OneSignal.Notifications.requestPermission(true)
        }
    }
}

