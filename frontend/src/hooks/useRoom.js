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
      setRoom(data.room)
      setMembers(data.members || [])
      setEvents(data.events || [])
      
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateRoom = async (name) => {
    const result = await api.updateRoom(roomId, name)
    setRoom(result.room)
    return result
  }

  const createEvent = async (name, eventDate, description) => {
    const result = await api.createEvent(roomId, name, eventDate, description)
    await loadRoomData()
    return result
  }

  const updateEvent = async (eventId, name, eventDate, description) => {
    const result = await api.updateEvent(roomId, eventId, name, eventDate, description)
    await loadRoomData()
    return result
  }

  const attendEvent = async (eventId, status) => {
    await api.attendEvent(roomId, eventId, status)
    setUserAttendances(prev => ({ ...prev, [eventId]: status }))
    await loadRoomData()
  }

  const deleteEvent = async (eventId) => {
    await api.deleteEvent(roomId, eventId)
    await loadRoomData()
  }

  const leaveRoom = async () => {
    await api.leaveRoom(roomId)
  }

  const deleteRoom = async () => {
    await api.deleteRoom(roomId)
  }

  const isOwner = currentUserId === room?.owner_id
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
    loadRoomData,
    updateRoom,
    createEvent,
    updateEvent,
    attendEvent,
    deleteEvent,
    leaveRoom,
    deleteRoom,
    canEditEvent,
    canDeleteEvent,
    canRemindEvent
  }
}