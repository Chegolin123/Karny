// C:\OSPanel\domains\karny\frontend\src\components\room\RoomSettingsModal.jsx

import { useState, useEffect, useRef } from 'react'
import * as api from '../../api'

export default function RoomSettingsModal({ 
  show, 
  onClose, 
  room, 
  members,
  currentUserId,
  isOwner,
  onUpdateRoom,
  onTransferOwnership,
  onDeleteRoom,
  loading,
  darkMode 
}) {
  const [activeTab, setActiveTab] = useState('general')
  const [roomName, setRoomName] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // 🆕 Состояния для аватарки
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (room) {
      setRoomName(room.name || '')
      setAvatarPreview(room.photo_url || null)
    }
  }, [room])

  // 🆕 Обработчик выбора файла
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    // Проверка размера (макс 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Размер файла не должен превышать 2MB')
      return
    }

    setAvatarFile(file)
    
    // Создаём превью
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // 🆕 Конвертация файла в base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 🆕 Обновлённый обработчик сохранения
  const handleUpdateRoom = async (e) => {
    e.preventDefault()
    if (!roomName.trim() || roomName.trim().length < 3) return
    
    try {
      let photoUrl = room?.photo_url || null
      
      // Если выбран новый файл - конвертируем в base64
      if (avatarFile) {
        photoUrl = await fileToBase64(avatarFile)
      }
      
      // Передаём и имя и photoUrl
      await onUpdateRoom(roomName.trim(), photoUrl)
    } catch (error) {
      console.error('Ошибка при подготовке аватарки:', error)
      alert('Ошибка при загрузке аватарки: ' + error.message)
    }
  }

  // 🆕 Удаление аватарки
  const handleRemoveAvatar = async () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Сразу сохраняем комнату без аватарки
    await onUpdateRoom(roomName.trim(), null)
  }

  const handleTransferOwnership = () => {
    if (!selectedMemberId) return
    onTransferOwnership(selectedMemberId)
  }

  const handleDeleteRoom = () => {
    if (deleteConfirmText === room?.name) {
      onDeleteRoom()
    }
  }

  const otherMembers = members.filter(m => m.id !== currentUserId)

  if (!show) return null

  const isFormDisabled = loading || !isOwner
  const hasChanges = roomName !== room?.name || avatarFile !== null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
      <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col ${
        darkMode ? 'bg-[#1a1a1e]' : 'bg-white'
      } animate-slideUp`}>
        
        {/* Заголовок */}
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Настройки комнаты
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
          
          {/* Табы */}
          {isOwner && (
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'general'
                    ? darkMode 
                      ? 'bg-[#2d1b4e] text-[#c4b5fd]' 
                      : 'bg-[#f5f3ff] text-[#6d28d9]'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Основное
              </button>
              <button
                onClick={() => setActiveTab('transfer')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'transfer'
                    ? darkMode 
                      ? 'bg-[#2d1b4e] text-[#c4b5fd]' 
                      : 'bg-[#f5f3ff] text-[#6d28d9]'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Передать права
              </button>
              <button
                onClick={() => {
                  setActiveTab('danger')
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'danger'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : darkMode
                      ? 'text-gray-400 hover:text-red-400'
                      : 'text-gray-500 hover:text-red-600'
                }`}
              >
                Опасное
              </button>
            </div>
          )}
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Основные настройки */}
          {activeTab === 'general' && (
            <form onSubmit={handleUpdateRoom}>
              {/* 🆕 Аватарка комнаты */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Аватарка комнаты
                </label>
                <div className="flex items-center gap-4">
                  {/* Превью аватарки */}
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Аватарка"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                        darkMode ? 'bg-[#2a2a30] text-gray-400' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {roomName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  
                  {/* Кнопки управления */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                      id="avatar-upload"
                      disabled={isFormDisabled}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        darkMode 
                          ? 'bg-[#2a2a30] text-white hover:bg-[#3f3f46]' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isFormDisabled}
                    >
                      {avatarPreview ? 'Изменить' : 'Загрузить'}
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          darkMode 
                            ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        disabled={isFormDisabled}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Рекомендуется квадратное изображение, до 2MB
                </p>
              </div>
              
              {/* Название комнаты */}
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Название комнаты
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className={`input mb-4`}
                placeholder="Название"
                minLength={3}
                required
                disabled={isFormDisabled}
              />
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isFormDisabled || !hasChanges}
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              
              {!isOwner && (
                <p className={`text-sm text-center mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Только владелец может изменять настройки
                </p>
              )}
            </form>
          )}

          {/* Передача прав */}
          {activeTab === 'transfer' && (
            <div>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Выберите участника, которому хотите передать права владельца комнаты.
                После передачи вы станете обычным участником.
              </p>
              
              {otherMembers.length === 0 ? (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Нет других участников
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {otherMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                        selectedMemberId === member.id
                          ? darkMode
                            ? 'border-[#8b5cf6] bg-[#2d1b4e]'
                            : 'border-[#8b5cf6] bg-[#f5f3ff]'
                          : darkMode
                            ? 'border-[#2a2a30] hover:border-[#3f3f46]'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            darkMode ? 'bg-[#3f3f46]' : 'bg-gray-300'
                          }`}>
                            {member.first_name?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {member.first_name} {member.last_name || ''}
                          </p>
                          {member.username && (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              @{member.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={handleTransferOwnership}
                className="btn-primary w-full"
                disabled={loading || !selectedMemberId}
              >
                {loading ? 'Передача...' : 'Передать права'}
              </button>
            </div>
          )}

          {/* Опасная зона */}
          {activeTab === 'danger' && (
            <div>
              <div className={`p-4 rounded-xl border-2 mb-4 ${
                darkMode 
                  ? 'bg-red-900/10 border-red-900/30' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                  Удаление комнаты
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Это действие нельзя отменить. Все события, сообщения и участники будут удалены.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-danger w-full"
                    disabled={!isOwner}
                  >
                    Удалить комнату
                  </button>
                ) : (
                  <div>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Введите название комнаты <strong>{room?.name}</strong> для подтверждения:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="input mb-3"
                      placeholder="Название комнаты"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeleteConfirmText('')
                        }}
                        className="btn-secondary flex-1"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleDeleteRoom}
                        className="btn-danger flex-1"
                        disabled={deleteConfirmText !== room?.name || loading}
                      >
                        {loading ? 'Удаление...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {!isOwner && (
                <p className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Только владелец может удалить комнату
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Кнопка закрытия для мобильных */}
        <div className={`p-5 border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'} sm:hidden`}>
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}