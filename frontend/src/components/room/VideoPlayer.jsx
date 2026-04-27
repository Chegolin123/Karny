import { useState, useEffect, useRef, useCallback } from 'react'

function Countdown({ targetDate, darkMode }) {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setTime('Начинается...'); return }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
      setTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [targetDate])
  return (
    <div className="flex flex-col items-center py-8"><span className="text-5xl mb-3">⏳</span><p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>До начала просмотра</p><p className={`text-3xl font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{time}</p></div>
  )
}

function LiveTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
      const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [startedAt])
  return <span className="text-xs text-gray-400 ml-2">⏱️ {elapsed}</span>
}

function getVideoId(url, platform) {
  if (!url || !platform) return null
  try {
    if (platform === 'youtube') { const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/); return m ? m[1] : null }
    if (platform === 'rutube') { const m = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/); return m ? m[1] : null }
    if (platform === 'vk') { const m = url.match(/video(-?\d+_\d+)/); return m ? m[1] : null }
    return null
  } catch { return null }
}

function getElapsed(startedAt) {
  if (!startedAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
}

export default function VideoPlayer({ videoUrl, videoPlatform, videoState, isAdmin, onSessionStart, eventDate, darkMode, sessionStartedAt }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [started, setStarted] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const videoId = getVideoId(videoUrl, videoPlatform)
  const elapsed = getElapsed(sessionStartedAt)

  const buildUrl = useCallback(() => {
    if (!videoId) return ''
    const currentElapsed = getElapsed(sessionStartedAt)

    if (videoPlatform === 'youtube') {
      let u = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`
      if (currentElapsed > 0) u += `&start=${currentElapsed}`
      return u
    }

    if (videoPlatform === 'rutube') {
      let u = `https://rutube.ru/play/embed/${videoId}?autoplay=1&controls=1`
      if (currentElapsed > 0) u += `&start=${currentElapsed}`
      return u
    }

    if (videoPlatform === 'vk') {
      const [oid, id] = videoId.split('_')
      return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=1`
    }

    return ''
  }, [videoId, videoPlatform, sessionStartedAt])

  const handleStart = () => {
    setEmbedUrl(buildUrl())
    setStarted(true)
  }

  const handleSync = () => {
    // Показываем "Синхронизация..." на 300ms, потом пересоздаём iframe
    setSyncing(true)
    setTimeout(() => {
      setEmbedUrl(buildUrl())
      setIframeKey(k => k + 1)
      setSyncing(false)
    }, 300)
  }

  useEffect(() => {
    if (videoState === 'waiting') {
      setStarted(false)
      setEmbedUrl('')
      setSyncing(false)
      setIframeKey(k => k + 1)
    }
  }, [videoState])

  useEffect(() => {
    if (videoState === 'live' && videoPlatform === 'youtube') {
      setEmbedUrl(buildUrl())
      setStarted(true)
    }
  }, [videoState, videoPlatform, buildUrl])

  if (!videoUrl) return null

  if (videoState === 'waiting') {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1"><span className="text-lg">🎬</span><span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ожидание начала</span></div>
        <div className={`rounded-xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-50'}`}>
          {eventDate ? <Countdown targetDate={eventDate} darkMode={darkMode} /> : <div className="flex flex-col items-center py-8"><span className="text-5xl mb-3">🎬</span><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Видео ожидает запуска</p></div>}
          {isAdmin && <div className="px-8 pb-6"><button onClick={() => setShowConfirm(true)} className="w-full py-3 rounded-xl bg-[#6d28d9] text-white font-medium hover:bg-[#5b21b6] transition-colors">🚀 Запустить сейчас</button></div>}
        </div>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowConfirm(false)}>
            <div className={`p-6 rounded-2xl max-w-sm mx-4 ${darkMode ? 'bg-[#1a1a1e]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>⚠️ Досрочный запуск</h3>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Просмотр начнётся одновременно у всех.</p>
              <div className="flex gap-3"><button onClick={() => setShowConfirm(false)} className={`flex-1 py-2.5 text-sm font-medium rounded-xl border ${darkMode ? 'bg-[#2a2a30] border-[#3f3f46] text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>Отмена</button><button onClick={() => { setShowConfirm(false); onSessionStart?.() }} className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6]">Запустить</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (videoState === 'live') {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-lg">🎬</span>
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {started ? (syncing ? '🔄 Синхронизация...' : '▶️ Идёт просмотр') : 'Готово к запуску'}
          </span>
          {started && !syncing && (
            <span className="flex items-center gap-1.5 ml-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-xs text-gray-400">LIVE</span></span>
          )}
          {sessionStartedAt && started && <LiveTimer startedAt={sessionStartedAt} />}
        </div>
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
          {!started || syncing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
              {syncing ? (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-3 border-[#6d28d9] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-gray-400 text-sm">Синхронизация...</p>
                </div>
              ) : (
                <>
                  <span className="text-5xl mb-4">🎬</span>
                  <p className="text-white text-lg font-medium mb-2">Видео готово к просмотру</p>
                  {sessionStartedAt && <p className="text-gray-400 text-sm mb-4">Сеанс идёт уже <LiveTimer startedAt={sessionStartedAt} /></p>}
                  <button onClick={handleStart} className="px-8 py-3 rounded-xl bg-[#6d28d9] text-white font-medium hover:bg-[#5b21b6] transition-colors shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    Смотреть
                  </button>
                </>
              )}
            </div>
          ) : (
            <iframe key={iframeKey} src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture" />
          )}
        </div>
        {started && sessionStartedAt && !syncing && (
          <div className="flex justify-center mt-2">
            <button onClick={handleSync}
              className={`px-4 py-1.5 text-xs rounded-lg ${darkMode ? 'bg-[#2a2a30] text-gray-300 hover:bg-[#3f3f46]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors flex items-center gap-1`}>
              🔄 Синхронизировать ({Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')})
            </button>
          </div>
        )}
      </div>
    )
  }

  if (videoState === 'ended') return <div className="mb-6"><div className={`p-8 text-center rounded-xl ${darkMode ? 'bg-[#1a1a1e]' : 'bg-gray-50'}`}><span className="text-5xl mb-3 block">✅</span><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Просмотр завершён</p></div></div>
  return null
}
