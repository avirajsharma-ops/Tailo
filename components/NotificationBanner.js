'use client'

import { useState, useEffect } from 'react'
import { FaBell, FaTimes } from 'react-icons/fa'

/**
 * Persistent Notification Banner
 * Shows when notifications are disabled
 * Prompts user to enable notifications
 */
export default function NotificationBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        // Wait for OneSignal to be ready
        if (typeof window === 'undefined' || !window.OneSignal) {
          setTimeout(checkNotificationStatus, 1000)
          return
        }

        // Check notification permission
        const permission = await window.OneSignal.Notifications.permission

        // Show banner if notifications are not granted
        if (!permission) {
          setShow(true)
        } else {
          setShow(false)
        }

        // Check permission status every 5 seconds
        const interval = setInterval(async () => {
          const perm = await window.OneSignal.Notifications.permission
          if (!perm) {
            setShow(true)
          } else {
            setShow(false)
          }
        }, 5000)

        return () => clearInterval(interval)
      } catch (error) {
        console.error('[NotificationBanner] Error checking status:', error)
      }
    }

    checkNotificationStatus()
  }, [])

  const handleEnable = async () => {
    try {
      console.log('[NotificationBanner] Enable button clicked')

      if (typeof window === 'undefined' || !window.OneSignal) {
        console.error('[NotificationBanner] OneSignal not available')
        // Fallback to native browser prompt
        if ('Notification' in window) {
          const permission = await Notification.requestPermission()
          console.log('[NotificationBanner] Native permission result:', permission)
          if (permission === 'granted') {
            setShow(false)
          }
        }
        return
      }

      // Use OneSignal's requestPermission method (triggers native browser prompt)
      console.log('[NotificationBanner] Requesting permission via OneSignal...')
      const granted = await window.OneSignal.Notifications.requestPermission()
      console.log('[NotificationBanner] Permission granted:', granted)

      if (granted) {
        // Subscribe to push notifications
        console.log('[NotificationBanner] Subscribing to push...')
        await window.OneSignal.User.PushSubscription.optIn()
        setShow(false)
      }
    } catch (error) {
      console.error('[NotificationBanner] Error enabling notifications:', error)

      // Fallback to native browser prompt
      try {
        if ('Notification' in window) {
          console.log('[NotificationBanner] Using fallback native prompt...')
          const permission = await Notification.requestPermission()
          console.log('[NotificationBanner] Fallback permission result:', permission)
          if (permission === 'granted') {
            setShow(false)
          }
        }
      } catch (fallbackError) {
        console.error('[NotificationBanner] Fallback failed:', fallbackError)
      }
    }
  }

  if (!show) {
    return null
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-[55] px-4 md:px-6 animate-slideDown">
      <div
        className="max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%)'
        }}
      >
        <div className="flex items-center justify-between p-4 gap-4">
          {/* Icon and Message */}
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white bg-opacity-20 p-2.5 rounded-lg">
              <FaBell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm md:text-base">
                Notifications Required
              </h3>
              <p className="text-white text-opacity-90 text-xs md:text-sm">
                Please enable notifications to use this app. You'll receive important updates about tasks, messages, and announcements.
              </p>
            </div>
          </div>

          {/* Action Button - No dismiss button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              className="bg-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-opacity-90 transition-all shadow-md"
              style={{ color: 'var(--color-primary-600)' }}
            >
              Enable Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

