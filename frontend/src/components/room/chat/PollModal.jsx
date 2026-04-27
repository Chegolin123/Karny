// C:\OSPanel\domains\karny\frontend\src\components\room\chat\PollModal.jsx

import { useState } from 'react'

export default function PollModal({ show, onClose, onSubmit, darkMode }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isMultiple, setIsMultiple] = useState(false)

  if (!show) return null

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const trimmedQuestion = question.trim()
    const trimmedOptions = options.map(o => o.trim()).filter(o => o)
    
    if (!trimmedQuestion) {
      alert('Введите вопрос')
      return
    }
    
    if (trimmedOptions.length < 2) {
      alert('Добавьте минимум 2 варианта ответа')
      return
    }
    
    onSubmit(trimmedQuestion, trimmedOptions, isAnonymous, isMultiple)
    
    // Сброс формы
    setQuestion('')
    setOptions(['', ''])
    setIsAnonymous(false)
    setIsMultiple(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      } animate-slideUp`}>
        
        {/* Заголовок */}
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Создать опрос
            </h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a30] text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Контент */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
          {/* Вопрос */}
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Вопрос
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Что будем обсуждать?"
            className={`w-full px-4 py-3 text-base border rounded-xl focus:outline-none focus:border-[#8b5cf6] transition-colors mb-4 ${
              darkMode 
                ? 'bg-[#0f0f13] border-[#3f3f46] text-white placeholder-gray-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            required
          />
          
          {/* Варианты ответов */}
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Варианты ответов
          </label>
          
          <div className="space-y-2 mb-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Вариант ${index + 1}`}
                  className={`flex-1 px-4 py-2.5 text-base border rounded-xl focus:outline-none focus:border-[#8b5cf6] transition-colors ${
                    darkMode 
                      ? 'bg-[#0f0f13] border-[#3f3f46] text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-[#2a2a30] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              className={`w-full py-2 text-sm font-medium rounded-xl transition-colors mb-4 ${
                darkMode 
                  ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46]' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              + Добавить вариант
            </button>
          )}
          
          {/* Настройки */}
          <div className="space-y-3 pt-2 border-t border-[#2a2a30]">
            <label className="flex items-center justify-between cursor-pointer">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Анонимное голосование
              </span>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 accent-[#8b5cf6]"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Множественный выбор
              </span>
              <input
                type="checkbox"
                checked={isMultiple}
                onChange={(e) => setIsMultiple(e.target.checked)}
                className="w-5 h-5 accent-[#8b5cf6]"
              />
            </label>
          </div>
          
          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-colors ${
                darkMode 
                  ? 'bg-[#2a2a30] text-white hover:bg-[#3f3f46]' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-medium rounded-xl text-white transition-colors bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#a78bfa]"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}