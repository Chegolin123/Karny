// C:\OSPanel\domains\karny\frontend\src\components\common\PullToRefresh.jsx

import { useState, useRef, useEffect } from 'react'

export default function PullToRefresh({ onRefresh, children, loading = false }) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const startY = useRef(0)
  const containerRef = useRef(null)
  const threshold = 80 // Минимальное расстояние для срабатывания
  const maxPullDistance = 120 // Максимальное расстояние

  useEffect(() => {
    if (!loading && isRefreshing) {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [loading, isRefreshing])

  const handleTouchStart = (e) => {
    // Проверяем, что контейнер прокручен в самый верх
    const scrollTop = containerRef.current?.scrollTop || 0
    setIsAtTop(scrollTop <= 5)
    
    if (scrollTop <= 5) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling) return
    
    const container = containerRef.current
    const scrollTop = container?.scrollTop || 0
    
    // Если прокрутили вниз - отменяем pull
    if (scrollTop > 5) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    // Только свайп вниз (положительный diff)
    if (diff > 0) {
      e.preventDefault()
      
      // Применяем сопротивление (resistance)
      const resistance = 0.35
      const distance = Math.min(diff * resistance, maxPullDistance)
      setPullDistance(distance)
    } else {
      // Если свайп вверх - сбрасываем
      setPullDistance(0)
    }
  }

  const handleTouchEnd = () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold && !isRefreshing && !loading) {
      setIsRefreshing(true)
      onRefresh()
    }
    
    setPullDistance(0)
  }

  const progress = Math.min((pullDistance / threshold) * 100, 100)

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Индикатор Pull-to-Refresh */}
      <div 
        className="flex justify-center transition-all duration-200 ease-out"
        style={{ 
          transform: `translateY(${pullDistance * 0.5}px)`,
          opacity: Math.min(pullDistance / 30, 1)
        }}
      >
        <div className="py-2">
          {isRefreshing || loading ? (
            <div className="flex items-center gap-2 text-[#8b5cf6]">
              <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Обновление...</span>
            </div>
          ) : pullDistance > 10 ? (
            <div className="flex items-center gap-2">
              <svg 
                className="w-4 h-4 text-gray-400 transition-all"
                style={{ 
                  transform: `rotate(${Math.min(progress * 1.8, 180)}deg)`,
                  opacity: Math.min(progress / 50, 1)
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs text-gray-400">
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