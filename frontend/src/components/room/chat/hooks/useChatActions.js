// /var/www/karny/frontend/src/components/room/chat/hooks/useChatActions.js

import { useState, useCallback } from 'react'
import * as api from '../../../../api'

export function useChatActions(roomId, currentUserId, ws, connected) {
  const [replyTo, setReplyTo] = useState(null)
  const [showPollModal, setShowPollModal] = useState(false)

  const handleReply = useCallback((message) => {
    setReplyTo(message)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  const handleEditMessage = useCallback((message, newContent) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    if (newContent.trim() && newContent !== message.content) {
      ws.send(JSON.stringify({
        type: 'edit_message',
        messageId: message.id,
        content: newContent.trim()
      }))
    }
  }, [ws])

  const handleDeleteMessage = useCallback((message) => {
    if (!confirm('Удалить сообщение?')) return
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      type: 'delete_message',
      messageId: message.id
    }))
  }, [ws])

  const handlePinMessage = useCallback((message) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      type: 'pin_message',
      messageId: message.id
    }))
  }, [ws])

  const handleMarkAsRead = useCallback((messageId) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      type: 'mark_read',
      messageId
    }))
  }, [ws])

  const handleCreatePoll = useCallback(async (question, options, isAnonymous, isMultiple) => {
    try {
      const result = await api.createPoll(roomId, question, options, isAnonymous, isMultiple)
      setShowPollModal(false)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'poll_created',
          poll: result.poll
        }))
      }
      return result.poll
    } catch (error) {
      alert('Ошибка создания опроса: ' + error.message)
      return null
    }
  }, [roomId, ws])

  const handleVotePoll = useCallback(async (pollId, optionIds) => {
    try {
      await api.votePoll(roomId, pollId, optionIds)
      const result = await api.getPoll(roomId, pollId)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'poll_updated',
          poll: result.poll
        }))
      }
      return result.poll
    } catch (error) {
      alert('Ошибка голосования: ' + error.message)
      return null
    }
  }, [roomId, ws])

  const handleClosePoll = useCallback(async (pollId) => {
    try {
      await api.closePoll(roomId, pollId)
      const result = await api.getPoll(roomId, pollId)
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'poll_updated',
          poll: result.poll
        }))
      }
      return result.poll
    } catch (error) {
      alert('Ошибка закрытия опроса: ' + error.message)
      return null
    }
  }, [roomId, ws])

  const handleSendMessage = useCallback((content, replyToId, optimisticMessage) => {
    if (!connected || !ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify({
      type: 'message',
      content: content.trim(),
      reply_to_id: replyToId
    }))
    if (replyToId) setReplyTo(null)
    return true
  }, [connected, ws])

  const handleSendFile = useCallback((content, attachments, replyToId) => {
    if (!connected || !ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify({
      type: 'message',
      content: content || '',
      attachments: attachments.map(f => ({
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size
      })),
      reply_to_id: replyToId
    }))
    if (replyToId) setReplyTo(null)
    return true
  }, [connected, ws])

  return {
    replyTo,
    showPollModal,
    setShowPollModal,
    handleReply,
    handleCancelReply,
    handleEditMessage,
    handleDeleteMessage,
    handlePinMessage,
    handleMarkAsRead,
    handleCreatePoll,
    handleVotePoll,
    handleClosePoll,
    handleSendMessage,
    handleSendFile
  }
}