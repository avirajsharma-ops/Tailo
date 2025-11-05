'use client'

import { useState, useEffect } from 'react'
import { FaBell, FaCheck, FaMapMarkerAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useTheme } from '@/contexts/ThemeContext'
import {
  isNotificationSupported,
  getNotificationPermission,
  showNotification,
  saveNotificationPreference,
  subscribeToPushNotifications,
  savePushSubscriptionToServer
} from '@/utils/notifications'

export default function NotificationPermissionPopup() {
  const { currentTheme, themes } = useTheme()
  const theme = themes[currentTheme]

  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState('default') // 'default', 'granted', 'denied'
  const [locationStatus, setLocationStatus] = useState('prompt') // 'prompt', 'granted', 'denied'
  const [locationServiceOff, setLocationServiceOff] = useState(false)

  // Check permissions status
  useEffect(() => {
    if (!isNotificationSupported()) {
      return
    }

    const checkPermissionStatus = async () => {
      try {
        // 1. Check notification permission
        const notifPermission = getNotificationPermission()
        setNotificationStatus(notifPermission)

        // 2. Check location permission - Try to get position to verify actual permission
        let locPermission = 'prompt'

        // First try Permissions API
        if (navigator.permissions) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' })
            locPermission = result.state

            // Listen for permission changes
            result.onchange = () => {
              setLocationStatus(result.state)
              if (result.state === 'granted') {
                // Verify location service is on
                verifyLocationService()
              }
            }
          } catch (error) {
            // Fallback: Try to get position to determine permission
            locPermission = await checkLocationViaPosition()
          }
        } else {
          // Fallback for browsers without Permissions API
          locPermission = await checkLocationViaPosition()
        }

        setLocationStatus(locPermission)

        // 3. If location permission is granted, verify location service is on
        if (locPermission === 'granted') {
          verifyLocationService()
        } else {
          setLocationServiceOff(false)
        }

        // 4. Determine if we should show the prompt
        const allGranted = notifPermission === 'granted' && locPermission === 'granted' && !locationServiceOff

        if (allGranted) {
          setPermissionGranted(true)
          setShowPrompt(false)
        } else {
          setShowPrompt(true)
          setPermissionGranted(false)
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
      }
    }

    // Check location permission by trying to get position
    const checkLocationViaPosition = () => {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve('denied')
            } else {
              resolve('prompt')
            }
          },
          { timeout: 1000, maximumAge: Infinity }
        )
      })
    }

    // Verify location service is actually working
    const verifyLocationService = () => {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationServiceOff(false)
        },
        (error) => {
          if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
            setLocationServiceOff(true)
          } else if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus('denied')
            setLocationServiceOff(false)
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000
        }
      )
    }

    // Initial check
    checkPermissionStatus()

    // Check every 3 seconds
    const interval = setInterval(checkPermissionStatus, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleEnablePermissions = async () => {
    console.log('🔘 [Permissions] User clicked enable button')
    setIsRequesting(true)

    try {
      let notificationGranted = false
      let locationGranted = false

      // STEP 1: Request Notification Permission First
      console.log('🔔 [Permissions] Requesting notification permission...')

      if (typeof Notification === 'undefined') {
        toast.error('Notifications are not supported in this browser', {
          duration: 5000,
          icon: '❌'
        })
        setIsRequesting(false)
        return
      }

      const currentNotifPermission = Notification.permission
      console.log('🔔 [Permissions] Current notification permission:', currentNotifPermission)

      if (currentNotifPermission === 'granted') {
        notificationGranted = true
        console.log('✅ [Permissions] Notifications already granted')
      } else if (currentNotifPermission === 'denied') {
        console.log('❌ [Permissions] Notifications are DENIED - showing manual instructions')
        setNotificationStatus('denied')
        toast.error(
          `Notifications are blocked. To enable:\n1. Click the lock icon (🔒) in the address bar\n2. Change "Notifications" to "Allow"\n3. Refresh the page`,
          {
            duration: 15000,
            icon: '🔔',
            style: {
              whiteSpace: 'pre-line',
              maxWidth: '500px'
            }
          }
        )
        setIsRequesting(false)
        return
      } else {
        // Permission is 'default' - trigger native popup
        console.log('🔔 [Permissions] Triggering NATIVE notification popup...')
        try {
          const permission = await Notification.requestPermission()
          console.log('🔔 [Permissions] Notification permission result:', permission)
          notificationGranted = permission === 'granted'
          setNotificationStatus(permission)

          if (permission === 'denied') {
            toast.error('Notification permission was denied. Please enable it in browser settings.', {
              duration: 5000,
              icon: '❌'
            })
            setIsRequesting(false)
            return
          }
        } catch (error) {
          console.error('❌ [Permissions] Error requesting notification permission:', error)
          toast.error('Failed to request notification permission', {
            duration: 4000
          })
          setIsRequesting(false)
          return
        }
      }

      // STEP 2: Request Location Permission
      console.log('📍 [Permissions] Requesting location permission...')

      if (!navigator.geolocation) {
        toast.error('Location services are not supported in this browser', {
          duration: 5000,
          icon: '❌'
        })
        setIsRequesting(false)
        return
      }

      // Check current location permission status
      let currentLocPermission = 'prompt'
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          currentLocPermission = result.state
          console.log('📍 [Permissions] Current location permission:', currentLocPermission)
        } catch (error) {
          console.warn('⚠️ [Permissions] Could not query location permission')
        }
      }

      if (currentLocPermission === 'denied') {
        console.log('❌ [Permissions] Location is DENIED - showing manual instructions')
        setLocationStatus('denied')
        toast.error(
          `Location is blocked. To enable:\n1. Click the lock icon (🔒) in the address bar\n2. Change "Location" to "Allow"\n3. Refresh the page`,
          {
            duration: 15000,
            icon: '📍',
            style: {
              whiteSpace: 'pre-line',
              maxWidth: '500px'
            }
          }
        )
        setIsRequesting(false)
        return
      }

      // Trigger native location popup by requesting current position
      console.log('📍 [Permissions] Triggering NATIVE location popup...')
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('✅ [Permissions] Location permission granted:', position)
              locationGranted = true
              setLocationStatus('granted')
              setLocationServiceOff(false)
              resolve(position)
            },
            (error) => {
              console.error('❌ [Permissions] Location error:', error)

              if (error.code === error.PERMISSION_DENIED) {
                setLocationStatus('denied')
                toast.error('Location permission was denied. Please enable it in browser settings.', {
                  duration: 5000,
                  icon: '❌'
                })
                reject(error)
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                // Permission granted but location service is off
                console.warn('⚠️ [Permissions] Location service is OFF')
                setLocationServiceOff(true)
                toast.error(
                  'Location service is turned off. Please enable location services in your device settings.',
                  {
                    duration: 8000,
                    icon: '📍',
                    style: {
                      whiteSpace: 'pre-line',
                      maxWidth: '500px'
                    }
                  }
                )
                reject(error)
              } else if (error.code === error.TIMEOUT) {
                console.warn('⚠️ [Permissions] Location request timed out')
                toast.error('Location request timed out. Please try again.', {
                  duration: 4000
                })
                reject(error)
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            }
          )
        })
      } catch (locError) {
        console.error('❌ [Permissions] Location permission error:', locError)
        setIsRequesting(false)
        return
      }

      // STEP 3: Check if both permissions are granted
      if (notificationGranted && locationGranted) {
        console.log('🎉 [Permissions] ALL PERMISSIONS GRANTED!')
        setPermissionGranted(true)
        saveNotificationPreference(true)
        setShowPrompt(false)

        toast.success('All permissions enabled successfully!', {
          duration: 3000,
          icon: '🎉'
        })

        // Subscribe to push notifications
        setTimeout(async () => {
          try {
            console.log('📲 [Permissions] Subscribing to push notifications...')
            const subscription = await subscribeToPushNotifications()

            if (subscription) {
              await savePushSubscriptionToServer(subscription)
              console.log('✅ [Permissions] Push subscription saved to server')
            }

            // Show a test notification
            await showNotification('🎉 All Permissions Enabled!', {
              body: 'You will now receive important updates and geofencing features are active.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-96x96.png',
              tag: 'permission-success',
              requireInteraction: false,
              vibrate: [200, 100, 200]
            })
          } catch (notifError) {
            console.error('❌ [Permissions] Error in post-permission setup:', notifError)
          }
        }, 1000)
      } else {
        console.log('⚠️ [Permissions] Some permissions are still missing')
        const missingPerms = []
        if (!notificationGranted) missingPerms.push('Notifications')
        if (!locationGranted) missingPerms.push('Location')

        toast.error(`${missingPerms.join(' and ')} ${missingPerms.length > 1 ? 'are' : 'is'} still required.`, {
          duration: 5000,
          icon: '⚠️'
        })
      }
    } catch (error) {
      console.error('❌ [Permissions] Unexpected error:', error)
      toast.error('An error occurred. Please try again.', {
        duration: 4000
      })
    } finally {
      setIsRequesting(false)
    }
  }

  // Determine UI state
  const isBlocked = notificationStatus === 'denied' || locationStatus === 'denied'

  if (!showPrompt) {
    return null
  }

  // Get theme colors
  const primaryColor = theme.primary[600]
  const primaryLight = theme.primary[100]
  const primaryDark = theme.primary[700]

  return (
    <>
      {/* Backdrop - Non-dismissible */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] backdrop-blur-sm" />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-[90%] max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>
          {/* Header */}
          <div
            className="p-8 text-white relative"
            style={{
              background: isBlocked
                ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                : theme.accent.gradient
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm flex items-center gap-3">
                <FaBell className="w-7 h-7" />
                <FaMapMarkerAlt className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {isBlocked ? 'Permissions Required' : 'Enable Permissions'}
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  {isBlocked ? 'Please enable manually' : 'Required for full functionality'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Permission Status Display */}
            <div className="mb-6 space-y-3">
              {/* Notification Status */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: notificationStatus === 'granted' ? `${theme.primary[50]}` : '#F9FAFB',
                  border: `2px solid ${notificationStatus === 'granted' ? theme.primary[200] : '#E5E7EB'}`
                }}
              >
                <div className="flex items-center gap-3">
                  <FaBell
                    className="w-5 h-5"
                    style={{
                      color: notificationStatus === 'granted' ? theme.primary[600] :
                             notificationStatus === 'denied' ? '#DC2626' : '#9CA3AF'
                    }}
                  />
                  <span className="text-base font-semibold text-gray-800">Notifications</span>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: notificationStatus === 'granted' ? theme.primary[100] :
                                   notificationStatus === 'denied' ? '#FEE2E2' : '#FEF3C7',
                    color: notificationStatus === 'granted' ? theme.primary[700] :
                          notificationStatus === 'denied' ? '#991B1B' : '#92400E'
                  }}
                >
                  {notificationStatus === 'granted' ? '✓ Enabled' : notificationStatus === 'denied' ? '✗ Blocked' : '⚠ Pending'}
                </span>
              </div>

              {/* Location Status */}
              <div
                className="flex items-center justify-between p-4 rounded-xl transition-all"
                style={{
                  backgroundColor: locationStatus === 'granted' ? `${theme.primary[50]}` : '#F9FAFB',
                  border: `2px solid ${locationStatus === 'granted' ? theme.primary[200] : '#E5E7EB'}`
                }}
              >
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt
                    className="w-5 h-5"
                    style={{
                      color: locationStatus === 'granted' ? theme.primary[600] :
                             locationStatus === 'denied' ? '#DC2626' : '#9CA3AF'
                    }}
                  />
                  <span className="text-base font-semibold text-gray-800">Location</span>
                </div>
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: locationStatus === 'granted' ? theme.primary[100] :
                                   locationStatus === 'denied' ? '#FEE2E2' : '#FEF3C7',
                    color: locationStatus === 'granted' ? theme.primary[700] :
                          locationStatus === 'denied' ? '#991B1B' : '#92400E'
                  }}
                >
                  {locationStatus === 'granted' ? '✓ Enabled' : locationStatus === 'denied' ? '✗ Blocked' : '⚠ Pending'}
                </span>
              </div>

              {/* Location Service Off Warning */}
              {locationServiceOff && locationStatus === 'granted' && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                  <p className="text-orange-900 text-sm font-bold flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    Location Service is OFF
                  </p>
                  <p className="text-orange-800 text-sm mt-2">
                    Permission granted, but location service is disabled. Enable it in device settings.
                  </p>
                </div>
              )}
            </div>

            {/* Instructions based on status */}
            {isBlocked ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
                <p className="text-red-900 font-bold text-base mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Permissions Blocked
                </p>
                <p className="text-red-800 text-sm mb-4">
                  {notificationStatus === 'denied' && locationStatus === 'denied'
                    ? 'Both Notifications and Location are blocked.'
                    : notificationStatus === 'denied'
                    ? 'Notifications are blocked.'
                    : 'Location is blocked.'}
                  {' '}Follow these steps:
                </p>
                <ol className="text-red-800 text-sm space-y-2 list-decimal list-inside font-medium">
                  <li>Click the lock icon (🔒) in your browser's address bar</li>
                  <li>Find "{notificationStatus === 'denied' ? 'Notifications' : ''}{notificationStatus === 'denied' && locationStatus === 'denied' ? ' and ' : ''}{locationStatus === 'denied' ? 'Location' : ''}"</li>
                  <li>Change to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: theme.primary[50] }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FaBell className="w-5 h-5" style={{ color: theme.primary[600] }} />
                    <h4 className="font-bold text-gray-900">Notifications</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary[500] }} />
                      <span className="text-gray-700 text-sm">Task assignments and updates</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary[500] }} />
                      <span className="text-gray-700 text-sm">Leave request approvals</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary[500] }} />
                      <span className="text-gray-700 text-sm">Important announcements</span>
                    </li>
                  </ul>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: theme.primary[50] }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FaMapMarkerAlt className="w-5 h-5" style={{ color: theme.primary[600] }} />
                    <h4 className="font-bold text-gray-900">Location Access</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary[500] }} />
                      <span className="text-gray-700 text-sm">Geofencing and attendance tracking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary[500] }} />
                      <span className="text-gray-700 text-sm">Verify you're at office premises</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <FaCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary[500] }} />
                      <span className="text-gray-700 text-sm">Automatic check-in/check-out</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleEnablePermissions}
              disabled={isRequesting || isBlocked}
              className="w-full font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3 shadow-xl text-white text-lg"
              style={{
                background: isBlocked
                  ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                  : theme.accent.gradient,
                cursor: isBlocked ? 'not-allowed' : 'pointer'
              }}
            >
              {isRequesting ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Requesting...</span>
                </>
              ) : isBlocked ? (
                <span>Follow Instructions Above</span>
              ) : (
                <>
                  <FaBell className="w-5 h-5" />
                  <FaMapMarkerAlt className="w-5 h-5" />
                  <span>Enable Permissions</span>
                </>
              )}
            </button>
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

