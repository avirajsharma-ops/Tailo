'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useSocket } from './SocketContext'

const UnreadMessagesContext = createContext({
  unreadCount: 0,
  unreadChats: {},
  markChatAsRead: () => {},
  refreshUnreadCount: () => {}
})

export function UnreadMessagesProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadChats, setUnreadChats] = useState({}) // { chatId: count }
  const { onNewMessage } = useSocket()

  // Fetch unread count from API
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/chat/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await response.json()
      
      if (result.success) {
        setUnreadCount(result.totalUnread)
        setUnreadChats(result.unreadByChat || {})
      }
    } catch (error) {
      console.error('[UnreadMessages] Error fetching unread count:', error)
    }
  }

  // Mark chat as read
  const markChatAsRead = async (chatId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/chat/${chatId}/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        // Update local state
        setUnreadChats(prev => {
          const newUnread = { ...prev }
          const chatUnread = newUnread[chatId] || 0
          setUnreadCount(prevCount => Math.max(0, prevCount - chatUnread))
          delete newUnread[chatId]
          return newUnread
        })
      }
    } catch (error) {
      console.error('[UnreadMessages] Error marking chat as read:', error)
    }
  }

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!onNewMessage) return

    const unsubscribe = onNewMessage((data) => {
      const { chatId } = data
      
      // Increment unread count for this chat
      setUnreadChats(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || 0) + 1
      }))
      
      setUnreadCount(prev => prev + 1)
    })

    return unsubscribe
  }, [onNewMessage])

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <UnreadMessagesContext.Provider value={{
      unreadCount,
      unreadChats,
      markChatAsRead,
      refreshUnreadCount: fetchUnreadCount
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext)
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider')
  }
  return context
}

