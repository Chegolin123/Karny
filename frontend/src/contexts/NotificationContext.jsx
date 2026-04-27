import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import * as api from '../api'

const NotificationContext = createContext()

export function useNotification() {
  return useContext(NotificationContext)
}

// Типы уведомлений
export const NotificationType = {
  EVENT_NEW: 'event_new',
  EVENT_REMINDER: 'event_reminder',
  EVENT_STARTED: 'event_started',
  CHAT_MESSAGE: 'chat_message',
  VIDEO_SESSION_STARTED: 'video_session_started',
  VIDEO_SESSION_EARLY: 'video_session_early',
  VIDEO_SESSION_ENDED: 'video_session_ended',
  CASE_DROPPED: 'case_dropped',
  ITEM_ACQUIRED: 'item_acquired',
  SYSTEM: 'system',
  ERROR: 'error',
  SUCCESS: 'success',
  JOINED_ROOM: 'joined_room'
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const wsRef = useRef(null)
  const currentUserId = api.getCurrentUserId()

  // Подключаем WebSocket для уведомлений
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/chat?userId=${currentUserId}`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'event_created':
            addNotification({
              type: NotificationType.EVENT_NEW,
              message: `🆕 Новое событие «${data.eventName}»`,
              roomId: data.roomId,
              eventId: data.eventId,
              icon: '📅'
            })
            break
          case 'video_session_started':
            addNotification({
              type: data.early ? NotificationType.VIDEO_SESSION_EARLY : NotificationType.VIDEO_SESSION_STARTED,
              message: data.early 
                ? `🎬 Просмотр начинается досрочно!`
                : `🎬 Просмотр «${data.eventName}» начался!`,
              roomId: data.roomId,
              eventId: data.eventId,
              icon: '🎬'
            })
            break
        }
      } catch (error) {
        console.error('Ошибка WebSocket уведомлений:', error)
      }
    }
    
    wsRef.current = ws
    
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [currentUserId])

  const addNotification = useCallback(({ type, message, roomId, eventId, icon, duration = 5000 }) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id, type, message, roomId, eventId, icon,
      createdAt: new Date(), read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const notifyNewEvent = useCallback((roomId, roomName, eventName, eventId) => {
    return addNotification({
      type: NotificationType.EVENT_NEW,
      message: `🆕 Новое событие «${eventName}» в «${roomName}»`,
      roomId, eventId, icon: '📅'
    })
  }, [addNotification])

  const notifyReminder = useCallback((roomId, roomName, eventName, eventId) => {
    return addNotification({
      type: NotificationType.EVENT_REMINDER,
      message: `🔔 Напоминание: «${eventName}» в «${roomName}»`,
      roomId, eventId, icon: '🔔'
    })
  }, [addNotification])

  const notifyChatMessage = useCallback((roomId, roomName, count = 1) => {
    const message = count === 1 
      ? `💬 Новое сообщение в «${roomName}»`
      : `💬 ${count} новых в «${roomName}»`
    return addNotification({ type: NotificationType.CHAT_MESSAGE, message, roomId, icon: '💬' })
  }, [addNotification])

  const notifyVideoSessionStarted = useCallback((roomId, eventName, eventId, early = false) => {
    return addNotification({
      type: early ? NotificationType.VIDEO_SESSION_EARLY : NotificationType.VIDEO_SESSION_STARTED,
      message: early 
        ? `🎬 «${eventName}» запущен досрочно!`
        : `🎬 Просмотр «${eventName}» начался!`,
      roomId, eventId, icon: '🎬', duration: 8000
    })
  }, [addNotification])

  const notifyJoinedRoom = useCallback((roomName) => {
    return addNotification({ type: NotificationType.JOINED_ROOM, message: `✅ Вы в «${roomName}»`, icon: '✅' })
  }, [addNotification])

  const notifyError = useCallback((message) => {
    return addNotification({ type: NotificationType.ERROR, message, icon: '❌', duration: 4000 })
  }, [addNotification])

  const notifySuccess = useCallback((message) => {
    return addNotification({ type: NotificationType.SUCCESS, message, icon: '✅', duration: 3000 })
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      addNotification, removeNotification, markAsRead, clearAll,
      notifyNewEvent, notifyReminder, notifyChatMessage,
      notifyVideoSessionStarted, notifyJoinedRoom, notifyError, notifySuccess
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
