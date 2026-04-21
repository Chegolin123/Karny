// C:\OSPanel\domains\karny\frontend\src\components\room\RoomChat.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import * as api from '../../api'
import MemberAvatar from './MemberAvatar'

export default function RoomChat({ roomId, members, darkMode }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const currentUserId = api.getCurrentUserId() // Оставляем как есть (число или строка)
  const currentUserIdStr = String(currentUserId) // Строковое представление для сравнения
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  console.log('🔑 Current user ID:', currentUserId, 'type:', typeof currentUserId)

  // Функция для нормализации сообщения (приведение userId к строке)
  const normalizeMessage = useCallback((msg) => {
    return {
      ...msg,
      userId: String(msg.userId || msg.user_id),
      user_id: String(msg.user_id || msg.userId)
    }
  }, [])

  // Функция для добавления нового сообщения
  const addMessage = useCallback((message) => {
    const normalizedMsg = normalizeMessage(message)
    setMessages(prev => {
      const exists = prev.some(m => 
        (m.id && m.id === normalizedMsg.id) || 
        (m.tempId && m.tempId === normalizedMsg.tempId)
      )
      if (exists) return prev
      return [...prev, normalizedMsg]
    })
  }, [normalizeMessage])

  // Прокрутка вниз
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  // Подключение WebSocket
  const connectWebSocket = useCallback(() => {
    if (!roomId || !currentUserId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    
    console.log(`🔌 Connecting to WebSocket: ${protocol}//${host}/chat?roomId=${roomId}&userId=${currentUserId}`)
    
    const websocket = new WebSocket(`${protocol}//${host}/chat?roomId=${roomId}&userId=${currentUserId}`)

    websocket.onopen = () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
      reconnectAttempts.current = 0
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 WebSocket message received:', data.type, 'userId:', data.userId)
        
        if (data.type === 'message') {
          addMessage(data)
          scrollToBottom()
        } else if (data.type === 'system') {
          addMessage(data)
          scrollToBottom()
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
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    websocket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected', event.code, event.reason)
      setConnected(false)
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
        
        setTimeout(() => {
          if (roomId) {
            connectWebSocket()
          }
        }, delay)
      }
    }

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    setWs(websocket)
  }, [roomId, currentUserId, currentUserIdStr, addMessage, scrollToBottom])

  // Загрузка истории сообщений
  const loadMessages = async (beforeId = null) => {
    try {
      setIsLoadingMore(true)
      const data = await api.getMessages(roomId, 30, beforeId)
      
      // Нормализуем все сообщения
      const normalizedMessages = data.messages.map(msg => normalizeMessage(msg))
      
      console.log('📥 Loaded messages:', normalizedMessages.length)
      normalizedMessages.forEach(msg => {
        console.log(`  - userId: ${msg.userId} (${typeof msg.userId}), isOwn: ${msg.userId === currentUserIdStr}`)
      })
      
      if (beforeId) {
        setMessages(prev => [...normalizedMessages, ...prev])
      } else {
        setMessages(normalizedMessages)
        scrollToBottom()
      }
      
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    console.log('📦 RoomChat mounted for room:', roomId)
    
    loadMessages()
    connectWebSocket()
    
    return () => {
      if (ws) {
        console.log('🔌 Closing WebSocket connection')
        ws.close()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId])

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network online, reconnecting...')
      if (!connected) {
        connectWebSocket()
      }
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [connected, connectWebSocket])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (container && container.scrollTop < 50 && hasMore && !isLoadingMore) {
      const firstMessage = messages[0]
      if (firstMessage && firstMessage.id) {
        loadMessages(firstMessage.id)
      }
    }
  }

  const sendMessage = () => {
    if (!ws && !connected) {
      console.warn('⚠️ WebSocket not connected, attempting to reconnect...')
      connectWebSocket()
      return
    }
    
    if (ws && ws.readyState === WebSocket.OPEN && newMessage.trim()) {
      const tempId = `temp_${Date.now()}_${Math.random()}`
      
      const optimisticMessage = normalizeMessage({
        tempId,
        roomId,
        userId: currentUserId,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        user: members.find(m => String(m.id) === currentUserIdStr) || {
          id: currentUserId,
          first_name: 'Вы',
          last_name: ''
        },
        pending: true
      })
      
      addMessage(optimisticMessage)
      
      ws.send(JSON.stringify({
        type: 'message',
        content: newMessage.trim()
      }))
      
      setNewMessage('')
      scrollToBottom()
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        isTyping: e.target.value.length > 0
      }))
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'typing',
            isTyping: false
          }))
        }
      }, 1000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypingText = () => {
    if (typingUsers.size === 0) return null
    
    const typingNames = Array.from(typingUsers)
      .map(id => members.find(m => String(m.id) === String(id))?.first_name)
      .filter(Boolean)
    
    if (typingNames.length === 0) return null
    if (typingNames.length === 1) return `${typingNames[0]} печатает...`
    if (typingNames.length === 2) return `${typingNames[0]} и ${typingNames[1]} печатают...`
    return `${typingNames.length} человека печатают...`
  }

  const renderMessages = () => {
    return messages.map((msg, index) => {
      if (msg.type === 'system') {
        return (
          <div key={`sys-${index}`} className="flex justify-center my-2">
            <span className={`text-xs px-3 py-1 rounded-full ${
              darkMode ? 'bg-[#2a2a30] text-gray-400' : 'bg-white/60 text-gray-500'
            }`}>
              {msg.content}
            </span>
          </div>
        )
      }
      
      // Используем нормализованный userId (строка)
      const msgUserId = String(msg.userId)
      const isOwn = msgUserId === currentUserIdStr
      const sender = msg.user || members.find(m => String(m.id) === msgUserId)
      
      const prevMsg = index > 0 ? messages[index - 1] : null
      const showAvatar = !isOwn && (!prevMsg || String(prevMsg.userId) !== msgUserId || prevMsg.type === 'system')
      const showName = !isOwn && showAvatar
      
      console.log(`🎨 Rendering message: userId=${msgUserId}, currentUserId=${currentUserIdStr}, isOwn=${isOwn}`)
      
      return (
        <div key={msg.id || msg.tempId || index}>
          {!isOwn && prevMsg && String(prevMsg.userId) !== msgUserId && prevMsg.type !== 'system' && (
            <div className="mb-3" />
          )}
          
          <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && (
              <div className="w-7 h-7 flex-shrink-0">
                {showAvatar && sender ? (
                  <MemberAvatar member={sender} size="sm" />
                ) : (
                  <div className="w-7 h-7" />
                )}
              </div>
            )}
            
            <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
              {showName && sender && (
                <span className={`text-xs ml-1 mb-1 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {sender.first_name} {sender.last_name || ''}
                </span>
              )}
              
              <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {isOwn && (
                  <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp || msg.created_at)}
                  </span>
                )}
                
                <div className={`px-3 py-2 rounded-2xl break-words ${
                  isOwn 
                    ? 'bg-[#6d28d9] text-white rounded-br-md' 
                    : darkMode 
                      ? 'bg-[#2a2a30] text-white rounded-bl-md' 
                      : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                } ${msg.pending ? 'opacity-70' : ''}`}>
                  {msg.content}
                  {msg.pending && (
                    <span className="ml-2 text-xs opacity-70">⏳</span>
                  )}
                </div>
                
                {!isOwn && (
                  <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp || msg.created_at)}
                  </span>
                )}
              </div>
            </div>
            
            {isOwn && <div className="w-7 h-7 flex-shrink-0" />}
          </div>
        </div>
      )
    })
  }

  return (
    <div className={`flex flex-col h-[500px] border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
      <div className={`px-4 py-2 border-b ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Чат комнаты
          </h3>
          <div className="flex items-center gap-2">
            {!connected && (
              <span className="text-xs text-yellow-500">Подключение...</span>
            )}
            {connected && (
              <span className="text-xs text-green-500">● Онлайн</span>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto p-4 space-y-1 ${
          darkMode ? 'bg-[#0f0f13]' : 'bg-[#e5ded8]'
        }`}
        style={{
          backgroundImage: darkMode 
            ? 'none' 
            : 'url(\'data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0L60 30L30 60L0 30z" fill="%23d4cbc3" opacity="0.05"/%3E%3C/svg%3E\')'
        }}
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {renderMessages()}
        
        {typingUsers.size > 0 && (
          <div className="flex justify-start mt-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7" />
              <div className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {getTypingText()}
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-3 border-t ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder={connected ? 'Сообщение' : 'Подключение...'}
            disabled={!connected}
            className={`flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:border-[#8b5cf6] transition-colors ${
              darkMode 
                ? 'bg-[#0f0f13] border-[#3f3f46] text-white placeholder-gray-500 disabled:opacity-50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 disabled:bg-gray-100'
            }`}
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !newMessage.trim()}
            className={`p-2.5 rounded-full transition-all ${
              connected && newMessage.trim()
                ? 'bg-[#6d28d9] text-white hover:bg-[#5b21b6] hover:scale-105' 
                : darkMode ? 'bg-[#2a2a30] text-gray-500' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}