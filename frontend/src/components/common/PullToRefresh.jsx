// C:\OSPanel\domains\karny\frontend\src\components\common\PullToRefresh.jsx

import { useState, useRef, useEffect } from 'react'

export default function PullToRefresh({ onRefresh, children, loading = false }) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef(null)
  const threshold = 80

  useEffect(() => {
    if (!loading && isRefreshing) {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [loading, isRefreshing])

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    setIsPulling(true)
  }

  const handleTouchMove = (e) => {
    if (!isPulling || containerRef.current?.scrollTop > 0) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    if (diff > 0) {
      e.preventDefault()
      const distance = Math.min(diff * 0.4, threshold * 1.5)
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      onRefresh()
    }
    
    setPullDistance(0)
  }

  const progress = Math.min((pullDistance / threshold) * 100, 100)

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex justify-center transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <div className="py-2">
          {isRefreshing ? (
            <div className="flex items-center gap-2 text-[#8b5cf6]">
              <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Обновление...</span>
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex items-center gap-2 text-gray-400">
              <svg 
                className="w-4 h-4 transition-transform" 
                style={{ transform: `rotate(${progress * 1.8}deg)` }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">
                {pullDistance >= threshold ? 'Отпустите для обновления' : 'Тяните для обновления'}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      
      {children}
    </div>
  )
}