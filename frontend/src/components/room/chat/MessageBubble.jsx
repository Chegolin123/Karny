// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MessageBubble.jsx

import { useState, useRef, useCallback } from 'react'
import MemberAvatar from '../MemberAvatar'
import MessageContextMenu from './MessageContextMenu'

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  sender, 
  showAvatar, 
  showName,
  darkMode,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onMarkAsRead,
  roomId
}) {
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  
  // Для долгого нажатия на мобильных
  const longPressTimer = useRef(null)
  const touchStartPos = useRef({ x: 0, y: 0 })

  // Обработчик контекстного меню (десктоп)
  const handleContextMenu = (e) => {
    e.preventDefault()
    openContextMenu(e.clientX, e.clientY)
  }

  // Открытие контекстного меню
  const openContextMenu = (x, y) => {
    setContextMenu({
      show: true,
      x,
      y
    })
  }

  // Обработчики для мобильных (долгое нажатие)
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    startX.current = touch.clientX
    setIsSwiping(true)
    
    // Запускаем таймер для долгого нажатия
    longPressTimer.current = setTimeout(() => {
      openContextMenu(touchStartPos.current.x, touchStartPos.current.y)
      setIsSwiping(false)
      setSwipeOffset(0)
    }, 500) // 500ms для долгого нажатия
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return
    
    // Отменяем долгое нажатие при движении
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    const touch = e.touches[0]
    const diff = touch.clientX - startX.current
    
    // Только свайп вправо для ответа
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 80))
    }
  }, [isSwiping])

  const handleTouchEnd = useCallback(() => {
    // Отменяем таймер долгого нажатия
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    setIsSwiping(false)
    
    // Если был достаточный свайп — ответить
    if (swipeOffset > 50 && onReply) {
      onReply(message)
    }
    
    setSwipeOffset(0)
  }, [swipeOffset, onReply, message])

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (editContent.trim() && editContent !== message.content && onEdit) {
      onEdit(message, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditContent(message.content)
    }
  }

  const transformStyle = {
    transform: `translateX(${swipeOffset}px)`,
    transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
  }

  const getMessageStatus = () => {
    if (!isOwn) return null
    
    if (message.tempId) {
      return (
        <span className="text-gray-400 text-[10px] flex items-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )
    }
    
    if (message.read_count > 0) {
      return (
        <span className="text-green-500 text-[10px] flex items-center">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <svg className="w-3.5 h-3.5 -ml-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        </span>
      )
    }
    
    return (
      <span className="text-gray-400 text-[10px] flex items-center">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </span>
    )
  }

  return (
    <>
      <div 
        className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} group relative select-none`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
          setIsSwiping(false)
          setSwipeOffset(0)
        }}
        style={transformStyle}
      >
        {!isOwn && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar && sender ? (
              <MemberAvatar member={sender} size="md" />
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}
        
        <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
          {showName && sender && (
            <span className={`text-xs ml-1 mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {sender.first_name}
            </span>
          )}
          
          {message.reply_to_content && (
            <div className={`text-xs mb-1 px-2 py-1.5 rounded-lg border-l-2 ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#8b5cf6] text-gray-400' 
                : 'bg-gray-100 border-[#8b5cf6] text-gray-600'
            }`}>
              <span className="font-medium">{message.reply_to_first_name}:</span> {message.reply_to_content}
            </div>
          )}
          
          <div className={`flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`px-3 py-2 rounded-xl text-sm outline-none ${
                    darkMode 
                      ? 'bg-[#2a2a30] text-white border border-[#3f3f46]' 
                      : 'bg-white text-gray-900 border border-gray-300'
                  }`}
                  autoFocus
                />
                <button type="submit" className="text-[#8b5cf6] text-lg">✓</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }}
                  className="text-gray-500 text-lg"
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                {isOwn && (
                  <div className="flex items-center gap-1">
                    {getMessageStatus()}
                    <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatTime(message.created_at || message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div className={`relative px-3.5 py-2.5 rounded-2xl break-words ${
                  isOwn 
                    ? 'bg-[#6d28d9] text-white rounded-br-md' 
                    : darkMode 
                      ? 'bg-[#2a2a30] text-white rounded-bl-md' 
                      : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                }`}>
                  {message.is_pinned && (
                    <div className="absolute -top-1.5 -left-1.5">
                      <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                  )}
                  
                  <span className="text-[15px] leading-relaxed">{message.content}</span>
                  
                  {message.is_edited && (
                    <span className={`ml-1.5 text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                      ред.
                    </span>
                  )}
                </div>
                
                {!isOwn && (
                  <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(message.created_at || message.timestamp)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {isOwn && <div className="w-8 h-8 flex-shrink-0" />}
        
        {/* Индикатор свайпа */}
        {swipeOffset > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 flex items-center px-2 pointer-events-none"
            style={{ opacity: Math.min(swipeOffset / 30, 1) }}
          >
            <div className={`p-2 rounded-full ${darkMode ? 'bg-[#8b5cf6]' : 'bg-[#6d28d9]'}`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <MessageContextMenu
        show={contextMenu.show}
        x={contextMenu.x}
        y={contextMenu.y}
        message={message}
        isOwn={isOwn}
        isAdmin={isAdmin}
        onClose={() => setContextMenu({ show: false, x: 0, y: 0 })}
        onReply={(msg) => onReply && onReply(msg)}
        onEdit={(msg) => {
          setIsEditing(true)
          setEditContent(msg.content)
        }}
        onDelete={onDelete}
        onPin={onPin}
        darkMode={darkMode}
      />
    </>
  )
}