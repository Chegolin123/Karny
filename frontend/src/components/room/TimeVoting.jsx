// C:\OSPanel\domains\karny\frontend\src\components\room\TimeVoting.jsx

import { useState, useEffect } from 'react'
import * as api from '../../api'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function TimeVoting({ roomId, event, darkMode, isOwner, canEdit }) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [winningOptionId, setWinningOptionId] = useState(null)

  useEffect(() => {
    loadOptions()
  }, [event.id])

  const loadOptions = async () => {
    try {
      setLoading(true)
      const data = await api.getTimeOptions(roomId, event.id)
      setOptions(data.options || [])
    } catch (err) {
      console.error('Ошибка загрузки вариантов:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = async (e) => {
    e.preventDefault()
    if (!newDate) return
    
    setActionLoading(true)
    try {
      await api.addTimeOption(roomId, event.id, newDate)
      await loadOptions()
      setNewDate('')
      setShowAddModal(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVote = async (optionId) => {
    setActionLoading(true)
    try {
      await api.voteForTime(roomId, event.id, optionId)
      await loadOptions()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSelectWinner = async (optionId) => {
    const option = options.find(o => o.id === optionId)
    const dateStr = formatDate(option.proposed_date)
    
    if (!confirm(`Выбрать "${dateStr}" как окончательное время?\n\nПосле этого голосование будет завершено, а время зафиксировано.`)) {
      return
    }
    
    setWinningOptionId(optionId)
    setActionLoading(true)
    try {
      await api.selectWinningTime(roomId, event.id, optionId)
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      alert(err.message)
      setWinningOptionId(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteOption = async (optionId) => {
    if (!confirm('Удалить этот вариант?')) return
    
    setActionLoading(true)
    try {
      await api.deleteTimeOption(roomId, event.id, optionId)
      await loadOptions()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Загрузка вариантов...
      </div>
    )
  }

  const leadingOption = options.length > 0 
    ? options.reduce((max, opt) => opt.votes_count > max.votes_count ? opt : max, options[0])
    : null

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          🗳️ Варианты времени
        </h4>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={actionLoading}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46] border border-[#3f3f46]' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          + Предложить
        </button>
      </div>

      {options.length === 0 ? (
        <p className={`text-sm text-center py-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Пока нет предложенных вариантов
        </p>
      ) : (
        <div className="space-y-2">
          {options.map(option => {
            const isLeading = leadingOption && option.id === leadingOption.id
            const votePercentage = leadingOption && leadingOption.votes_count > 0
              ? Math.round((option.votes_count / leadingOption.votes_count) * 100)
              : 0
            
            return (
              <div 
                key={option.id} 
                className={`relative p-3 rounded-lg border overflow-hidden ${
                  darkMode 
                    ? 'bg-[#1a1a1e] border-[#2a2a30]' 
                    : 'bg-white border-gray-200'
                }`}
              >
                {leadingOption && leadingOption.votes_count > 0 && (
                  <div 
                    className={`absolute inset-y-0 left-0 ${
                      darkMode ? 'bg-purple-900/20' : 'bg-purple-100'
                    }`}
                    style={{ width: `${votePercentage}%` }}
                  />
                )}
                
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(option.proposed_date)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {option.creator_name} • {option.votes_count} голосов
                      </p>
                      {isLeading && option.votes_count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          🏆 Лидирует
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(option.id)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        option.user_voted
                          ? darkMode
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-700'
                            : 'bg-purple-100 text-purple-700 border border-purple-300'
                          : darkMode
                            ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46] border border-[#3f3f46]'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {option.user_voted ? '✓' : 'Голосовать'}
                    </button>
                    
                    {canEdit && (
                      <button
                        onClick={() => handleSelectWinner(option.id)}
                        disabled={actionLoading || winningOptionId === option.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          darkMode
                            ? 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                            : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                        } ${winningOptionId === option.id ? 'opacity-50' : ''}`}
                      >
                        {winningOptionId === option.id ? '...' : '✓ Выбрать'}
                      </button>
                    )}
                    
                    {(canEdit || option.created_by === api.getCurrentUserId()) && (
                      <button
                        onClick={() => handleDeleteOption(option.id)}
                        disabled={actionLoading}
                        className={`p-1.5 rounded-lg transition-colors ${
                          darkMode
                            ? 'text-gray-400 hover:text-red-400 hover:bg-[#2a2a30]'
                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {canEdit && options.length > 0 && (
        <p className={`text-xs mt-3 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          💡 Нажмите «✓ Выбрать», чтобы зафиксировать время и завершить голосование
        </p>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
          <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 ${
            darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Предложить время
            </h3>
            <form onSubmit={handleAddOption}>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] mb-4 ${
                  darkMode 
                    ? 'bg-[#2a2a30] border-[#3f3f46] text-white [color-scheme:dark]' 
                    : 'bg-gray-50 border-gray-200'
                }`}
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg border ${
                    darkMode 
                      ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg text-white ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#2d1b4e] to-[#4c1d95]'
                      : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'
                  }`}
                >
                  {actionLoading ? '...' : 'Предложить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}