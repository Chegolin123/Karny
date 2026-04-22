// C:\OSPanel\domains\karny\frontend\src\components\home\JoinRoomModal.jsx

import { useState } from 'react'

export default function JoinRoomModal({ show, onClose, onSubmit, loading, darkMode }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [requiresPassword, setRequiresPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    
    try {
      await onSubmit(code, password || null)
      setCode('')
      setPassword('')
      setRequiresPassword(false)
    } catch (err) {
      // Если сервер говорит что нужен пароль
      if (err.message.includes('Требуется пароль') || err.message.includes('Неверный пароль')) {
        setRequiresPassword(true)
      } else {
        alert(err.message)
      }
    }
  }

  const handleClose = () => {
    setCode('')
    setPassword('')
    setRequiresPassword(false)
    onClose()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Присоединиться
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Код комнаты"
            className={`w-full px-4 py-3 border rounded-lg text-sm font-mono uppercase tracking-wider text-center focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-3 ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            autoFocus
            required
            disabled={loading}
          />
          
          {requiresPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all mb-3 ${
                darkMode 
                  ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
              required
              disabled={loading}
            />
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
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
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}