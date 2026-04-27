// /var/www/karny/frontend/src/components/room/chat/hooks/useChatInit.js

import { useState, useEffect } from 'react'
import * as api from '../../../../api'

export function useChatInit(roomId, currentUserId) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMember, setIsMember] = useState(true)
  const [accessError, setAccessError] = useState(null)
  const [isChatFocused, setIsChatFocused] = useState(true)

  // Проверка прав администратора
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const data = await api.getRoom(roomId)
        const ownerId = data?.room?.owner_id
        setIsAdmin(ownerId == currentUserId)
      } catch (err) {
        console.error('Ошибка проверки админа:', err)
      }
    }
    if (roomId && currentUserId) checkAdmin()
  }, [roomId, currentUserId])

  // Проверка участия в комнате
  useEffect(() => {
    const checkMembership = async () => {
      try {
        const data = await api.getRoom(roomId)
        const member = data?.members?.find(m => m.id == currentUserId)
        const isOwner = data?.room?.owner_id == currentUserId
        
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
    
    if (roomId && currentUserId) checkMembership()
  }, [roomId, currentUserId])

  // Отслеживание фокуса окна
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

  return {
    isAdmin,
    isMember,
    accessError,
    isChatFocused
  }
}