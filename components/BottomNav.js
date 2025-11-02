'use client'

import { usePathname, useRouter } from 'next/navigation'
import { FaHome, FaTasks, FaComments, FaCalendarAlt, FaLightbulb } from 'react-icons/fa'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      name: 'Home',
      icon: FaHome,
      path: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      name: 'Tasks',
      icon: FaTasks,
      path: '/dashboard/tasks/my-tasks',
      active: pathname.startsWith('/dashboard/tasks')
    },
    {
      name: 'Chat',
      icon: FaComments,
      path: '/dashboard/chat',
      active: pathname.startsWith('/dashboard/chat')
    },
    {
      name: 'Leave',
      icon: FaCalendarAlt,
      path: '/dashboard/leave',
      active: pathname.startsWith('/dashboard/leave')
    },
    {
      name: 'Ideas',
      icon: FaLightbulb,
      path: '/dashboard/sandbox',
      active: pathname.startsWith('/dashboard/sandbox')
    }
  ]

  return (
    <div className="bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden -m-1" style={{ margin: 0, padding: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around " style={{ margin: 0, padding: '6px 0' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`p-2 rounded-lg transition-all ${
                item.active
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#EEF3FF] text-gray-600'
              }`}
              style={{ margin: 0 }}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

