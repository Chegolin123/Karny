import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../common/ThemeProvider'
import { getAvatarColor } from '../../utils/avatar'

export default function RoomHeader({ 
  room, 
  membersCount, 
  copied, 
  onCopyCode, 
  onShare,
  isOwner,
  onOpenSettings,
  roomId,
  onPollClick,
  onFundingClick 
}) {
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const handleCopyInvite = () => {
    const inviteText = `Присоединяйся к комнате «${room?.name}» в Karny!\n\nКод: ${room?.code}`
    navigator.clipboard?.writeText(inviteText).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }).catch(() => {
      const textArea = document.createElement('textarea')
      textArea.value = inviteText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  const handleCopyCodeOnly = () => {
    navigator.clipboard?.writeText(room?.code).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }).catch(() => {
      const textArea = document.createElement('textarea')
      textArea.value = room?.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  const handlePollClick = () => {
    if (onPollClick) onPollClick()
  }

  const handleFundingClick = () => {
    if (onFundingClick) onFundingClick()
  }
  
  return (
    <>
      <header className={`w-full overflow-hidden flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-[#1e1136] to-[#2d1b4e]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9]'} text-white shadow-md`}>
        <div className="w-full max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to="/rooms" className="text-white/80 hover:text-white transition-colors p-1 -ml-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            {room?.photo_url && !imgError ? (
              <img src={room.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white/30 flex-shrink-0" onError={() => setImgError(true)} />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white/30 flex-shrink-0" style={{ backgroundColor: getAvatarColor(room?.name) }}>
                {room?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            
            <h1 className="text-base sm:text-lg font-semibold truncate">{room?.name}</h1>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button onClick={onCopyCode} className="flex items-center gap-1.5 text-xs sm:text-sm bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-lg transition-colors">
                <span className="font-mono font-medium">{room?.code}</span>
                <span className="text-xs">{copied ? '✓' : '📋'}</span>
              </button>
              
              <div className="flex items-center gap-1 text-xs sm:text-sm text-white/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{membersCount}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={handlePollClick} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors" title="Создать опрос">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2z" />
                </svg>
              </button>

              <button onClick={handleFundingClick} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors" title="Создать сбор">
                <span className="text-lg">💰</span>
              </button>

              <Link to={`/room/${roomId}/chat`} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors" title="Чат комнаты">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
              
              <button onClick={handleShareClick} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors" title="Поделиться">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              
              <button onClick={onOpenSettings} className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors" title="Настройки комнаты">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 animate-fadeIn">
          <div className={`w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slideUp ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Приглашение в комнату</h2>
              <button onClick={() => setShowShareModal(false)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a30] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Поделитесь кодом или ссылкой-приглашением:</p>
            <button onClick={handleCopyCodeOnly} className={`w-full p-4 rounded-xl border-2 border-dashed mb-3 transition-all ${darkMode ? 'border-[#3f3f46] hover:border-[#8b5cf6] bg-[#2a2a30]' : 'border-gray-300 hover:border-[#8b5cf6] bg-gray-50'}`}>
              <span className={`text-3xl font-mono font-bold tracking-wider ${darkMode ? 'text-white' : 'text-gray-900'}`}>{room?.code}</span>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Нажмите, чтобы скопировать код</p>
            </button>
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-[#0f0f13]' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Присоединяйся к комнате «{room?.name}» в Karny!</p>
              <p className={`text-sm font-mono mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Код: {room?.code}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCopyInvite} className={`flex-1 py-3 text-sm font-medium rounded-xl transition-colors ${darkMode ? 'bg-[#2a2a30] text-white hover:bg-[#3f3f46] border border-[#3f3f46]' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}>{shareCopied ? '✓ Скопировано' : '📋 Копировать всё'}</button>
              <button onClick={() => setShowShareModal(false)} className={`flex-1 py-3 text-sm font-medium rounded-xl text-white transition-colors ${darkMode ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#a78bfa]' : 'bg-gradient-to-r from-[#4c1d95] to-[#6d28d9] hover:from-[#5b21b6] hover:to-[#7c3aed]'}`}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
