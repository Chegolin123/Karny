import { useState, useRef, useCallback, useEffect } from 'react';
import MemberAvatar from '../MemberAvatar';
import MessageContextMenu from './MessageContextMenu';
import MessageStatus from './MessageStatus';
import { formatMessageTime, isRenderable } from './chatUtils';

function MessageTime({ timestamp }) {
  const time = formatMessageTime(timestamp);
  if (!time) return null;
  return (
    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{time}</span>
  );
}

function MessageAttachments({ attachments, darkMode }) {
  if (!attachments?.length) return null;
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return window.location.origin + url;
  };
  return (
    <div className="mt-2 space-y-2">
      {attachments.map((att, index) => {
        if (!att) return null;
        const url = getFullUrl(att.file_url || att.url);
        const isImage = att.file_type?.startsWith('image/') || att.type?.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i);
        if (isImage && url) {
          return <img key={att.id || index} src={url} alt="" className="max-w-full rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" style={{ maxHeight: 300 }} onClick={() => window.open(url, '_blank')} onError={(e) => { e.target.style.display = 'none'; }} />;
        }
        return null;
      })}
    </div>
  );
}

export default function MessageBubble({ message, isOwn, sender, showAvatar, showName, darkMode, isAdmin, onReply, onEdit, onDelete, onPin, onMarkAsRead, isChatFocused }) {
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message?.content || '');
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [visible, setVisible] = useState(false);
  const startX = useRef(0);
  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => { const timer = setTimeout(() => setVisible(true), 10); return () => clearTimeout(timer); }, []);

  if (!message || !isRenderable(message)) return null;

  const openContextMenu = useCallback((x, y) => setContextMenu({ show: true, x, y }), []);
  const closeContextMenu = useCallback(() => setContextMenu({ show: false, x: 0, y: 0 }), []);

  const handleContextMenu = (e) => { e.preventDefault(); openContextMenu(e.clientX, e.clientY); };
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    startX.current = touch.clientX;
    setIsSwiping(true);
    longPressTimer.current = setTimeout(() => { openContextMenu(touchStartPos.current.x, touchStartPos.current.y); setIsSwiping(false); setSwipeOffset(0); }, 500);
  }, [openContextMenu]);
  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return;
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    const diff = e.touches[0].clientX - startX.current;
    if (diff > 0) setSwipeOffset(Math.min(diff, 80));
  }, [isSwiping]);
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsSwiping(false);
    if (swipeOffset > 50 && onReply) onReply(message);
    setSwipeOffset(0);
  }, [swipeOffset, onReply, message]);

  const handleEditSubmit = (e) => { e.preventDefault(); const trimmed = editContent.trim(); if (trimmed && trimmed !== message.content && onEdit) onEdit(message, trimmed); setIsEditing(false); };

  const hasContent = message.content && message.content.trim().length > 0;
  const hasAttachments = message.attachments?.length > 0;
  const timestamp = message.timestamp || message.created_at;

  return (
    <>
      <div
        className={`flex items-end gap-2 select-none ${isOwn ? 'justify-end' : 'justify-start'} group relative transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: isSwiping ? 'none' : 'all 0.2s ease-out' }}
      >
        {!isOwn && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar && sender ? <MemberAvatar member={sender} size="md" /> : <div className="w-8 h-8" />}
          </div>
        )}
        <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
          {showName && sender && <span className="text-xs ml-1 mb-1 block text-gray-400 dark:text-gray-500">{sender.first_name}</span>}
          {message.reply_to_content && (
            <div className={`text-xs mb-1 px-2 py-1.5 rounded-lg border-l-2 ${darkMode ? 'bg-[#2a2a30] border-[#8b5cf6] text-gray-400' : 'bg-gray-100 border-[#8b5cf6] text-gray-600'}`}>
              <span className="font-medium">{message.reply_to_first_name}:</span> {message.reply_to_content}
            </div>
          )}
          <div className={`flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
                <input type="text" value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && (setIsEditing(false), setEditContent(message.content || ''))} className={`px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-[#2a2a30] text-white border border-[#3f3f46]' : 'bg-white text-gray-900 border border-gray-300'}`} autoFocus />
                <button type="submit" className="text-[#8b5cf6] text-lg">✓</button>
                <button type="button" onClick={() => { setIsEditing(false); setEditContent(message.content || ''); }} className="text-gray-500 text-lg">✕</button>
              </form>
            ) : (
              <>
                {isOwn && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <MessageStatus message={message} isOwn={isOwn} isChatFocused={isChatFocused} onMarkAsRead={onMarkAsRead} />
                    <MessageTime timestamp={timestamp} />
                  </div>
                )}
                <div className={`relative px-3.5 py-2.5 rounded-2xl break-words ${isOwn ? 'bg-[#6d28d9] text-white rounded-br-md' : darkMode ? 'bg-[#2a2a30] text-white rounded-bl-md' : 'bg-white text-gray-900 rounded-bl-md shadow-sm'}`}>
                  {message.is_pinned && (
                    <div className="absolute -top-1.5 -left-1.5 z-10">
                      <svg className="w-3.5 h-3.5 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </div>
                  )}
                  {hasContent && <span className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</span>}
                  {message.is_edited && <span className={`ml-1.5 text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>(ред.)</span>}
                  <MessageAttachments attachments={message.attachments} darkMode={darkMode} />
                </div>
                {!isOwn && <MessageTime timestamp={timestamp} />}
              </>
            )}
          </div>
        </div>
        {isOwn && <div className="w-8 h-8 flex-shrink-0" />}
        {swipeOffset > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center px-2 pointer-events-none" style={{ opacity: Math.min(swipeOffset / 30, 1) }}>
            <div className={`p-2 rounded-full ${darkMode ? 'bg-[#8b5cf6]' : 'bg-[#6d28d9]'}`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </div>
          </div>
        )}
      </div>
      <MessageContextMenu show={contextMenu.show} x={contextMenu.x} y={contextMenu.y} message={message} isOwn={isOwn} isAdmin={isAdmin} onClose={closeContextMenu} onReply={onReply} onEdit={(msg) => { setIsEditing(true); setEditContent(msg.content || ''); }} onDelete={onDelete} onPin={onPin} darkMode={darkMode} />
    </>
  );
}
