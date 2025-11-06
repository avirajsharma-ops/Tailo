'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import InAppNotification from '@/components/InAppNotification'

const InAppNotificationContext = createContext({
  showNotification: () => {}
})

export function InAppNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <InAppNotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Render notifications */}
      <div className="fixed top-0 right-0 z-[9999] pointer-events-none">
        <div className="flex flex-col gap-2 p-4 pointer-events-auto">
          {notifications.map((notification) => (
            <InAppNotification
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </div>
    </InAppNotificationContext.Provider>
  )
}

export function useInAppNotification() {
  const context = useContext(InAppNotificationContext)
  if (!context) {
    throw new Error('useInAppNotification must be used within InAppNotificationProvider')
  }
  return context
}

