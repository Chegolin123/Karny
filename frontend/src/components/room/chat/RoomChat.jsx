// C:\OSPanel\domains\karny\frontend\src\components\room\chat\RoomChat.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import * as api from '../../../api'
import { useChatWebSocket } from './hooks/useChatWebSocket'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function RoomChat({ roomId, members, darkMode, autoScrollToBottom = false }) {
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  
  const currentUserId = api.getCurrentUserId()
  const currentUserIdStr = String(currentUserId)

  // Нормализация сообщения
  const normalizeMessage = useCallback((msg) => ({
    ...msg,
    userId: String(msg.userId || msg.user_id),
    user_id: String(msg.user_id || msg.userId)
  }), [])

  // Добавление сообщения
  const addMessage = useCallback((message) => {
    const normalizedMsg = normalizeMessage(message)
    
    setMessages(prev => {
      if (normalizedMsg.id && !normalizedMsg.tempId) {
        const exists = prev.some(m => m.id === normalizedMsg.id)
        if (exists) {
          console.log('📌 Сообщение уже существует, пропускаем:', normalizedMsg.id)
          return prev
        }
      }
      
      if (normalizedMsg.tempId) {
        console.log('📝 Добавляем временное сообщение:', normalizedMsg.tempId)
        return [...prev, normalizedMsg]
      }
      
      const hasTemp = prev.some(m => m.tempId)
      if (hasTemp && normalizedMsg.userId === currentUserIdStr) {
        const updated = prev.map(m => {
          if (m.tempId && m.userId === currentUserIdStr && m.content === normalizedMsg.content) {
            console.log('🔄 Заменяем временное сообщение на подтверждённое:', m.tempId, '→', normalizedMsg.id)
            return { ...normalizedMsg, tempId: undefined }
          }
          return m
        })
        return updated
      }
      
      console.log('➕ Добавляем новое сообщение:', normalizedMsg.id)
      return [...prev, normalizedMsg]
    })
  }, [normalizeMessage, currentUserIdStr])

  // Плавная прокрутка вниз (для отправки сообщений)
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  // Мгновенная прокрутка вниз без анимации (для первой загрузки)
  const instantScrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  // Обработчики WebSocket
  const handleMessage = useCallback((data) => {
    console.log('📨 Новое сообщение получено:', data)
    addMessage(data)
    if (!isInitialLoad) {
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom, isInitialLoad])

  const handleSystemMessage = useCallback((data) => {
    console.log('📢 Системное сообщение:', data)
    addMessage(data)
    if (!isInitialLoad) {
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom, isInitialLoad])

  const handleTyping = useCallback((data) => {
    if (data.isTyping && String(data.userId) !== currentUserIdStr) {
      setTypingUsers(prev => new Set(prev).add(data.userId))
    } else {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    }
  }, [currentUserIdStr])

  // WebSocket хук
  const { connected, connect, sendMessage, sendTyping } = useChatWebSocket(
    roomId, 
    currentUserId, 
    handleMessage, 
    handleSystemMessage, 
    handleTyping
  )

  // Загрузка истории
  const loadMessages = async (beforeId = null) => {
    try {
      setIsLoadingMore(true)
      const data = await api.getMessages(roomId, 30, beforeId)
      const normalizedMessages = data.messages.map(msg => normalizeMessage(msg))
      
      if (beforeId) {
        setMessages(prev => [...normalizedMessages, ...prev])
      } else {
        setMessages(normalizedMessages)
        setIsInitialLoad(false)
        
        // Мгновенный скролл вниз без анимации
        if (autoScrollToBottom) {
          // Используем requestAnimationFrame для гарантии, что DOM обновлён
          requestAnimationFrame(() => {
            instantScrollToBottom()
          })
        }
      }
      
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Обработка скролла для подгрузки
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (container && container.scrollTop < 50 && hasMore && !isLoadingMore) {
      const firstMessage = messages[0]
      if (firstMessage && firstMessage.id && !firstMessage.tempId) {
        loadMessages(firstMessage.id)
      }
    }
  }

  // Отправка сообщения
  const handleSendMessage = useCallback((content) => {
    if (!connected) {
      console.warn('⚠️ Нет подключения к чату')
      return false
    }
    
    const tempId = `temp_${Date.now()}_${Math.random()}`
    
    const optimisticMessage = normalizeMessage({
      tempId: tempId,
      roomId,
      userId: currentUserId,
      content: content,
      timestamp: new Date().toISOString(),
      user: members.find(m => String(m.id) === currentUserIdStr) || {
        id: currentUserId,
        first_name: 'Вы',
        last_name: ''
      }
    })
    
    addMessage(optimisticMessage)
    scrollToBottom()
    
    const sent = sendMessage(content)
    
    return sent
  }, [connected, currentUserId, currentUserIdStr, members, roomId, normalizeMessage, addMessage, scrollToBottom, sendMessage])

  // Инициализация
  useEffect(() => {
    setIsInitialLoad(true)
    loadMessages()
    connect()
  }, [roomId])

  // Переподключение при онлайне
  useEffect(() => {
    const handleOnline = () => {
      if (!connected) connect()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [connected, connect])

  return (
    <div className={`flex flex-col h-full border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
      <ChatHeader connected={connected} darkMode={darkMode} />
      
      <MessageList
        ref={{
          container: messagesContainerRef,
          messagesEnd: messagesEndRef
        }}
        messages={messages}
        members={members}
        currentUserIdStr={currentUserIdStr}
        darkMode={darkMode}
        isLoadingMore={isLoadingMore}
        typingUsers={typingUsers}
        onScroll={handleScroll}
      />
      
      <MessageInput
        connected={connected}
        darkMode={darkMode}
        onSendMessage={handleSendMessage}
        onTyping={sendTyping}
      />
    </div>
  )
}