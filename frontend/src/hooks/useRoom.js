// C:\OSPanel\domains\karny\frontend\src\hooks\useRoom.js

import { useState, useEffect } from 'react'
import * as api from '../api'

export function useRoom(roomId) {
  const [room, setRoom] = useState(null)
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [userAttendances, setUserAttendances] = useState({})
  const [isMember, setIsMember] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (roomId) {
      loadRoomData()
      getCurrentUser()
    }
  }, [roomId])

  const getCurrentUser = () => {
    try {
      const userId = api.getCurrentUserId()
      setCurrentUserId(userId)
    } catch (err) {
      console.error('Ошибка получения пользователя:', err)
    }
  }

  const loadRoomData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getRoom(roomId)
      
      if (!data || !data.room) {
        setError('Комната не найдена')
        setLoading(false)
        return
      }
      
      setRoom(data.room)
      setMembers(data.members || [])
      setEvents(data.events || [])
      setIsMember(data.isMember !== false)
      setIsOwner(data.isOwner || (data.room?.owner_id == currentUserId))
      
      if (data.events && currentUserId) {
        const attendances = {}
        for (const event of data.events) {
          try {
            const statusData = await api.getAttendeeStatus(roomId, event.id)
            attendances[event.id] = statusData.status
          } catch (e) {
            attendances[event.id] = null
          }
        }
        setUserAttendances(attendances)
      }
    } catch (err) {
      console.error('Ошибка загрузки комнаты:', err)
      if (err.message?.includes('приватная комната') || err.message?.includes('Требуется пароль')) {
        setError('Это приватная комната. Введите пароль для входа.')
        setIsMember(false)
      } else {
        setError(err.message || 'Ошибка загрузки комнаты')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateRoom = async (name) => {
    const result = await api.updateRoom(roomId, name)
    setRoom(result.room)
    return result
  }

  const createEvent = async (name, eventDate, description, timeVotingEnabled) => {
    const result = await api.createEvent(roomId, name, eventDate, description, timeVotingEnabled)
    await loadRoomData()
    return result
  }

  const attendEvent = async (eventId, status) => {
    await api.attendEvent(roomId, eventId, status)
    setUserAttendances(prev => ({ ...prev, [eventId]: status }))
    await loadRoomData()
  }

  const leaveRoom = async () => {
    await api.leaveRoom(roomId)
  }

  const deleteRoom = async () => {
    await api.deleteRoom(roomId)
  }

  const joinPublicRoom = async (password = null) => {
    const result = await api.joinRoom(room.code, password)
    setIsMember(true)
    await loadRoomData()
    return result
  }

  const canEditEvent = (eventCreatedBy) => {
    return isOwner || eventCreatedBy === currentUserId
  }
  
  const canDeleteEvent = (eventCreatedBy) => {
    return isOwner || eventCreatedBy === currentUserId
  }
  
  const canRemindEvent = (eventCreatedBy) => {
    return isOwner || eventCreatedBy === currentUserId
  }

  return {
    room,
    members,
    events,
    loading,
    error,
    currentUserId,
    userAttendances,
    isOwner,
    isMember,
    loadRoomData,
    updateRoom,
    createEvent,
    attendEvent,
    leaveRoom,
    deleteRoom,
    joinPublicRoom,
    canEditEvent,
    canDeleteEvent,
    canRemindEvent
  }
}