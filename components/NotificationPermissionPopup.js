'use client'

import { useState, useEffect } from 'react'
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  hasUserDismissedNotificationPrompt,
  markNotificationPromptDismissed,
  saveNotificationPreference
} from '@/utils/notifications'

export default function NotificationPermissionPopup() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [isDenied, setIsDenied] = useState(false)

  useEffect(() => {
    console.log('NotificationPermissionPopup: Initializing...')

    // Check if notifications are supported
    if (!isNotificationSupported()) {
      console.log('NotificationPermissionPopup: Notifications not supported')
      return
    }

    const checkPermissionStatus = () => {
      // Check current permission status
      const currentPermission = getNotificationPermission()
      console.log('NotificationPermissionPopup: Current permission:', currentPermission)

      // Only hide prompt if permission is granted
      if (currentPermission === 'granted') {
        console.log('NotificationPermissionPopup: Permission already granted')
        setPermissionGranted(true)
        setShowPrompt(false)
        setIsDenied(false)
        return
      }

      // Show prompt for both 'default' and 'denied' states
      // Notifications are critical for app functionality
      if (currentPermission === 'denied') {
        console.log('NotificationPermissionPopup: Permission denied - prompting user to enable in browser settings')
        setShowPrompt(true)
        setIsDenied(true)
        return
      }

      if (currentPermission === 'default') {
        console.log('NotificationPermissionPopup: Permission not requested yet, showing prompt')
        setShowPrompt(true)
        setIsDenied(false)
        return
      }
    }

    // Initial check
    checkPermissionStatus()

    // Set up interval to check permission status every 3 seconds
    // This ensures we update UI if permission changes
    const interval = setInterval(() => {
      checkPermissionStatus()
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleEnableNotifications = async () => {
    console.log('NotificationPermissionPopup: User clicked enable')
    setIsRequesting(true)

    // Set timeout to reset loading state after 15 seconds
    const timeout = setTimeout(() => {
      console.log('NotificationPermissionPopup: Request timeout - resetting state')
      setIsRequesting(false)
      toast.error('Request timed out. Please try again.', {
        duration: 3000
      })
    }, 15000)

    try {
      console.log('NotificationPermissionPopup: Requesting permission...')

      // Check if Notification API is available
      if (typeof Notification === 'undefined') {
        clearTimeout(timeout)
        toast.error('Notifications are not supported in this browser', {
          duration: 5000,
          icon: '❌'
        })
        setIsRequesting(false)
        return
      }

      // Check current permission state
      const currentPermission = Notification.permission
      console.log('NotificationPermissionPopup: Current permission before request:', currentPermission)

      if (currentPermission === 'denied') {
        // If already denied, show instructions to enable in browser settings
        clearTimeout(timeout)
        toast.error('Notifications are blocked. Please enable them in your browser settings and refresh the page.', {
          duration: 8000,
          icon: '🔔'
        })
        setIsRequesting(false)
        // Keep popup visible so user knows they need to enable notifications
        return
      }

      if (currentPermission === 'granted') {
        // Already granted
        clearTimeout(timeout)
        setPermissionGranted(true)
        saveNotificationPreference(true)
        setShowPrompt(false)
        setIsRequesting(false)
        toast.success('Notifications are already enabled!', {
          duration: 2000,
          icon: '✅'
        })
        return
      }

      // Request permission - this triggers the native browser prompt
      console.log('NotificationPermissionPopup: Triggering native permission request...')
      const permission = await Notification.requestPermission()

      // Clear timeout on response
      clearTimeout(timeout)

      console.log('NotificationPermissionPopup: Permission result:', permission)

      if (permission === 'granted') {
        console.log('NotificationPermissionPopup: Permission granted!')
        setPermissionGranted(true)
        saveNotificationPreference(true)
        setShowPrompt(false)

        toast.success('Notifications enabled successfully!', {
          duration: 2000,
          icon: '🎉'
        })

        // Show a test notification
        setTimeout(async () => {
          console.log('NotificationPermissionPopup: Showing test notification')
          try {
            await showNotification('🎉 Notifications Enabled!', {
              body: 'You will now receive important updates from Talio HRMS.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-96x96.png',
              tag: 'notification-success',
              requireInteraction: false,
              vibrate: [200, 100, 200]
            })
          } catch (notifError) {
            console.error('Error showing test notification:', notifError)
          }
        }, 1000)
      } else if (permission === 'denied') {
        console.log('NotificationPermissionPopup: Permission denied by user')
        // Keep popup visible - notifications are required
        setShowPrompt(true)
        toast.error('Notifications are required for this app. Please enable them in your browser settings.', {
          duration: 6000,
          icon: '⚠️'
        })
      } else {
        // Permission is still 'default' - user dismissed the prompt
        console.log('NotificationPermissionPopup: User dismissed the prompt')
        setShowPrompt(true)
        toast.info('Please enable notifications to use all features', {
          duration: 3000,
          icon: 'ℹ️'
        })
      }
    } catch (error) {
      clearTimeout(timeout)
      console.error('NotificationPermissionPopup: Error requesting permission:', error)
      toast.error('Failed to request notification permission. Please try again.', {
        duration: 4000
      })
    } finally {
      setIsRequesting(false)
    }
  }

  // Removed dismiss and not now handlers - popup is now compulsory

  if (!showPrompt) {
    return null
  }

  return (
    <>
      {/* Backdrop - Non-dismissible */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] animate-fade-in"
      />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-[90%] max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-6 text-white relative ${isDenied ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>

            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <FaBell className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {isDenied ? 'Notifications Blocked' : 'Enable Notifications'}
                </h3>
                <p className={`text-sm mt-1 ${isDenied ? 'text-red-100' : 'text-blue-100'}`}>
                  {isDenied ? 'Action Required' : 'Stay updated with Talio HRMS'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isDenied ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">⚠️ Notifications are currently blocked</p>
                  <p className="text-red-700 text-sm">
                    Notifications are essential for this app to function properly. Please enable them in your browser settings.
                  </p>
                </div>

                <p className="text-gray-700 font-semibold mb-3">How to enable notifications:</p>
                <ol className="space-y-2 mb-6 list-decimal list-inside text-sm text-gray-600">
                  <li>Click the lock icon (🔒) or info icon (ⓘ) in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions list</li>
                  <li>Change the setting from "Block" to "Allow"</li>
                  <li>Refresh this page or click the button below</li>
                </ol>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-4">
                  Get instant notifications for:
                </p>
              </>
            )}

            {!isDenied && (
              <ul className="space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Task assignments and updates</span>
                </li>
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Leave request approvals</span>
                </li>
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Important announcements</span>
                </li>
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Attendance reminders</span>
                </li>
              </ul>
            )}

            {!isDenied && (
              <ul className="space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Task assignments and updates</span>
                </li>
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Leave request approvals</span>
                </li>
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Important announcements</span>
                </li>
                <li className="flex items-start space-x-3">
                  <FaCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Attendance reminders</span>
                </li>
              </ul>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnableNotifications}
                disabled={isRequesting}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  isDenied
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRequesting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <FaBell className="w-4 h-4" />
                    <span>{isDenied ? 'Check Notification Settings' : 'Enable Notifications'}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              {isDenied
                ? 'After enabling in browser settings, click the button above to verify'
                : 'Notifications are required to use this app'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// Hook to check notification status
export function useNotificationStatus() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    setIsSupported(isNotificationSupported())
    setPermission(getNotificationPermission())

    // Listen for permission changes
    const checkPermission = () => {
      setPermission(getNotificationPermission())
    }

    // Check permission periodically (some browsers don't fire events)
    const interval = setInterval(checkPermission, 1000)

    return () => clearInterval(interval)
  }, [])

  return { isSupported, permission, isGranted: permission === 'granted' }
}

