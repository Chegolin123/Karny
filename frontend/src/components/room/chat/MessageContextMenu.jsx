// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MessageContextMenu.jsx

import { useState, useRef, useEffect } from 'react'

export default function MessageContextMenu({ 
  show, 
  x, 
  y, 
  message, 
  isOwn, 
  isAdmin,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onPin,
  darkMode 
}) {
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    
    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
      calculatePosition()
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [show, onClose])

  const calculatePosition = () => {
    if (!menuRef.current) return
    
    const menuWidth = 200
    const menuHeight = 250
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    let newX = x
    let newY = y
    
    if (x + menuWidth > windowWidth) {
      newX = windowWidth - menuWidth - 10
    }
    
    if (y + menuHeight > windowHeight) {
      newY = windowHeight - menuHeight - 10
    }
    
    newX = Math.max(10, newX)
    newY = Math.max(10, newY)
    
    setPosition({ x: newX, y: newY })
  }

  if (!show) return null

  const menuStyle = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 1000
  }

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className={`rounded-xl shadow-xl border overflow-hidden min-w-[180px] ${
        darkMode ? 'bg-[#1a1a1e] border-[#2a2a30]' : 'bg-white border-gray-200'
      }`}
    >
      {/* Ответить */}
      <button
        onClick={() => { onReply(message); onClose() }}
        className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
          darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Ответить
      </button>
      
      {/* Копировать текст */}
      <button
        onClick={() => {
          navigator.clipboard?.writeText(message.content)
          onClose()
        }}
        className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
          darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Копировать
      </button>
      
      {/* Редактировать (только свои) */}
      {isOwn && (
        <button
          onClick={() => { onEdit(message); onClose() }}
          className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
            darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Редактировать
        </button>
      )}
      
      {/* Закрепить (только админ) */}
      {isAdmin && (
        <button
          onClick={() => { onPin(message); onClose() }}
          className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
            darkMode ? 'hover:bg-[#2a2a30] text-gray-300' : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {message.is_pinned ? 'Открепить' : 'Закрепить'}
        </button>
      )}
      
      {/* Удалить (свои или админ) */}
      {(isOwn || isAdmin) && (
        <>
          <div className={`border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'}`} />
          <button
            onClick={() => { onDelete(message); onClose() }}
            className={`w-full px-4 py-3 text-sm text-left flex items-center gap-3 transition-colors ${
              darkMode ? 'hover:bg-[#2a2a30] text-red-400' : 'hover:bg-gray-50 text-red-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Удалить
          </button>
        </>
      )}
    </div>
  )
}