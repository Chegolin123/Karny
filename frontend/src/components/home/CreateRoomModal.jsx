// C:\OSPanel\domains\karny\frontend\src\components\home\CreateRoomModal.jsx

import { useState } from 'react'

export default function CreateRoomModal({ show, onClose, onSubmit, loading, darkMode }) {
  const [name, setName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    
    if (isPrivate && password.length < 4) {
      alert('Пароль должен быть не менее 4 символов')
      return
    }
    
    onSubmit(name, isPrivate, password || null)
    setName('')
    setIsPrivate(false)
    setPassword('')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Новая комната
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-3 ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            autoFocus
            required
            disabled={loading}
          />
          
          {/* Выбор типа комнаты */}
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border-2 transition-all ${
                !isPrivate
                  ? darkMode 
                    ? 'border-[#8b5cf6] bg-[#2d1b4e] text-[#c4b5fd]' 
                    : 'border-[#8b5cf6] bg-[#f5f3ff] text-[#6d28d9]'
                  : darkMode
                    ? 'border-[#2a2a30] text-gray-400'
                    : 'border-gray-200 text-gray-500'
              }`}
            >
              🌍 Публичная
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border-2 transition-all ${
                isPrivate
                  ? darkMode 
                    ? 'border-[#8b5cf6] bg-[#2d1b4e] text-[#c4b5fd]' 
                    : 'border-[#8b5cf6] bg-[#f5f3ff] text-[#6d28d9]'
                  : darkMode
                    ? 'border-[#2a2a30] text-gray-400'
                    : 'border-gray-200 text-gray-500'
              }`}
            >
              🔒 Приватная
            </button>
          </div>
          
          {/* Пароль для приватной комнаты */}
          {isPrivate && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль (минимум 4 символа)"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-3 ${
                darkMode 
                  ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
              minLength={4}
              required={isPrivate}
              disabled={loading}
            />
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors border ${
                darkMode 
                  ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300 hover:bg-[#3f3f46]' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all disabled:opacity-50 shadow-sm ${
                darkMode
                  ? 'bg-gradient-to-r from-[#2d1b4e] to-[#4c1d95] text-white hover:from-[#3d2563] hover:to-[#6d28d9]'
                  : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] text-white hover:from-[#6d28d9] hover:to-[#7c3aed]'
              }`}
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}