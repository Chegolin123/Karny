import { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../../api';
import { useChatCore } from './useChatCore';
import { useNotification } from '../../../contexts/NotificationContext';
import ChatHeader from './ChatHeader';
import PinnedMessages from './PinnedMessages';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import PollModal from './PollModal';

export default function RoomChat({ roomId, members, darkMode, autoScrollToBottom = false, hideHeader = false }) {
  const navigate = useNavigate();
  const currentUserId = api.getCurrentUserId();
  const currentUserIdStr = String(currentUserId);
  const { notifyChatMessage } = useNotification();

  const [isMember, setIsMember] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFocus = () => setIsChatFocused(true);
    const handleBlur = () => setIsChatFocused(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const {
    messages, setMessages,
    isLoadingMore, hasMore, isInitialLoad,
    typingUsers,
    connected, connect, sendTyping, wsRef,
    addMessage, sendMessage, sendFile, loadMessages
  } = useChatCore(roomId, currentUserId, currentUserIdStr, members, isMember, isChatFocused);

  useEffect(() => {
    if (!roomId || !currentUserId) return;
    api.getRoom(roomId).then(data => {
      const ownerId = data?.room?.owner_id;
      setIsAdmin(ownerId == currentUserId);
      const member = data?.members?.find(m => m.id == currentUserId);
      if (!member && ownerId != currentUserId) {
        setIsMember(false);
        setAccessError('Вступите в комнату чтобы общаться');
      } else {
        setIsMember(true);
        setAccessError(null);
      }
    }).catch(() => {});
  }, [roomId, currentUserId]);

  const handleSendText = useCallback((content) => {
    if (!connected) return false;
    return sendMessage(content, wsRef);
  }, [connected, sendMessage, wsRef]);

  const handleSendFile = useCallback((content, attachments) => {
    if (!connected) return false;
    return sendFile(attachments, wsRef, content);
  }, [connected, sendFile, wsRef]);

  const handleReply = useCallback((msg) => setReplyTo(msg), []);
  const handleCancelReply = useCallback(() => setReplyTo(null), []);

  const handleEdit = useCallback((msg, newContent) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'edit_message', messageId: msg.id, content: newContent.trim() }));
  }, []);

  const handleDelete = useCallback((msg) => {
    if (!confirm('Удалить сообщение?')) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'delete_message', messageId: msg.id }));
  }, []);

  const handlePin = useCallback((msg) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'pin_message', messageId: msg.id }));
  }, []);

  const handleMarkAsRead = useCallback((messageId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'mark_read', messageId }));
  }, []);

  const handleVotePoll = useCallback(async (pollId, optionIds) => {
    try {
      await api.votePoll(roomId, pollId, optionIds);
      const result = await api.getPoll(roomId, pollId);
      setMessages(prev => prev.map(m => m.poll?.id === pollId ? { ...m, poll: result.poll } : m));
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'poll_updated', poll: result.poll }));
      }
    } catch (e) { alert('Ошибка голосования: ' + e.message); }
  }, [roomId, setMessages]);

  const handleClosePoll = useCallback(async (pollId) => {
    try {
      await api.closePoll(roomId, pollId);
      const result = await api.getPoll(roomId, pollId);
      setMessages(prev => prev.map(m => m.poll?.id === pollId ? { ...m, poll: result.poll } : m));
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'poll_updated', poll: result.poll }));
      }
    } catch (e) { alert('Ошибка закрытия опроса: ' + e.message); }
  }, [roomId, setMessages]);

  const handleCreatePoll = useCallback(async (question, options, isAnonymous, isMultiple) => {
    try {
      const result = await api.createPoll(roomId, question, options, isAnonymous, isMultiple);
      addMessage({
        id: `poll_${result.poll.id}`,
        type: 'poll',
        poll: result.poll,
        userId: currentUserId,
        timestamp: new Date().toISOString()
      });
      setShowPollModal(false);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'poll_created', poll: result.poll }));
      }
    } catch (e) { alert('Ошибка создания опроса: ' + e.message); }
  }, [roomId, currentUserId, addMessage]);

  if (!isMember) {
    return (
      <div className={`flex flex-col h-full border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4 opacity-50">🔒</div>
            <h3 className="text-lg font-medium mb-2">Нет доступа к чату</h3>
            <p className="text-sm text-gray-500">{accessError || 'Вступите в комнату'}</p>
          </div>
        </div>
      </div>
    );
  }

  const pinned = messages.filter(m => m.is_pinned);

  return (
    <div className={`flex flex-col h-full border-t ${darkMode ? 'border-[#2a2a30]' : 'border-gray-200'}`}>
      {!hideHeader && (
        <ChatHeader
          connected={connected}
          darkMode={darkMode}
          roomId={roomId}
          onBack={() => navigate(`/room/${roomId}`)}
          onPollClick={() => setShowPollModal(true)}
        />
      )}

      {pinned.length > 0 && (
        <PinnedMessages
          messages={pinned}
          members={members}
          currentUserIdStr={currentUserIdStr}
          darkMode={darkMode}
          onUnpin={handlePin}
          isAdmin={isAdmin}
          onReply={handleReply}
        />
      )}

      <MessageList
        ref={{ container: containerRef, messagesEnd: messagesEndRef }}
        messages={messages.filter(m => !m.is_pinned)}
        members={members}
        currentUserIdStr={currentUserIdStr}
        darkMode={darkMode}
        isLoadingMore={isLoadingMore}
        typingUsers={typingUsers}
        onScroll={(e) => {
          if (containerRef.current && containerRef.current.scrollTop < 50 && hasMore && !isLoadingMore) {
            const first = messages.find(m => !m.is_pinned && !m.poll && !m.tempId && m.id);
            if (first) loadMessages(first.id);
          }
        }}
        isAdmin={isAdmin}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPin={handlePin}
        onMarkAsRead={handleMarkAsRead}
        isChatFocused={isChatFocused}
        onVotePoll={handleVotePoll}
        onClosePoll={handleClosePoll}
        roomId={roomId}
      />

      <MessageInput
        connected={connected}
        darkMode={darkMode}
        onSendMessage={handleSendText}
        onSendFile={handleSendFile}
        onTyping={sendTyping}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        roomId={roomId}
      />

      {showPollModal && (
        <PollModal
          show={showPollModal}
          onClose={() => setShowPollModal(false)}
          onSubmit={handleCreatePoll}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
