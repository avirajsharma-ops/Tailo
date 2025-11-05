'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

/**
 * Simple Permission Handler
 * Automatically requests notification and location permissions on first visit
 * Uses OneSignal's native prompt for notifications
 */
export default function PermissionHandler() {
  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [locationRequested, setLocationRequested] = useState(false)

  useEffect(() => {
    // Automatically request location permission using native browser prompt
    // OneSignal will handle notification permission with its native slidedown
    const handlePermissions = async () => {
      try {
        console.log('[Permissions] Checking location permission...')

        // Check if geolocation is supported
        if (!navigator.geolocation) {
          console.log('[Permissions] Geolocation not supported')
          setPermissionsChecked(true)
          return
        }

        // Wait a bit for the page to load and OneSignal to initialize
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Check location permission via Permissions API
        let shouldRequestLocation = false

        if (navigator.permissions) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' })
            console.log('[Permissions] Location permission state:', result.state)

            // If not granted, request it
            if (result.state !== 'granted') {
              shouldRequestLocation = true
            }
          } catch (error) {
            console.log('[Permissions] Permissions API failed, checking localStorage')
            const locPermission = localStorage.getItem('location-permission')
            if (locPermission !== 'granted') {
              shouldRequestLocation = true
            }
          }
        } else {
          // Fallback to localStorage
          const locPermission = localStorage.getItem('location-permission')
          if (locPermission !== 'granted') {
            shouldRequestLocation = true
          }
        }

        console.log('[Permissions] Should request location:', shouldRequestLocation)

        // Request location permission automatically using native prompt
        if (shouldRequestLocation) {
          await requestLocationPermission()
        }

        setPermissionsChecked(true)

      } catch (error) {
        console.error('[Permissions] Error handling permissions:', error)
      }
    }

    handlePermissions()
  }, [])

  const requestNotificationPermission = async () => {
    try {
      console.log('[Permissions] Requesting notification permission...')

      // Check current permission status
      const currentPermission = await window.OneSignal.Notifications.permission
      console.log('[Permissions] Current notification permission:', currentPermission)

      if (currentPermission) {
        console.log('[Permissions] Notifications already granted')

        // Ensure user is subscribed
        const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn
        if (!isOptedIn) {
          console.log('[Permissions] Subscribing to push notifications...')
          await window.OneSignal.User.PushSubscription.optIn()
        }

        toast.success('Notifications enabled!', {
          icon: '🔔',
          duration: 2000
        })
        return true
      }

      // Use OneSignal's requestPermission method (triggers native browser prompt)
      console.log('[Permissions] Requesting notification permission via OneSignal...')
      const granted = await window.OneSignal.Notifications.requestPermission()

      if (granted) {
        console.log('[Permissions] Notification permission granted!')

        // Subscribe to push notifications
        await window.OneSignal.User.PushSubscription.optIn()

        toast.success('Notifications enabled!', {
          icon: '🔔',
          duration: 2000
        })

        return true
      } else {
        console.log('[Permissions] Notification permission denied')
        toast.error('Notifications are required for important updates. Please enable them in your browser settings.', {
          duration: 5000
        })
        return false
      }

    } catch (error) {
      console.error('[Permissions] Error requesting notification permission:', error)

      // Fallback to native browser prompt
      try {
        if ('Notification' in window) {
          console.log('[Permissions] Using fallback native browser prompt...')
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            toast.success('Notifications enabled!', {
              icon: '🔔',
              duration: 2000
            })

            // Try to subscribe via OneSignal if available
            if (window.OneSignal) {
              try {
                await window.OneSignal.User.PushSubscription.optIn()
              } catch (e) {
                console.error('[Permissions] Failed to subscribe to OneSignal:', e)
              }
            }

            return true
          } else {
            toast.error('Notifications are required. Please enable them in your browser settings.', {
              duration: 5000
            })
          }
        }
      } catch (fallbackError) {
        console.error('[Permissions] Fallback notification request failed:', fallbackError)
      }

      return false
    }
  }

  const requestLocationPermission = async () => {
    try {
      // Skip if already requested in this session
      if (locationRequested) {
        return
      }

      setLocationRequested(true)

      console.log('[Permissions] Requesting location permission...')

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log('[Permissions] Geolocation not supported')
        toast.error('Location services not supported on this device', {
          duration: 3000
        })
        return false
      }

      // Check current permission status
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          console.log('[Permissions] Current location permission:', result.state)

          if (result.state === 'granted') {
            console.log('[Permissions] Location already granted')
            
            // Save to localStorage
            localStorage.setItem('location-permission', 'granted')
            
            toast.success('Location access enabled!', {
              icon: '📍',
              duration: 2000
            })
            return true
          }
        } catch (error) {
          console.log('[Permissions] Permissions API query failed:', error)
        }
      }

      // Request location permission by attempting to get position
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('[Permissions] Location permission granted!', position)
            
            // Save to localStorage
            localStorage.setItem('location-permission', 'granted')
            localStorage.setItem('last-location', JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now()
            }))
            
            toast.success('Location access enabled!', {
              icon: '📍',
              duration: 2000
            })
            
            resolve(true)
          },
          (error) => {
            console.error('[Permissions] Location permission error:', error)
            
            // Save denial to localStorage
            localStorage.setItem('location-permission', 'denied')
            
            let errorMessage = 'Location access denied'
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Please enable location access in your browser settings to use attendance features'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your device settings'
                break
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again'
                break
            }
            
            toast.error(errorMessage, {
              duration: 5000,
              icon: '📍'
            })
            
            resolve(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })

    } catch (error) {
      console.error('[Permissions] Error requesting location permission:', error)
      return false
    }
  }

  // This component doesn't render anything
  return null
}

/**
 * Hook to manually trigger permission requests
 */
export function usePermissions() {
  const requestNotifications = async () => {
    try {
      if (typeof window === 'undefined' || !window.OneSignal) {
        toast.error('Notification service not ready. Please refresh the page.', {
          duration: 3000
        })
        return false
      }

      // Request permission via OneSignal (triggers native browser prompt)
      const granted = await window.OneSignal.Notifications.requestPermission()

      if (granted) {
        await window.OneSignal.User.PushSubscription.optIn()
        toast.success('Notifications enabled!', {
          icon: '🔔',
          duration: 2000
        })
        return true
      } else {
        toast.error('Please enable notifications in your browser settings', {
          duration: 4000
        })
        return false
      }
    } catch (error) {
      console.error('[Permissions] Error requesting notifications:', error)
      toast.error('Failed to enable notifications', {
        duration: 3000
      })
      return false
    }
  }

  const requestLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast.error('Location services not supported', {
          duration: 3000
        })
        return false
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            localStorage.setItem('location-permission', 'granted')
            localStorage.setItem('last-location', JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now()
            }))
            
            toast.success('Location access enabled!', {
              icon: '📍',
              duration: 2000
            })
            
            resolve(true)
          },
          (error) => {
            localStorage.setItem('location-permission', 'denied')
            
            toast.error('Please enable location access in your browser settings', {
              duration: 5000,
              icon: '📍'
            })
            
            resolve(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })
    } catch (error) {
      console.error('[Permissions] Error requesting location:', error)
      return false
    }
  }

  const checkPermissions = async () => {
    const notificationPermission = window.OneSignal 
      ? await window.OneSignal.Notifications.permission 
      : false
    
    const locationPermission = localStorage.getItem('location-permission') === 'granted'

    return {
      notifications: notificationPermission,
      location: locationPermission,
      all: notificationPermission && locationPermission
    }
  }

  return {
    requestNotifications,
    requestLocation,
    checkPermissions
  }
}

