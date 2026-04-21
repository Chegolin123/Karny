// C:\OSPanel\domains\karny\frontend\src\components\room\chat\MessageList.jsx

import { forwardRef, useEffect } from 'react'
import SystemMessage from './SystemMessage'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

// Импортируем изображение напрямую
import kotofonBg from '/images/kotofon.jpg'

const MessageList = forwardRef(({ 
  messages, 
  members, 
  currentUserIdStr, 
  darkMode,
  isLoadingMore,
  typingUsers,
  onScroll 
}, ref) => {
  const messagesEndRef = ref?.messagesEnd
  const containerRef = ref?.container

  useEffect(() => {
    console.log('🖼️ kotofonBg path:', kotofonBg)
    
    const testImg = new Image()
    testImg.src = kotofonBg
    testImg.onload = () => console.log('✅ Изображение успешно загружено:', kotofonBg)
    testImg.onerror = () => console.error('❌ Ошибка загрузки изображения:', kotofonBg)
  }, [])

  const renderMessages = () => {
    return messages.map((msg, index) => {
      if (msg.type === 'system') {
        return <SystemMessage key={`sys-${index}`} content={msg.content} darkMode={darkMode} />
      }
      
      const msgUserId = String(msg.userId)
      const isOwn = msgUserId === currentUserIdStr
      const sender = msg.user || members.find(m => String(m.id) === msgUserId)
      
      const prevMsg = index > 0 ? messages[index - 1] : null
      const showAvatar = !isOwn && (!prevMsg || String(prevMsg.userId) !== msgUserId || prevMsg.type === 'system')
      const showName = !isOwn && showAvatar
      
      return (
        <div key={msg.id || msg.tempId || index}>
          {!isOwn && prevMsg && String(prevMsg.userId) !== msgUserId && prevMsg.type !== 'system' && (
            <div className="mb-3" />
          )}
          
          <MessageBubble
            message={msg}
            isOwn={isOwn}
            sender={sender}
            showAvatar={showAvatar}
            showName={showName}
            darkMode={darkMode}
          />
        </div>
      )
    })
  }

  // Единый фон для обеих тем
  const containerStyle = {
    backgroundColor: darkMode ? '#0f0f13' : '#e5ded8',
    backgroundImage: `url("${kotofonBg}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll'
  }

  // Стили для контента
  const contentStyle = {
    position: 'relative',
    zIndex: 10
  }

  console.log('🎨 darkMode:', darkMode)
  console.log('🎨 containerStyle:', containerStyle)

  return (
    <div 
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 relative scrollbar-hide"
      style={containerStyle}
    >
      {/* Контент напрямую, без оверлея */}
      <div style={contentStyle}>
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {renderMessages()}
        
        <TypingIndicator typingUsers={typingUsers} members={members} darkMode={darkMode} />
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
})

MessageList.displayName = 'MessageList'

export default MessageList