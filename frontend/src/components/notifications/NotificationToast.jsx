// C:\OSPanel\domains\karny\frontend\src\components\notifications\NotificationToast.jsx

import { useState, useRef } from 'react'
import { useNotification } from '../../contexts/NotificationContext'

export default function NotificationToast({ notification, darkMode }) {
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const toastRef = useRef(null)
  const { removeNotification } = useNotification()

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!isSwiping) return
    
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    
    // Только свайп вправо для закрытия
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100))
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    
    if (swipeOffset > 60) {
      // Закрываем с анимацией
      setIsClosing(true)
      setTimeout(() => {
        removeNotification(notification.id)
      }, 200)
    } else {
      // Возвращаем на место
      setSwipeOffset(0)
    }
  }

  const handleClick = () => {
    // 🆕 Используем window.location вместо navigate
    if (notification.type === 'chat' && notification.roomId) {
      window.location.href = `/room/${notification.roomId}/chat`
      removeNotification(notification.id)
    } else if (notification.type === 'event' && notification.roomId) {
      window.location.href = `/room/${notification.roomId}`
      removeNotification(notification.id)
    } else if (notification.type === 'reminder' && notification.roomId) {
      window.location.href = `/room/${notification.roomId}`
      removeNotification(notification.id)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      removeNotification(notification.id)
    }, 200)
  }

  const getBackgroundColor = () => {
    if (darkMode) {
      switch (notification.type) {
        case 'chat': return 'bg-gradient-to-r from-[#2d1b4e] to-[#4c1d95]'
        case 'event': return 'bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]'
        case 'reminder': return 'bg-gradient-to-r from-[#7c2d12] to-[#ea580c]'
        case 'error': return 'bg-gradient-to-r from-[#7f1d1d] to-[#dc2626]'
        case 'success': return 'bg-gradient-to-r from-[#14532d] to-[#16a34a]'
        default: return 'bg-gradient-to-r from-[#1a1a1e] to-[#2a2a30]'
      }
    } else {
      switch (notification.type) {
        case 'chat': return 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'
        case 'event': return 'bg-gradient-to-r from-[#1e40af] to-[#3b82f6]'
        case 'reminder': return 'bg-gradient-to-r from-[#c2410c] to-[#f97316]'
        case 'error': return 'bg-gradient-to-r from-[#dc2626] to-[#ef4444]'
        case 'success': return 'bg-gradient-to-r from-[#16a34a] to-[#22c55e]'
        default: return 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'
      }
    }
  }

  const transformStyle = {
    transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.01}deg)`,
    opacity: isClosing ? 0 : Math.max(0, 1 - swipeOffset / 150),
    transition: isSwiping ? 'none' : 'all 0.2s ease-out'
  }

  return (
    <div
      ref={toastRef}
      className={`mb-2 rounded-xl shadow-lg overflow-hidden cursor-pointer relative ${
        isClosing ? 'animate-slideOut' : ''
      }`}
      style={transformStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className={`px-4 py-3 flex items-center gap-3 text-white ${getBackgroundColor()}`}>
        <span className="text-xl">{notification.icon}</span>
        <span className="flex-1 text-sm font-medium">{notification.message}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Индикатор свайпа */}
      {swipeOffset > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 bg-white/20 flex items-center justify-center px-4"
          style={{ opacity: Math.min(swipeOffset / 50, 1) }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </div>
  )
}