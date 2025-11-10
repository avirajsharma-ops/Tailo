// Firebase Analytics Configuration
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics'
import { getApps } from 'firebase/app'

let analytics = null

/**
 * Get Firebase Analytics instance
 * Only works in browser environment and when analytics is enabled
 */
export const getFirebaseAnalytics = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const apps = getApps()
    if (apps.length === 0) {
      console.warn('[Firebase Analytics] Firebase app not initialized')
      return null
    }

    if (!analytics) {
      analytics = getAnalytics(apps[0])
      console.log('[Firebase Analytics] Initialized successfully')
    }
    return analytics
  } catch (error) {
    console.error('[Firebase Analytics] Error getting analytics instance:', error)
    return null
  }
}

/**
 * Log custom event to Firebase Analytics
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Event parameters
 */
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
  try {
    const analyticsInstance = getFirebaseAnalytics()
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, eventParams)
      console.log(`[Firebase Analytics] Event logged: ${eventName}`, eventParams)
    }
  } catch (error) {
    console.error('[Firebase Analytics] Error logging event:', error)
  }
}

/**
 * Set user ID for analytics
 * @param {string} userId - User ID
 */
export const setAnalyticsUserId = (userId) => {
  try {
    const analyticsInstance = getFirebaseAnalytics()
    if (analyticsInstance && userId) {
      setUserId(analyticsInstance, userId)
      console.log(`[Firebase Analytics] User ID set: ${userId}`)
    }
  } catch (error) {
    console.error('[Firebase Analytics] Error setting user ID:', error)
  }
}

/**
 * Set user properties for analytics
 * @param {object} properties - User properties
 */
export const setAnalyticsUserProperties = (properties) => {
  try {
    const analyticsInstance = getFirebaseAnalytics()
    if (analyticsInstance && properties) {
      setUserProperties(analyticsInstance, properties)
      console.log('[Firebase Analytics] User properties set:', properties)
    }
  } catch (error) {
    console.error('[Firebase Analytics] Error setting user properties:', error)
  }
}

/**
 * Common analytics events for HRMS
 */
export const AnalyticsEvents = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'sign_up',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  SCREEN_VIEW: 'screen_view',
  
  // Attendance
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
  
  // Tasks
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_UPDATED: 'task_updated',
  
  // Leave
  LEAVE_REQUESTED: 'leave_requested',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  
  // Performance
  REVIEW_CREATED: 'review_created',
  REVIEW_SUBMITTED: 'review_submitted',
  
  // Announcements
  ANNOUNCEMENT_CREATED: 'announcement_created',
  ANNOUNCEMENT_VIEWED: 'announcement_viewed',
  
  // Chat
  MESSAGE_SENT: 'message_sent',
  CHAT_OPENED: 'chat_opened',
  
  // Notifications
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',
  
  // Profile
  PROFILE_UPDATED: 'profile_updated',
  PASSWORD_CHANGED: 'password_changed',
  
  // Search
  SEARCH_PERFORMED: 'search',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred'
}

export default {
  getFirebaseAnalytics,
  logAnalyticsEvent,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  AnalyticsEvents
}

