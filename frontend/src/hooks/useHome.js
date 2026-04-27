// C:\OSPanel\domains\karny\frontend\src\hooks\useHome.js

import { useState, useEffect } from 'react'
import * as api from '../api'

export function useHome() {
  const [user, setUser] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const authResult = await api.auth()
      setUser(authResult.user)
      
      const roomsResult = await api.getRooms()
      setRooms(roomsResult.rooms || [])
    } catch (err) {
      console.error('Ошибка загрузки данных:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async (name, isPrivate = false, password = null) => {
    const result = await api.createRoom(name, isPrivate, password)
    setRooms(prev => [result.room, ...prev])
    return result
  }

  const joinRoom = async (code, password = null) => {
    const result = await api.joinRoom(code, password)
    await loadData() // Перезагружаем список комнат
    return result
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    user,
    rooms,
    loading,
    error,
    loadData,
    createRoom,
    joinRoom
  }
}