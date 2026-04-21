// C:\OSPanel\domains\karny\frontend\src\components\room\chat\hooks\useChatWebSocket.js

import { useState, useRef, useCallback } from 'react'

export function useChatWebSocket(roomId, currentUserId, onMessage, onSystemMessage, onTyping) {
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
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
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
        
        setTimeout(() => {
          if (roomId) {
            connect()
          }
        }, delay)
      }
    }

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    setWs(websocket)
  }, [roomId, currentUserId, onMessage, onSystemMessage, onTyping])

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close()
    }
  }, [ws])

  const sendMessage = useCallback((content) => {
    if (ws && ws.readyState === WebSocket.OPEN && content.trim()) {
      ws.send(JSON.stringify({
        type: 'message',
        content: content.trim()
      }))
      return true
    }
    return false
  }, [ws])

  const sendTyping = useCallback((isTyping) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        isTyping
      }))
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