// C:\OSPanel\domains\karny\frontend\src\components\room\chat\PollMessage.jsx

import { useState } from 'react'
import * as api from '../../../api'

export default function PollMessage({ 
  poll, 
  isOwn, 
  darkMode, 
  onVote, 
  onClose,
  isAdmin 
}) {
  const [selectedOptions, setSelectedOptions] = useState(poll.is_multiple ? [] : null)
  const [hasVoted, setHasVoted] = useState(poll.user_votes?.length > 0)
  
  const currentUserId = api.getCurrentUserId()
  const isCreator = poll.created_by == currentUserId
  const canClose = isAdmin || isCreator
  const totalVotes = poll.total_votes || 0
  
  const handleOptionClick = (optionId) => {
    if (poll.is_closed || hasVoted) return
    
    if (poll.is_multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions(optionId)
    }
  }
  
  const handleVote = () => {
    if (poll.is_closed || hasVoted) return
    
    const optionIds = poll.is_multiple ? selectedOptions : [selectedOptions]
    if (!optionIds || optionIds.length === 0 || (Array.isArray(optionIds) && optionIds.length === 0)) {
      alert('Выберите вариант ответа')
      return
    }
    
    onVote(poll.id, optionIds)
    setHasVoted(true)
  }
  
  const getPercentage = (count) => {
    if (totalVotes === 0) return 0
    return Math.round((count / totalVotes) * 100)
  }

  const pluralize = (count, one, two, five) => {
    const n = Math.abs(count) % 100
    const n1 = n % 10
    if (n > 10 && n < 20) return five
    if (n1 > 1 && n1 < 5) return two
    if (n1 === 1) return one
    return five
  }
  
  const showResults = poll.is_closed || hasVoted
  
  return (
    <div className={`rounded-2xl overflow-hidden ${
      darkMode ? 'bg-[#1a1a1e] border border-[#2a2a30]' : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      {/* Заголовок */}
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div className="flex-1">
            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {poll.question}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {poll.is_closed && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                }`}>
                  Завершён
                </span>
              )}
              {poll.is_anonymous && (
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Анонимно
                </span>
              )}
              {poll.is_multiple && (
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Несколько вариантов
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Варианты */}
      <div className="p-4 space-y-2">
        {poll.options?.map(option => {
          const percentage = getPercentage(option.vote_count)
          const isSelected = poll.is_multiple 
            ? selectedOptions?.includes(option.id)
            : selectedOptions === option.id
          const userVoted = poll.user_votes?.includes(option.id)
          
          return (
            <div key={option.id}>
              {showResults ? (
                // Режим просмотра результатов
                <div className="relative">
                  <div className={`flex items-center justify-between text-sm mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <span>{option.option_text}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    darkMode ? 'bg-[#3f3f46]' : 'bg-gray-200'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all ${
                        userVoted ? 'bg-[#8b5cf6]' : 'bg-[#6d28d9]/60'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {option.vote_count} {pluralize(option.vote_count, 'голос', 'голоса', 'голосов')}
                  </span>
                </div>
              ) : (
                // Режим голосования
                <button
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? darkMode 
                        ? 'bg-[#2d1b4e] border border-[#8b5cf6]' 
                        : 'bg-[#f5f3ff] border border-[#8b5cf6]'
                      : darkMode
                        ? 'bg-[#2a2a30] hover:bg-[#3f3f46] border border-transparent'
                        : 'bg-gray-100 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                    {option.option_text}
                  </span>
                </button>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Футер */}
      <div className={`px-4 py-3 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-100'} flex items-center justify-between`}>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalVotes} {pluralize(totalVotes, 'голос', 'голоса', 'голосов')}
          {!poll.is_anonymous && hasVoted && ' • Вы проголосовали'}
        </span>
        
        <div className="flex items-center gap-2">
          {!poll.is_closed && !hasVoted && (
            <button
              onClick={handleVote}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[#6d28d9] text-white hover:bg-[#5b21b6] transition-colors"
            >
              Голосовать
            </button>
          )}
          
          {canClose && !poll.is_closed && (
            <button
              onClick={() => onClose(poll.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a30] text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Завершить опрос"
            >
              ✕ Завершить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}