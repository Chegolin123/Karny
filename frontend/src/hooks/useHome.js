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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async (name) => {
    const result = await api.createRoom(name)
    setRooms([result.room, ...rooms])
    return result
  }

  const joinRoom = async (code) => {
    await api.joinRoom(code)
    await loadData()
  }

  useEffect(() => {
    setTimeout(() => loadData(), 100)
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