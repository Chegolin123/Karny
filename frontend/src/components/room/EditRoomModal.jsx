// C:\OSPanel\domains\karny\frontend\src\components\room\EditRoomModal.jsx

import { useState, useEffect, useRef } from 'react'
import { getAvatarColor } from '../../utils/avatar'

export default function EditRoomModal({ show, onClose, onSubmit, room, loading, darkMode }) {
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [imgError, setImgError] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (room) {
      setName(room.name)
      setPhotoUrl(room.photo_url || '')
      setPreviewUrl(room.photo_url || '')
      setImgError(false)
    }
  }, [room])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setPhotoUrl(base64)
      setPreviewUrl(base64)
      setImgError(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoUrl('')
    setPreviewUrl('')
    setImgError(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 3) return
    onSubmit(name.trim(), photoUrl)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Редактировать комнату
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Аватар */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {previewUrl && !imgError ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl border-2 border-purple-500/30"
                  style={{ backgroundColor: getAvatarColor(name) }}
                >
                  {name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white text-lg shadow-lg transition-colors"
              >
                📷
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
              >
                Выбрать фото
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Удалить
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название комнаты"
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all ${
              darkMode 
                ? 'bg-[#2a2a30] border-[#3f3f46] text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
            autoFocus
            required
            minLength={3}
            disabled={loading}
          />
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
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}