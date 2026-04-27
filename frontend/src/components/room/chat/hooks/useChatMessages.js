// /var/www/karny/frontend/src/components/room/chat/hooks/useChatMessages.js

import { useState, useCallback, useRef } from 'react'
import * as api from '../../../../api'
import { normalizeMessage, sortMessages, isDuplicateMessage, findTempMessage, generateTempId } from '../utils/chatUtils'

export function useChatMessages(roomId, isMember, currentUserId, currentUserIdStr, members) {
  const [messages, setMessages] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  
  const pendingMessagesRef = useRef(new Map())
  const initialLoadDoneRef = useRef(false)
  const lastSentContentRef = useRef('')
  const lastSentTimeRef = useRef(0)

  const addMessage = useCallback((message) => {
    const normalizedMsg = normalizeMessage(message)

    setMessages(prev => {
      // Проверка на дубликат
      if (isDuplicateMessage(prev, normalizedMsg)) {
        return prev
      }

      // Временное сообщение
      if (normalizedMsg.tempId) {
        if (prev.some(m => m.tempId === normalizedMsg.tempId)) {
          return prev
        }
        pendingMessagesRef.current.set(normalizedMsg.tempId, normalizedMsg)
        return sortMessages([...prev, normalizedMsg])
      }

      // Замена временного сообщения
      const tempIndex = findTempMessage(prev, normalizedMsg)
      if (tempIndex !== -1) {
        const tempMsg = prev[tempIndex]
        pendingMessagesRef.current.delete(tempMsg.tempId)
        const updated = [...prev]
        updated[tempIndex] = { ...normalizedMsg, tempId: undefined }
        return sortMessages(updated)
      }

      return sortMessages([...prev, normalizedMsg])
    })
  }, [])

  const loadMessages = useCallback(async (beforeId = null) => {
    try {
      setIsLoadingMore(true)
      const data = await api.getMessages(roomId, 30, beforeId)
      const normalizedMessages = (data?.messages || []).map(msg => normalizeMessage(msg))

      if (beforeId) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id).filter(Boolean))
          const newMessages = normalizedMessages.filter(m => !existingIds.has(m.id))
          return sortMessages([...newMessages, ...prev])
        })
      } else {
        setMessages(sortMessages(normalizedMessages))
        setHistoryLoaded(true)
        setIsInitialLoad(false)
        initialLoadDoneRef.current = true
      }

      setHasMore(data?.hasMore ?? (normalizedMessages.length === 30))
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [roomId])

  const createOptimisticMessage = useCallback((content, attachments = null, replyToId = null) => {
    const now = Date.now()
    const tempId = generateTempId()

    const user = members?.find(m => String(m.id) === currentUserIdStr) || {
      id: currentUserId,
      first_name: 'Вы',
      last_name: ''
    }

    const msg = {
      tempId,
      roomId,
      userId: currentUserId,
      content: content || '',
      reply_to_id: replyToId,
      timestamp: new Date().toISOString(),
      user,
      is_pinned: false
    }

    if (attachments) {
      msg.attachments = attachments.map((f, i) => ({
        id: `temp_att_${now}_${i}`,
        file_name: f.name,
        file_url: f.url,
        file_type: f.type,
        file_size: f.size
      }))
    }

    return normalizeMessage(msg)
  }, [roomId, currentUserId, currentUserIdStr, members])

  const checkDuplicateSend = useCallback((content) => {
    const now = Date.now()
    if (content === lastSentContentRef.current && now - lastSentTimeRef.current < 1000) {
      return true
    }
    lastSentContentRef.current = content
    lastSentTimeRef.current = now
    return false
  }, [])

  const resetState = useCallback(() => {
    setIsInitialLoad(true)
    setHistoryLoaded(false)
    setMessages([])
    initialLoadDoneRef.current = false
    pendingMessagesRef.current.clear()
  }, [])

  return {
    messages,
    setMessages,
    isLoadingMore,
    hasMore,
    isInitialLoad,
    historyLoaded,
    initialLoadDoneRef,
    addMessage,
    loadMessages,
    createOptimisticMessage,
    checkDuplicateSend,
    resetState
  }
}