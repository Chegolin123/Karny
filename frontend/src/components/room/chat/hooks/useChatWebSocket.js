// C:\OSPanel\domains\karny\frontend\src\components\room\chat\hooks\useChatWebSocket.js

import { useState, useRef, useCallback, useEffect } from 'react'

export function useChatWebSocket(roomId, currentUserId, onMessage, onSystemMessage, onTyping) {
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)

  const connect = useCallback(() => {
    // Очищаем предыдущий таймаут
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Проверяем, что компонент всё ещё смонтирован
    if (!isMountedRef.current) return

    // Проверяем, что есть roomId и userId
    if (!roomId || !currentUserId) {
      console.warn('⚠️ Нет roomId или userId для подключения')
      return
    }

    // Проверяем, не превышено ли количество попыток
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn('⚠️ Превышено максимальное количество попыток подключения')
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    
    console.log(`🔌 Connecting to WebSocket: ${protocol}//${host}/chat?roomId=${roomId}&userId=${currentUserId}`)
    
    try {
      const websocket = new WebSocket(`${protocol}//${host}/chat?roomId=${roomId}&userId=${currentUserId}`)

      websocket.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnected(true)
        reconnectAttempts.current = 0
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'message') {
            onMessage?.(data)
          } else if (data.type === 'system') {
            onSystemMessage?.(data)
          } else if (data.type === 'typing') {
            onTyping?.(data)
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      websocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason)
        setConnected(false)
        setWs(null)
        
        // Не переподключаемся если:
        // 1. Компонент размонтирован
        // 2. Нет roomId
        // 3. Код закрытия 1000 (нормальное закрытие)
        // 4. Код закрытия 1008 (ошибка авторизации)
        if (!isMountedRef.current || !roomId) {
          return
        }
        
        // Не переподключаемся при нормальном закрытии или ошибке авторизации
        if (event.code === 1000 || event.code === 1008) {
          console.log('⏹️ Не переподключаемся, код:', event.code)
          return
        }
        
        // Пытаемся переподключиться с задержкой
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && roomId) {
              connect()
            }
          }, delay)
        } else {
          console.warn('⚠️ Достигнут лимит попыток переподключения')
        }
      }

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        // Не меняем состояние connected, ждём onclose
      }

      setWs(websocket)
    } catch (error) {
      console.error('❌ WebSocket creation error:', error)
      setConnected(false)
      setWs(null)
      
      // Пробуем переподключиться при ошибке создания
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && roomId) {
            connect()
          }
        }, delay)
      }
    }
  }, [roomId, currentUserId, onMessage, onSystemMessage, onTyping])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (ws) {
      ws.close(1000, 'Normal closure')
      setWs(null)
    }
    setConnected(false)
    reconnectAttempts.current = 0
  }, [ws])

  const sendMessage = useCallback((content) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket не готов для отправки')
      return false
    }
    
    try {
      ws.send(JSON.stringify({
        type: 'message',
        content: content.trim()
      }))
      return true
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error)
      return false
    }
  }, [ws])

  const sendTyping = useCallback((isTyping) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }
    
    try {
      ws.send(JSON.stringify({
        type: 'typing',
        isTyping
      }))
    } catch (error) {
      console.error('❌ Ошибка отправки статуса печати:', error)
    }
  }, [ws])

  // Очистка при размонтировании
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (ws) {
        ws.close(1000, 'Component unmounted')
      }
    }
  }, [ws])

  return {
    ws,
    connected,
    connect,
    disconnect,
    sendMessage,
    sendTyping
  }
}