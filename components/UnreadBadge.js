'use client'

export default function UnreadBadge({ count, className = '' }) {
  if (!count || count === 0) return null

  // Format count (show 99+ for counts over 99)
  const displayCount = count > 99 ? '99+' : count

  return (
    <span
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5 shadow-lg border-2 border-white ${className}`}
      style={{
        fontSize: '10px',
        zIndex: 50,
        pointerEvents: 'none'
      }}
    >
      {displayCount}
    </span>
  )
}

