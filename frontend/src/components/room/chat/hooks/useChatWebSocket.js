import { useState, useRef, useCallback, useEffect } from 'react'

export function useChatWebSocket(roomId, currentUserId, onMessage, onSystemMessage, onTyping) {
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef(null)
  const pingIntervalRef = useRef(null)
  const isMountedRef = useRef(true)

  const connect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (!isMountedRef.current) return

    if (!roomId || !currentUserId) {
      console.warn('⚠️ Нет roomId или userId для подключения')
      return
    }

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
        
        // Запускаем пинг каждые 15 секунд
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'ping' }))
          }
        }, 15000)
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Игнорируем понг-ответы
          if (data.type === 'pong') return
          
          switch (data.type) {
            case 'message':
            case 'message_edited':
            case 'message_deleted':
            case 'message_pinned':
            case 'message_read':
              onMessage?.(data)
              break
            case 'system':
              onSystemMessage?.(data)
              break
            case 'typing':
              onTyping?.(data)
              break
            default:
              onMessage?.(data)
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      websocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason)
        setConnected(false)
        setWs(null)
        
        // Очищаем пинг-интервал
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        if (!isMountedRef.current || !roomId) return
        
        if (event.code === 1000 || event.code === 1008) {
          console.log('⏹️ Не переподключаемся, код:', event.code)
          return
        }
        
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
      }

      setWs(websocket)
    } catch (error) {
      console.error('❌ WebSocket creation error:', error)
      setConnected(false)
      setWs(null)
      
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
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    if (ws) {
      ws.close(1000, 'Normal closure')
      setWs(null)
    }
    setConnected(false)
    reconnectAttempts.current = 0
  }, [ws])

  const sendMessage = useCallback((content, replyToId = null) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket не готов для отправки')
      return false
    }
    
    try {
      ws.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        reply_to_id: replyToId
      }))
      return true
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error)
      return false
    }
  }, [ws])

  const editMessage = useCallback((messageId, content) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify({ type: 'edit_message', messageId, content: content.trim() }))
      return true
    } catch (error) { console.error('❌ Ошибка редактирования:', error); return false }
  }, [ws])

  const deleteMessage = useCallback((messageId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify({ type: 'delete_message', messageId }))
      return true
    } catch (error) { console.error('❌ Ошибка удаления:', error); return false }
  }, [ws])

  const pinMessage = useCallback((messageId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify({ type: 'pin_message', messageId }))
      return true
    } catch (error) { console.error('❌ Ошибка закрепления:', error); return false }
  }, [ws])

  const markAsRead = useCallback((messageId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify({ type: 'mark_read', messageId }))
      return true
    } catch (error) { console.error('❌ Ошибка отметки:', error); return false }
  }, [ws])

  const sendTyping = useCallback((isTyping) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    try { ws.send(JSON.stringify({ type: 'typing', isTyping })) }
    catch (error) { console.error('❌ Ошибка typing:', error) }
  }, [ws])

  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (ws) ws.close(1000, 'Component unmounted')
    }
  }, [ws])

  return {
    ws, connected, connect, disconnect,
    sendMessage, editMessage, deleteMessage, pinMessage, markAsRead, sendTyping
  }
}
