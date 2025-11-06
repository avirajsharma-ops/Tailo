'use client'

import { useEffect, useState } from 'react'
import { FaTimes, FaComment, FaTasks, FaBullhorn, FaBell } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

export default function InAppNotification({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300) // Wait for fade out animation
  }

  const handleClick = () => {
    if (notification.url) {
      router.push(notification.url)
    }
    handleClose()
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <FaComment className="text-blue-500" />
      case 'task_assigned':
      case 'task_status_update':
      case 'task_completed':
        return <FaTasks className="text-green-500" />
      case 'announcement':
        return <FaBullhorn className="text-orange-500" />
      default:
        return <FaBell className="text-gray-500" />
    }
  }

  return (
    <div
      className={`fixed top-20 right-4 z-[9999] max-w-sm w-full bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      onClick={handleClick}
      style={{ cursor: notification.url ? 'pointer' : 'default' }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                {notification.title}
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-500 transition-all duration-[5000ms] ease-linear"
          style={{ width: isVisible ? '0%' : '100%' }}
        />
      </div>
    </div>
  )
}

