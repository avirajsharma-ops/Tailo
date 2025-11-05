'use client'

import { useState, useEffect } from 'react'
import { FaBell, FaTimes, FaCheck, FaMapMarkerAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  hasUserDismissedNotificationPrompt,
  markNotificationPromptDismissed,
  saveNotificationPreference,
  subscribeToPushNotifications,
  savePushSubscriptionToServer
} from '@/utils/notifications'

export default function NotificationPermissionPopup() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [isDenied, setIsDenied] = useState(false)
  const [locationPermission, setLocationPermission] = useState('prompt')
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => {
    console.log('PermissionPopup: Initializing...')

    // Check if notifications are supported
    if (!isNotificationSupported()) {
      console.log('PermissionPopup: Notifications not supported')
      return
    }

    const checkPermissionStatus = async () => {
      // Check notification permission
      const currentPermission = getNotificationPermission()
      console.log('PermissionPopup: Notification permission:', currentPermission)

      // Check location permission
      let locationStatus = 'prompt'
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          locationStatus = result.state
          console.log('PermissionPopup: Location permission:', locationStatus)
          setLocationPermission(locationStatus)
          setLocationDenied(locationStatus === 'denied')
        } catch (error) {
          console.log('PermissionPopup: Could not query location permission:', error)
        }
      }

      // Hide prompt only if BOTH permissions are granted
      if (currentPermission === 'granted' && locationStatus === 'granted') {
        console.log('PermissionPopup: All permissions granted')
        setPermissionGranted(true)
        setShowPrompt(false)
        setIsDenied(false)
        return
      }

      // Show prompt if any permission is missing
      if (currentPermission === 'denied' || locationStatus === 'denied') {
        console.log('PermissionPopup: Some permissions denied')
        setShowPrompt(true)
        setIsDenied(currentPermission === 'denied')
        return
      }

      if (currentPermission === 'default' || locationStatus === 'prompt') {
        console.log('PermissionPopup: Permissions not requested yet, showing prompt')
        setShowPrompt(true)
        setIsDenied(false)
        return
      }
    }

    // Initial check
    checkPermissionStatus()

    // Set up interval to check permission status every 3 seconds
    const interval = setInterval(() => {
      checkPermissionStatus()
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleEnablePermissions = async () => {
    console.log('PermissionPopup: User clicked enable')
    setIsRequesting(true)

    // Set timeout to reset loading state after 15 seconds
    const timeout = setTimeout(() => {
      console.log('PermissionPopup: Request timeout - resetting state')
      setIsRequesting(false)
      toast.error('Request timed out. Please try again.', {
        duration: 3000
      })
    }, 15000)

    try {
      console.log('PermissionPopup: Requesting permissions...')

      // Step 1: Request Location Permission
      let locationGranted = false
      if (navigator.geolocation) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('PermissionPopup: Location permission granted')
                locationGranted = true
                setLocationPermission('granted')
                setLocationDenied(false)
                resolve(position)
              },
              (error) => {
                console.log('PermissionPopup: Location permission denied:', error)
                if (error.code === error.PERMISSION_DENIED) {
                  setLocationPermission('denied')
                  setLocationDenied(true)
                  toast.error('Location permission is required for geofencing features', {
                    duration: 5000,
                    icon: '📍'
                  })
                }
                reject(error)
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            )
          })
        } catch (locError) {
          console.error('Location permission error:', locError)
        }
      }

      // Step 2: Request Notification Permission
      console.log('PermissionPopup: Requesting notification permission...')

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
      console.log('PermissionPopup: Current notification permission before request:', currentPermission)

      let notificationGranted = false

      if (currentPermission === 'granted') {
        // Already granted
        notificationGranted = true
        console.log('PermissionPopup: Notifications already enabled')
      } else if (currentPermission === 'denied') {
        // Show detailed instructions
        toast.error(
          'To enable notifications:\n1. Click the lock/info icon (🔒/ⓘ) in your browser address bar\n2. Find "Notifications" and change to "Allow"\n3. Refresh this page',
          {
            duration: 12000,
            icon: '🔔',
            style: {
              whiteSpace: 'pre-line',
              maxWidth: '500px'
            }
          }
        )
      } else {
        // Request permission - this triggers the native browser prompt (only for 'default' state)
        console.log('PermissionPopup: Triggering native notification permission request...')
        const permission = await Notification.requestPermission()
        console.log('PermissionPopup: Notification permission result:', permission)
        notificationGranted = permission === 'granted'
      }

      // Clear timeout on response
      clearTimeout(timeout)

      // Check if both permissions are granted
      if (notificationGranted && locationGranted) {
        console.log('PermissionPopup: All permissions granted!')
        setPermissionGranted(true)
        saveNotificationPreference(true)
        setShowPrompt(false)

        toast.success('All permissions enabled successfully!', {
          duration: 2000,
          icon: '🎉'
        })

        // Subscribe to push notifications
        setTimeout(async () => {
          try {
            console.log('PermissionPopup: Subscribing to push notifications...')
            const subscription = await subscribeToPushNotifications()

            if (subscription) {
              // Save subscription to server
              await savePushSubscriptionToServer(subscription)
              console.log('PermissionPopup: Push subscription saved to server')
            }

            // Show a test notification
            console.log('PermissionPopup: Showing test notification')
            await showNotification('🎉 All Permissions Enabled!', {
              body: 'You will now receive important updates and geofencing features are active.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-96x96.png',
              tag: 'permission-success',
              requireInteraction: false,
              vibrate: [200, 100, 200]
            })
          } catch (notifError) {
            console.error('Error in post-permission setup:', notifError)
          }
        }, 1000)
      } else {
        // Some permissions missing
        console.log('PermissionPopup: Some permissions missing')
        setShowPrompt(true)

        const missingPerms = []
        if (!notificationGranted) missingPerms.push('Notifications')
        if (!locationGranted) missingPerms.push('Location')

        toast.error(`${missingPerms.join(' and ')} ${missingPerms.length > 1 ? 'are' : 'is'} required for this app.`, {
          duration: 5000,
          icon: '⚠️'
        })
      }
    } catch (error) {
      clearTimeout(timeout)
      console.error('PermissionPopup: Error requesting permissions:', error)
      toast.error('Failed to request permissions. Please try again.', {
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
          <div className={`p-6 text-white relative ${isDenied || locationDenied ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>

            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-full flex items-center gap-2">
                <FaBell className="w-6 h-6" />
                <FaMapMarkerAlt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {isDenied || locationDenied ? 'Permissions Required' : 'Enable Permissions'}
                </h3>
                <p className={`text-sm mt-1 ${isDenied || locationDenied ? 'text-red-100' : 'text-blue-100'}`}>
                  {isDenied || locationDenied ? 'Action Required' : 'Notifications & Location Access'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {(isDenied || locationDenied) ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">⚠️ Permissions are currently blocked</p>
                  <p className="text-red-700 text-sm mb-3">
                    Both Notifications and Location permissions are essential for this app. Please enable them manually:
                  </p>
                  <ol className="text-red-700 text-sm space-y-1.5 list-decimal list-inside">
                    <li>Click the lock icon (🔒) or info icon (ⓘ) in your browser's address bar</li>
                    <li>Find "Notifications" and "Location" in the permissions list</li>
                    <li>Change both settings from "Block" to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FaBell className="text-blue-500 w-5 h-5" />
                    <h4 className="font-semibold text-gray-900">Notifications</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Task assignments and updates</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Leave request approvals</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Important announcements</span>
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FaMapMarkerAlt className="text-blue-500 w-5 h-5" />
                    <h4 className="font-semibold text-gray-900">Location Access</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Geofencing and attendance tracking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Verify you're at office premises</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">Automatic check-in/check-out</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnablePermissions}
                disabled={isRequesting}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  isDenied || locationDenied
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
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <FaBell className="w-4 h-4" />
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{isDenied || locationDenied ? 'I Have Enabled Permissions' : 'Enable Permissions'}</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Both Notifications and Location permissions are required to use this app
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

