import { forwardRef, useEffect, useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import PollMessage from './PollMessage'
import kotofonBg from '/images/kotofon.jpg'

const MessageList = forwardRef(({ 
  messages, 
  members, 
  currentUserIdStr, 
  darkMode,
  isLoadingMore,
  typingUsers,
  onScroll,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onMarkAsRead,
  isChatFocused,
  onVotePoll,
  onClosePoll,
  roomId
}, ref) => {
  const messagesEndRef = ref?.messagesEnd
  const containerRef = ref?.container
  const prevMessagesLengthRef = useRef(0)
  const isNearBottomRef = useRef(true)
  const initialScrollDoneRef = useRef(false)
  const isAutoScrollingRef = useRef(false)

  const checkIsNearBottom = useCallback(() => {
    const container = containerRef?.current
    if (!container) return true
    const threshold = 100
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }, [])

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    isAutoScrollingRef.current = true
    messagesEndRef?.current?.scrollIntoView({ behavior })
    setTimeout(() => { isAutoScrollingRef.current = false }, 500)
  }, [])

  const handleScroll = useCallback((e) => {
    if (!isAutoScrollingRef.current) {
      isNearBottomRef.current = checkIsNearBottom()
    }
    onScroll?.(e)
  }, [onScroll, checkIsNearBottom])

  useEffect(() => {
    const newMessagesCount = messages.length - prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    if (newMessagesCount > 0 && isNearBottomRef.current) {
      scrollToBottom('smooth')
    }
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    if (messages.length > 0 && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true
      setTimeout(() => scrollToBottom('instant'), 300)
    }
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    initialScrollDoneRef.current = false
    prevMessagesLengthRef.current = 0
    isNearBottomRef.current = true
  }, [roomId])

  const renderMessages = () => {
    return messages.map((msg, index) => {
      const msgUserId = String(msg.userId || msg.user_id)
      const isOwn = msgUserId === currentUserIdStr
      const sender = msg.user || members?.find(m => String(m.id) === msgUserId)
      
      const prevMsg = index > 0 ? messages[index - 1] : null
      const showAvatar = !isOwn && (!prevMsg || String(prevMsg.userId) !== msgUserId)
      const showName = !isOwn && showAvatar

      if (msg.poll) {
        return (
          <div key={msg.id || `poll-${index}`} className="mb-3">
            <PollMessage
              poll={msg.poll}
              isOwn={isOwn}
              darkMode={darkMode}
              onVote={onVotePoll}
              onClose={onClosePoll}
              isAdmin={isAdmin}
            />
          </div>
        )
      }

      return (
        <div key={msg.id || msg.tempId || index}>
          <MessageBubble
            message={msg}
            isOwn={isOwn}
            sender={sender}
            showAvatar={showAvatar}
            showName={showName}
            darkMode={darkMode}
            isAdmin={isAdmin}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            onMarkAsRead={onMarkAsRead}
            isChatFocused={isChatFocused}
            roomId={roomId}
          />
        </div>
      )
    })
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 relative chat-bg"
      style={{
        backgroundColor: darkMode ? '#0f0f13' : '#e5ded8',
        backgroundImage: `url("${kotofonBg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative z-10">
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {renderMessages()}
        
        {typingUsers && typingUsers.size > 0 && (
          <TypingIndicator typingUsers={typingUsers} members={members} darkMode={darkMode} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
})

MessageList.displayName = 'MessageList'

export default MessageList
