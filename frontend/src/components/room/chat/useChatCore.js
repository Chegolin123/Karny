import { useState, useRef, useCallback, useEffect } from 'react';
import * as api from '../../../api';
import { useChatWebSocket } from './hooks/useChatWebSocket';
import { createMessage, sortMessages, generateTempId, findMessageIndex, hasMessage } from './chatUtils';

export function useChatCore(roomId, currentUserId, currentUserIdStr, members, isMember, isChatFocused) {
  const [messages, setMessages] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const tempMapRef = useRef(new Map());
  const initialLoadDoneRef = useRef(false);
  const lastSentRef = useRef({ content: '', time: 0 });

  const addMessage = useCallback((raw) => {
    const msg = createMessage(raw);
    if (!msg) return;

    setMessages(prev => {
      if (msg.tempId && hasMessage(prev, msg.tempId)) return prev;
      if (msg.id && hasMessage(prev, msg.id)) return prev;

      if (msg.id && !msg.tempId) {
        const tempEntry = [...tempMapRef.current.entries()].find(([_, tempMsg]) => 
          tempMsg.content === msg.content && tempMsg.userId === msg.userId
        );
        if (tempEntry) {
          const [tempId] = tempEntry;
          const updated = prev.map(m => m.tempId === tempId ? msg : m);
          tempMapRef.current.delete(tempId);
          return sortMessages(updated);
        }
      }

      if (msg.tempId) tempMapRef.current.set(msg.tempId, msg);
      return sortMessages([...prev, msg]);
    });
  }, []);

  const sendMessage = useCallback((content, wsRef) => {
    if (!wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    const trimmed = content.trim();
    if (!trimmed) return false;
    const now = Date.now();
    if (trimmed === lastSentRef.current.content && now - lastSentRef.current.time < 1000) return false;
    lastSentRef.current = { content: trimmed, time: now };

    const tempId = generateTempId();
    addMessage(createMessage({
      tempId, userId: currentUserId, content: trimmed,
      timestamp: new Date().toISOString(),
      user: members?.find(m => String(m.id) === currentUserIdStr) || { id: currentUserId, first_name: 'Вы', last_name: '' }
    }));
    wsRef.current.send(JSON.stringify({ type: 'message', content: trimmed }));
    return true;
  }, [currentUserId, currentUserIdStr, members, addMessage]);

  const sendFile = useCallback((attachments, wsRef, content = '') => {
    if (!wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    if (!attachments?.length) return false;

    const tempId = generateTempId();
    addMessage(createMessage({
      tempId, userId: currentUserId, content: content || '',
      attachments: attachments.map((f, i) => ({ id: `att_${Date.now()}_${i}`, file_name: f.name, file_url: f.url, file_type: f.type, file_size: f.size })),
      timestamp: new Date().toISOString(),
      user: members?.find(m => String(m.id) === currentUserIdStr) || { id: currentUserId, first_name: 'Вы', last_name: '' }
    }));
    wsRef.current.send(JSON.stringify({
      type: 'message', content: content || '',
      attachments: attachments.map(f => ({ name: f.name, url: f.url, type: f.type, size: f.size }))
    }));
    return true;
  }, [currentUserId, currentUserIdStr, members, addMessage]);

  const loadMessages = useCallback(async (beforeId = null) => {
    if (!isMember) return;
    try {
      setIsLoadingMore(true);
      const data = await api.getMessages(roomId, 30, beforeId);
      if (beforeId) {
        const newMessages = (data?.messages || []).map(createMessage).filter(Boolean);
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id).filter(Boolean));
          return sortMessages([...newMessages.filter(m => !ids.has(m.id)), ...prev]);
        });
      } else {
        setMessages(sortMessages((data?.messages || []).map(createMessage).filter(Boolean)));
        setHistoryLoaded(true);
        setIsInitialLoad(false);
        initialLoadDoneRef.current = true;
      }
      setHasMore(data?.hasMore ?? ((data?.messages || []).length === 30));
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [roomId, isMember]);

  const handleWSMessage = useCallback((data) => {
    switch (data.type) {
      case 'message': addMessage(data); break;
      case 'message_edited': setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, content: data.content || '', is_edited: true, edited_at: data.edited_at } : m)); break;
      case 'message_deleted': setMessages(prev => prev.filter(m => m.id !== data.messageId)); break;
      case 'message_pinned': setMessages(prev => sortMessages(prev.map(m => m.id === data.messageId ? { ...m, is_pinned: data.is_pinned } : m))); break;
      case 'message_read': setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, read_count: parseInt(data.read_count, 10) || 0 } : m)); break;
      case 'typing': setTypingUsers(prev => { const next = new Set(prev); data.isTyping && String(data.userId) !== currentUserIdStr ? next.add(data.userId) : next.delete(data.userId); return next; }); break;
      case 'poll_updated': case 'poll_created': if (data.poll) setMessages(prev => prev.map(m => m.poll?.id === data.poll.id ? { ...m, poll: data.poll } : m)); break;
    }
  }, [addMessage, currentUserIdStr]);

  const { connected, connect, sendTyping, ws } = useChatWebSocket(roomId, currentUserId, handleWSMessage, () => {}, () => {});
  const wsRef = useRef(ws);
  useEffect(() => { wsRef.current = ws; }, [ws]);

  useEffect(() => {
    if (!isMember || !roomId) return;
    initialLoadDoneRef.current = false;
    tempMapRef.current.clear();
    setMessages([]);
    connect();
    const fallback = setTimeout(() => { if (!initialLoadDoneRef.current) loadMessages(); }, 3000);
    return () => clearTimeout(fallback);
  }, [roomId, isMember]);

  return {
    messages, setMessages,
    isLoadingMore, hasMore, isInitialLoad, historyLoaded, initialLoadDoneRef,
    typingUsers,
    connected, connect, sendTyping, wsRef,
    addMessage, sendMessage, sendFile, loadMessages, handleWSMessage
  };
}
