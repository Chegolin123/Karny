// C:\OSPanel\domains\karny\frontend\src\contexts\NotificationContext.jsx

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as api from '../api'

const NotificationContext = createContext()

export function useNotification() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [eventCheckInterval, setEventCheckInterval] = useState(null)

  // Проверка новых событий
  useEffect(() => {
    const checkNewEvents = async () => {
      try {
        const userId = api.getCurrentUserId()
        if (!userId) return
        
        const data = await api.getNewEvents()
        if (data.events && data.events.length > 0) {
          data.events.forEach(event => {
            addNotification({
              type: 'event',
              roomId: event.room_id,
              roomName: event.room_name,
              message: `🆕 Новое событие «${event.name}» в комнате «${event.room_name}»`,
              eventName: event.name,
              eventId: event.id,
              icon: '📅'
            })
          })
        }
      } catch (err) {
        console.error('Ошибка проверки новых событий:', err)
      }
    }

    // Проверяем каждые 30 секунд
    const interval = setInterval(checkNewEvents, 30000)
    setEventCheckInterval(interval)
    
    // Первая проверка через 5 секунд после загрузки
    setTimeout(checkNewEvents, 5000)

    return () => clearInterval(interval)
  }, [])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      ...notification,
      createdAt: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
    
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

  // Уведомление о новом событии
  const notifyNewEvent = useCallback((roomId, roomName, eventName, eventId) => {
    return addNotification({
      type: 'event',
      roomId,
      roomName,
      message: `🆕 Новое событие «${eventName}» в комнате «${roomName}»`,
      eventName,
      eventId,
      icon: '📅'
    })
  }, [addNotification])

  // Уведомление о напоминании
  const notifyReminder = useCallback((roomId, roomName, eventName, eventId) => {
    return addNotification({
      type: 'reminder',
      roomId,
      roomName,
      message: `🔔 Напоминание: «${eventName}» в комнате «${roomName}»`,
      eventName,
      eventId,
      icon: '🔔'
    })
  }, [addNotification])

  // Уведомление о чате
  const notifyChatMessage = useCallback((roomId, roomName, messageCount = 1) => {
    const message = messageCount === 1 
      ? `💬 Новое сообщение в чате «${roomName}»`
      : `💬 ${messageCount} новых сообщений в чате «${roomName}»`
    
    return addNotification({
      type: 'chat',
      roomId,
      roomName,
      message,
      messageCount,
      icon: '💬'
    })
  }, [addNotification])

  // Уведомление о присоединении к комнате
  const notifyJoinedRoom = useCallback((roomName) => {
    return addNotification({
      type: 'system',
      message: `✅ Вы присоединились к комнате «${roomName}»`,
      icon: '✅'
    })
  }, [addNotification])

  // Уведомление об ошибке
  const notifyError = useCallback((message) => {
    return addNotification({
      type: 'error',
      message,
      icon: '❌'
    })
  }, [addNotification])

  // Уведомление об успехе
  const notifySuccess = useCallback((message) => {
    return addNotification({
      type: 'success',
      message,
      icon: '✅'
    })
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      removeNotification,
      markAsRead,
      clearAll,
      notifyNewEvent,
      notifyReminder,
      notifyChatMessage,
      notifyJoinedRoom,
      notifyError,
      notifySuccess
    }}>
      {children}
    </NotificationContext.Provider>
  )
}