import { useState, useRef, useEffect, useCallback } from 'react'
import * as api from '../../../api'
import MentionSuggestions from './MentionSuggestions'
import AttachmentPreview from './AttachmentPreview'

export default function MessageInput({ 
  connected, darkMode, onSendMessage, onSendFile, onTyping, replyTo, onCancelReply, roomId 
}) {
  const [newMessage, setNewMessage] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [mentionSearch, setMentionSearch] = useState(null)
  const [members, setMembers] = useState([])
  const typingTimeoutRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (roomId) {
      api.getRoomMembers(roomId).then(data => setMembers(data.members || [])).catch(console.error)
    }
  }, [roomId])

  const handleInputChange = (e) => {
    const value = e.target.value
    setNewMessage(value)
    
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1)
      if (!textAfterAt.includes(' ')) {
        const rect = inputRef.current?.getBoundingClientRect()
        setMentionSearch({ query: textAfterAt, position: cursorPos, coords: rect ? { top: rect.top - 250, left: rect.left } : { top: 0, left: 0 } })
      } else { setMentionSearch(null) }
    } else { setMentionSearch(null) }
    
    onTyping?.(value.length > 0)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 1000)
  }

  const handleMentionSelect = (member) => {
    if (!mentionSearch) return
    const cursorPos = mentionSearch.position
    const textBeforeCursor = newMessage.slice(0, cursorPos)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')
    if (lastAtPos === -1) return
    const beforeMention = newMessage.slice(0, lastAtPos)
    const afterMention = newMessage.slice(cursorPos)
    const mentionText = `@${member.username || member.first_name} `
    setNewMessage(beforeMention + mentionText + afterMention)
    setMentionSearch(null)
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = lastAtPos + mentionText.length
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        inputRef.current.focus()
      }
    }, 0)
  }

  const handleBlur = () => setTimeout(() => setMentionSearch(null), 200)

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) await handleFileUpload(file)
        break
      }
    }
  }

  const handleFileUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) { alert('Файл слишком большой (макс. 10MB)'); return }
    setUploading(true)
    try {
      const result = await api.uploadFile(file)
      setAttachments(prev => [...prev, { ...result.file, preview: URL.createObjectURL(file) }])
    } catch (error) { alert('Ошибка загрузки: ' + error.message) }
    finally { setUploading(false) }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ''
  }

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => {
      const updated = [...prev]
      if (updated[index]?.preview) URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const canSend = connected && (newMessage.trim().length > 0 || attachments.length > 0)

  const handleSend = () => {
    if (!connected) return
    const hasText = newMessage.trim().length > 0
    const hasAttachments = attachments.length > 0
    if (!hasText && !hasAttachments) return

    if (hasAttachments) {
      onSendFile?.(newMessage.trim(), attachments, replyTo?.id)
      setAttachments([])
    } else if (hasText) {
      onSendMessage(newMessage.trim(), replyTo?.id)
    }
    
    setNewMessage('')
    if (replyTo) onCancelReply?.()
  }

  const handleKeyDown = (e) => {
    if (mentionSearch && e.key === 'Escape') { e.preventDefault(); setMentionSearch(null); return }
    if (e.key === 'Enter' && !e.shiftKey && !mentionSearch) { e.preventDefault(); handleSend() }
  }

  return (
    <div className={`flex-shrink-0 p-3 border-t relative ${darkMode ? 'border-[#2a2a30] bg-[#1a1a1e]' : 'border-gray-200 bg-white'}`}>
      {replyTo && (
        <div className={`mb-2 px-3 py-2 rounded-xl flex items-center justify-between ${darkMode ? 'bg-[#2a2a30]' : 'bg-gray-100'}`}>
          <div className="flex-1 min-w-0">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ответ: {replyTo.user?.first_name}</span>
            <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className={`p-2 rounded-full -mr-1 ${darkMode ? 'hover:bg-[#3f3f46]' : 'hover:bg-gray-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      
      {attachments.length > 0 && (
        <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} darkMode={darkMode} />
      )}
      
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!connected || uploading}
          className={`p-3 rounded-full transition-all flex-shrink-0 ${darkMode ? 'hover:bg-[#2a2a30] text-gray-400' : 'hover:bg-gray-100 text-gray-500'} ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          )}
        </button>
        
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
        
        <div className="flex-1 relative">
          <input ref={inputRef} type="text" value={newMessage} onChange={handleInputChange} onBlur={handleBlur} onPaste={handlePaste} onKeyDown={handleKeyDown}
            placeholder={connected ? 'Сообщение' : 'Подключение...'} disabled={!connected}
            className={`w-full px-4 py-3 text-base border rounded-full focus:outline-none focus:border-[#8b5cf6] transition-colors ${darkMode ? 'bg-[#0f0f13] border-[#3f3f46] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
          
          {mentionSearch && members.length > 0 && (
            <MentionSuggestions members={members} searchQuery={mentionSearch.query} onSelect={handleMentionSelect} darkMode={darkMode} top={mentionSearch.coords.top} left={mentionSearch.coords.left} />
          )}
        </div>
        
        <button type="button" onClick={handleSend} disabled={!canSend}
          className={`p-3 rounded-full transition-all flex-shrink-0 ${canSend ? 'bg-[#6d28d9] text-white hover:bg-[#5b21b6] hover:scale-105' : darkMode ? 'bg-[#2a2a30] text-gray-500' : 'bg-gray-200 text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  )
}
