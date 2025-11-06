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

  const getIconAndColor = () => {
    switch (notification.type) {
      case 'message':
        return {
          icon: <FaComment className="w-5 h-5" />,
          bgColor: '#EFF6FF',
          iconColor: '#2563EB',
          progressColor: '#3B82F6'
        }
      case 'task_assigned':
      case 'task_status_update':
      case 'task_completed':
        return {
          icon: <FaTasks className="w-5 h-5" />,
          bgColor: '#ECFDF5',
          iconColor: '#059669',
          progressColor: '#10B981'
        }
      case 'announcement':
        return {
          icon: <FaBullhorn className="w-5 h-5" />,
          bgColor: '#FFF7ED',
          iconColor: '#EA580C',
          progressColor: '#F97316'
        }
      default:
        return {
          icon: <FaBell className="w-5 h-5" />,
          bgColor: '#EFF6FF',
          iconColor: '#2563EB',
          progressColor: '#3B82F6'
        }
    }
  }

  const { icon, bgColor, iconColor, progressColor } = getIconAndColor()

  return (
    <div
      className={`max-w-sm w-full bg-white rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      } ${notification.url ? 'cursor-pointer hover:shadow-3xl' : ''}`}
      onClick={handleClick}
      style={{
        borderColor: progressColor,
        borderWidth: '2px'
      }}
    >
      {/* Header with gradient */}
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${progressColor} 0%, ${iconColor} 100%)` }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: bgColor,
              color: iconColor
            }}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                {notification.title}
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close notification"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            {notification.url && (
              <p className="text-xs font-medium mt-2" style={{ color: iconColor }}>
                Click to view →
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full transition-all duration-[5000ms] ease-linear"
          style={{
            width: isVisible ? '0%' : '100%',
            backgroundColor: progressColor
          }}
        />
      </div>
    </div>
  )
}

