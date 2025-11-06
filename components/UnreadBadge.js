'use client'

export default function UnreadBadge({ count, className = '' }) {
  if (!count || count === 0) return null

  // Format count (show 99+ for counts over 99)
  const displayCount = count > 99 ? '99+' : count

  return (
    <span 
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${className}`}
      style={{ fontSize: '10px' }}
    >
      {displayCount}
    </span>
  )
}

