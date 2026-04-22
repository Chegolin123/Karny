// C:\OSPanel\domains\karny\frontend\src\components\room\chat\RoomChat.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import * as api from '../../../api'
import { useChatWebSocket } from './hooks/useChatWebSocket'
import { useNotification } from '../../../contexts/NotificationContext'
import ChatHeader from './ChatHeader'
import PinnedMessages from './PinnedMessages'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function RoomChat({ roomId, members, darkMode, autoScrollToBottom = false, hideHeader = false }) {
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isChatFocused, setIsChatFocused] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMember, setIsMember] = useState(true)
  const [accessError, setAccessError] = useState(null)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  
  const currentUserId = api.getCurrentUserId()
  const currentUserIdStr = String(currentUserId)
  
  const { notifyChatMessage } = useNotification()

  const roomName = members?.length > 0 ? 'Комната' : 'Чат'
  
  const pinnedMessages = messages.filter(msg => msg.is_pinned)

  useEffect(() => {
    const handleFocus = () => setIsChatFocused(true)
    const handleBlur = () => setIsChatFocused(false)
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    const handleVisibilityChange = () => {
      setIsChatFocused(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const data = await api.getRoom(roomId)
        const ownerId = data.room?.owner_id
        setIsAdmin(ownerId == currentUserId)
      } catch (err) {
        console.error('Ошибка проверки админа:', err)
      }
    }
    if (roomId && currentUserId) checkAdmin()
  }, [roomId, currentUserId])

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const data = await api.getRoom(roomId)
        const member = data.members?.find(m => m.id == currentUserId)
        const isOwner = data.room?.owner_id == currentUserId
        
        if (!member && !isOwner) {
          setIsMember(false)
          setAccessError('У вас нет доступа к этому чату. Вступите в комнату чтобы общаться.')
        } else {
          setIsMember(true)
          setAccessError(null)
        }
      } catch (err) {
        console.error('Ошибка проверки участия:', err)
        if (err.message?.includes('Вы не участник') || err.message?.includes('403')) {
          setIsMember(false)
          setAccessError('У вас нет доступа к этому чату. Вступите в комнату чтобы общаться.')
        }
      }
    }
    
    if (roomId && currentUserId) {
      checkMembership()
    }
  }, [roomId, currentUserId])

  const normalizeMessage = useCallback((msg) => ({
    ...msg,
    userId: String(msg.userId || msg.user_id),
    user_id: String(msg.user_id || msg.userId)
  }), [])

  const addMessage = useCallback((message) => {
    const normalizedMsg = normalizeMessage(message)
    
    setMessages(prev => {
      if (normalizedMsg.id) {
        const exists = prev.some(m => m.id === normalizedMsg.id)
        if (exists) {
          return prev
        }
      }
      
      if (normalizedMsg.tempId) {
        return [...prev, normalizedMsg]
      }
      
      const hasTemp = prev.some(m => m.tempId)
      if (hasTemp && normalizedMsg.userId === currentUserIdStr) {
        const updated = prev.map(m => {
          if (m.tempId && m.userId === currentUserIdStr && m.content === normalizedMsg.content) {
            return { ...normalizedMsg, tempId: undefined }
          }
          return m
        })
        return updated
      }
      
      const newMessages = [...prev, normalizedMsg]
      return newMessages.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
      })
    })
  }, [normalizeMessage, currentUserIdStr])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  const instantScrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'message') {
      addMessage(data)
      if (!isInitialLoad) scrollToBottom()
      
      if (String(data.userId) !== currentUserIdStr && !isChatFocused) {
        notifyChatMessage(roomId, roomName, 1)
      }
    } else if (data.type === 'message_edited') {
      setMessages(prev => prev.map(m => 
        m.id === data.messageId 
          ? { ...m, content: data.content, is_edited: true, edited_at: data.edited_at }
          : m
      ))
    } else if (data.type === 'message_deleted') {
      setMessages(prev => prev.filter(m => m.id !== data.messageId))
    } else if (data.type === 'message_pinned') {
      setMessages(prev => {
        const updated = prev.map(m =>
          m.id === data.messageId
            ? { ...m, is_pinned: data.is_pinned }
            : m
        )
        
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at) - new Date(a.created_at)
        })
      })
    } else if (data.type === 'message_read') {
      setMessages(prev => prev.map(m =>
        m.id === data.messageId
          ? { ...m, read_count: data.read_count }
          : m
      ))
    } else if (data.type === 'typing') {
      if (data.isTyping && String(data.userId) !== currentUserIdStr) {
        setTypingUsers(prev => new Set(prev).add(data.userId))
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    }
  }, [addMessage, scrollToBottom, isInitialLoad, currentUserIdStr, roomId, roomName, isChatFocused, notifyChatMessage])

  const { connected, connect, sendMessage, sendTyping, ws } = useChatWebSocket(
    roomId, 
    currentUserId, 
    handleWebSocketMessage,
    () => {},
    () => {}
  )

  const loadMessages = async (beforeId = null) => {
    if (!isMember) {
      return
    }
    
    try {
      setIsLoadingMore(true)
      const data = await api.getMessages(roomId, 30, beforeId)
      const normalizedMessages = data.messages.map(msg => normalizeMessage(msg))
      
      if (beforeId) {
        setMessages(prev => [...normalizedMessages, ...prev])
      } else {
        const sorted = normalizedMessages.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at) - new Date(a.created_at)
        })
        setMessages(sorted)
        setHistoryLoaded(true)
        setIsInitialLoad(false)
        
        if (autoScrollToBottom) {
          requestAnimationFrame(() => instantScrollToBottom())
        }
      }
      
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err)
      if (err.message?.includes('Вы не участник') || err.message?.includes('403')) {
        setAccessError('У вас нет доступа к этому чату. Вступите в комнату чтобы общаться.')
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (container && container.scrollTop < 50 && hasMore && !isLoadingMore) {
      const firstMessage = messages.filter(m => !m.is_pinned)[0]
      if (firstMessage && firstMessage.id && !firstMessage.tempId) {
        loadMessages(firstMessage.id)
      }
    }
  }

  const handleReply = (message) => {
    setReplyTo(message)
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  const handleEditMessage = (message, newContent) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'edit_message',
        messageId: message.id,
        content: newContent
      }))
    }
  }

  const handleDeleteMessage = (message) => {
    if (!confirm('Удалить сообщение?')) return
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'delete_message',
        messageId: message.id
      }))
    }
  }

  const handlePinMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'pin_message',
        messageId: message.id
      }))
    }
  }

  const handleSendMessage = useCallback((content, replyToId = null) => {
    if (!connected) {
      return false
    }
    
    const tempId = `temp_${Date.now()}_${Math.random()}`
    
    const optimisticMessage = normalizeMessage({
      tempId,
      roomId,
      userId: currentUserId,
      content,
      reply_to_id: replyToId,
      timestamp: new Date().toISOString(),
      user: members?.find(m => String(m.id) === currentUserIdStr) || {
        id: currentUserId,
        first_name: 'Вы',
        last_name: ''
      },
      is_pinned: false
    })
    
    addMessage(optimisticMessage)
    scrollToBottom()
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        content,
        reply_to_id: replyToId
      }))
    }
    
    if (replyToId) setReplyTo(null)
    
    return true
  }, [connected, currentUserId, currentUserIdStr, members, roomId, normalizeMessage, addMessage, scrollToBottom, ws])

  const handleMarkAsRead = useCallback((messageId) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'mark_read',
        messageId
      }))
    }
  }, [ws])

  useEffect(() => {
    setIsInitialLoad(true)
    setHistoryLoaded(false)
    setMessages([])
    setReplyTo(null)
    
    if (isMember) {
      loadMessages()
      connect()
    }
  }, [roomId, isMember])

  useEffect(() => {
    const handleOnline = () => {
      if (!connected && isMember) connect()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [connected, connect, isMember])

  if (!members) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Загрузка участников...</div>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className={`flex flex-col h-full border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
        {!hideHeader && (
          <ChatHeader connected={false} darkMode={darkMode} roomId={roomId} />
        )}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className={`text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              🔒
            </div>
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Нет доступа к чату
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {accessError || 'Вступите в комнату чтобы общаться с участниками.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
      {!hideHeader && (
        <ChatHeader connected={connected} darkMode={darkMode} roomId={roomId} />
      )}
      
      <PinnedMessages
        messages={pinnedMessages}
        members={members}
        currentUserIdStr={currentUserIdStr}
        darkMode={darkMode}
        onUnpin={handlePinMessage}
        isAdmin={isAdmin}
        onReply={handleReply}
      />
      
      <MessageList
        ref={{
          container: messagesContainerRef,
          messagesEnd: messagesEndRef
        }}
        messages={messages.filter(m => !m.is_pinned)}
        members={members}
        currentUserIdStr={currentUserIdStr}
        darkMode={darkMode}
        isLoadingMore={isLoadingMore}
        typingUsers={typingUsers}
        onScroll={handleScroll}
        isAdmin={isAdmin}
        onReply={handleReply}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onPin={handlePinMessage}
        onMarkAsRead={handleMarkAsRead}
        roomId={roomId}
      />
      
      <MessageInput
        connected={connected}
        darkMode={darkMode}
        onSendMessage={handleSendMessage}
        onTyping={sendTyping}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  )
}