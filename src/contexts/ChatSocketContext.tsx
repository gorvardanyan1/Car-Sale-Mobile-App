import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';

import { CHAT_URL } from '@/constants/chat';
import { fetchChatToken, fetchUnreadSummary } from '@/services/chatApiService';
import type { ChatMessageShape } from '@/types/chat';

// ─── Socket.io event shapes ──────────────────────────────────────────────────

interface ServerToClientEvents {
  'message:new': (payload: {
    conversationId: string;
    _id: string;
    senderId: number;
    receiverId: number;
    text: string;
    createdAt: Date;
    isRead: boolean;
  }) => void;
  'presence:update': (payload: { userId: number; online: boolean }) => void;
  'unread:total': (payload: { totalUnread: number }) => void;
  'unread:conversation': (payload: { conversationId: string; unreadCount: number }) => void;
  'notify:message': (payload: {
    conversationId: string;
    senderId: number;
    title: string;
    text: string;
  }) => void;
}

interface ClientToServerEvents {
  'conversation:join': (
    payload: { announcementId: number; buyerId: number; ownerId: number },
    cb: (d: { success: boolean; conversationId?: string; error?: string; partnerOnline?: boolean }) => void,
  ) => void;
  'conversation:join-by-id': (
    payload: { conversationId: string },
    cb: (d: { success: boolean; conversationId?: string; error?: string; partnerOnline?: boolean }) => void,
  ) => void;
  'conversation:leave': (payload?: { conversationId?: string }) => void;
  'conversation:read': (
    payload: { conversationId: string },
    cb: (d: { success: boolean; error?: string }) => void,
  ) => void;
  'message:send': (
    payload: { conversationId: string; text: string },
    cb: (d: { success: boolean; error?: string }) => void,
  ) => void;
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Context value ────────────────────────────────────────────────────────────

export type MessageNewPayload = ChatMessageShape & { conversationId: string };

type ChatSocketContextValue = {
  connected: boolean;
  totalUnread: number;
  unreadByConversation: Record<string, number>;
  presenceByUserId: Record<number, boolean>;
  /** Currently-open conversation id — suppresses unread increments. */
  setActiveConversationId: (id: string | null) => void;
  markConversationRead: (conversationId: string) => void;
  isUserOnline: (userId: number) => boolean;
  sendMessage: (
    conversationId: string,
    text: string,
  ) => Promise<{ success: boolean; error?: string }>;
  joinConversation: (payload: {
    announcementId: number;
    buyerId: number;
    ownerId: number;
  }) => Promise<{ success: boolean; conversationId?: string; partnerOnline?: boolean; error?: string }>;
  /** Join an existing conversation by its MongoDB _id (used for dealer conversations). */
  joinConversationById: (
    conversationId: string,
  ) => Promise<{ success: boolean; conversationId?: string; partnerOnline?: boolean; error?: string }>;
  leaveConversation: (conversationId?: string) => void;
  subscribeMessageNew: (handler: (msg: MessageNewPayload) => void) => () => void;
  subscribeConversationsRefresh: (handler: () => void) => () => void;
  refreshUnreadFromApi: () => Promise<void>;
};

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null);

export function useChatSocket(): ChatSocketContextValue {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error('useChatSocket must be used inside ChatSocketProvider');
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

function isAuthError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /unauthorized|authentication|jwt|token|forbidden/i.test(msg);
}

export function ChatSocketProvider({
  userId,
  children,
}: {
  userId: number | null;
  children: ReactNode;
}) {
  const [connected, setConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, boolean>>({});

  const socketRef = useRef<ChatSocket | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const markReadRef = useRef<(id: string) => void>(() => {});
  const listenersRef = useRef<{
    messageNew: Set<(msg: MessageNewPayload) => void>;
    conversationsRefresh: Set<() => void>;
  }>({ messageNew: new Set(), conversationsRefresh: new Set() });
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // ── Public API helpers ───────────────────────────────────────────────────

  const setActiveConversationId = useCallback((id: string | null) => {
    activeConversationIdRef.current = id;
  }, []);

  const subscribeMessageNew = useCallback(
    (handler: (msg: MessageNewPayload) => void) => {
      listenersRef.current.messageNew.add(handler);
      return () => {
        listenersRef.current.messageNew.delete(handler);
      };
    },
    [],
  );

  const subscribeConversationsRefresh = useCallback((handler: () => void) => {
    listenersRef.current.conversationsRefresh.add(handler);
    return () => {
      listenersRef.current.conversationsRefresh.delete(handler);
    };
  }, []);

  const refreshUnreadFromApi = useCallback(async () => {
    try {
      const summary = await fetchUnreadSummary();
      setTotalUnread(summary.totalUnread ?? 0);
    } catch {
      // non-fatal
    }
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    const id = String(conversationId);
    setUnreadByConversation((prev) => {
      const cleared = prev[id] ?? 0;
      if (cleared > 0) {
        setTotalUnread((total) => Math.max(0, total - cleared));
      }
      return { ...prev, [id]: 0 };
    });
    socketRef.current?.emit('conversation:read', { conversationId: id }, () => {});
  }, []);

  markReadRef.current = markConversationRead;

  const isUserOnline = useCallback(
    (otherUserId: number) => Boolean(presenceByUserId[otherUserId]),
    [presenceByUserId],
  );

  const sendMessage = useCallback(
    (conversationId: string, text: string) =>
      new Promise<{ success: boolean; error?: string }>((resolve) => {
        if (!socketRef.current?.connected) {
          if (__DEV__) console.warn('[chat] sendMessage: socket not connected');
          resolve({ success: false, error: 'Not connected' });
          return;
        }
        const timer = setTimeout(() => resolve({ success: false, error: 'Send timeout' }), 8000);
        socketRef.current.emit('message:send', { conversationId, text }, (ack) => {
          clearTimeout(timer);
          if (__DEV__) console.log('[chat] message:send ack', ack);
          resolve(ack);
        });
      }),
    [],
  );

  const joinConversation = useCallback(
    (payload: { announcementId: number; buyerId: number; ownerId: number }) =>
      new Promise<{
        success: boolean;
        conversationId?: string;
        partnerOnline?: boolean;
        error?: string;
      }>((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, error: 'Not connected' });
          return;
        }
        // Timeout guards against the server not calling the ack (e.g. old server build).
        const timer = setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);
        socketRef.current.emit('conversation:join', payload, (ack) => {
          clearTimeout(timer);
          resolve(ack);
        });
      }),
    [],
  );

  const joinConversationById = useCallback(
    (conversationId: string) =>
      new Promise<{
        success: boolean;
        conversationId?: string;
        partnerOnline?: boolean;
        error?: string;
      }>((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ success: false, error: 'Not connected' });
          return;
        }
        // Timeout guards against old server builds that don't handle join-by-id.
        const timer = setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000);
        socketRef.current.emit('conversation:join-by-id', { conversationId }, (ack) => {
          clearTimeout(timer);
          resolve(ack);
        });
      }),
    [],
  );

  const leaveConversation = useCallback((conversationId?: string) => {
    socketRef.current?.emit('conversation:leave', conversationId ? { conversationId } : undefined);
  }, []);

  // ── Socket event attachment ───────────────────────────────────────────────

  const attachListeners = useCallback((socket: ChatSocket) => {
    socket.on('connect', () => {
      if (__DEV__) console.log('[chat] socket connected', socket.id);
      setConnected(true);
    });
    socket.on('disconnect', (reason) => {
      if (__DEV__) console.warn('[chat] socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', async (error) => {
      if (__DEV__) console.warn('[chat] connect_error:', error.message);
      if (!isAuthError(error)) return;
      try {
        // Refresh the chat JWT and reconnect
        const token = await fetchChatToken();
        socket.auth = { token: `Bearer ${token}` };
        socket.connect();
      } catch {
        setConnected(false);
      }
    });

    socket.on('unread:total', ({ totalUnread: count }) => {
      setTotalUnread(count ?? 0);
    });

    socket.on('unread:conversation', ({ conversationId, unreadCount }) => {
      const id = String(conversationId);
      const isViewing = id === activeConversationIdRef.current;

      if (isViewing && unreadCount > 0) {
        markReadRef.current(id);
        return;
      }

      setUnreadByConversation((prev) => ({ ...prev, [id]: unreadCount }));
      listenersRef.current.conversationsRefresh.forEach((fn) => fn());
    });

    socket.on('presence:update', ({ userId: uid, online }) => {
      setPresenceByUserId((prev) => ({ ...prev, [Number(uid)]: online }));
    });

    socket.on('notify:message', (payload) => {
      const isViewing = payload.conversationId === activeConversationIdRef.current;
      if (!isViewing) {
        listenersRef.current.conversationsRefresh.forEach((fn) => fn());
      }
    });

    socket.on('message:new', (msg) => {
      const typedMsg: MessageNewPayload = {
        _id: msg._id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: msg.text,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      };
      listenersRef.current.messageNew.forEach((fn) => fn(typedMsg));

      const uid = userIdRef.current;
      const isReceiver = Number(msg.receiverId) === Number(uid);
      const isViewing = msg.conversationId === activeConversationIdRef.current;

      if (isReceiver && isViewing) {
        markReadRef.current(msg.conversationId);
        return;
      }
      if (isReceiver) {
        listenersRef.current.conversationsRefresh.forEach((fn) => fn());
      }
    });
  }, []);

  // ── Connection lifecycle ──────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return undefined;

    let cancelled = false;

    const connect = async () => {
      try {
        const token = await fetchChatToken();
        if (cancelled) return;

        if (__DEV__) console.log('[chat] connecting to', CHAT_URL);

        const socket = io(CHAT_URL, {
          transports: ['websocket', 'polling'],
          auth: { token: `Bearer ${token}` },
        }) as ChatSocket;

        socketRef.current = socket;
        attachListeners(socket);
      } catch (err) {
        if (__DEV__) console.warn('[chat] connect error:', err);
      }
    };

    void connect();
    void refreshUnreadFromApi();

    // Reconnect when app comes back to foreground
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && !socketRef.current?.connected && !cancelled) {
        void connect();
        void refreshUnreadFromApi();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppState);

    return () => {
      cancelled = true;
      appStateSub.remove();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [userId, attachListeners, refreshUnreadFromApi]);

  const value = useMemo<ChatSocketContextValue>(
    () => ({
      connected,
      totalUnread,
      unreadByConversation,
      presenceByUserId,
      setActiveConversationId,
      markConversationRead,
      isUserOnline,
      sendMessage,
      joinConversation,
      joinConversationById,
      leaveConversation,
      subscribeMessageNew,
      subscribeConversationsRefresh,
      refreshUnreadFromApi,
    }),
    [
      connected,
      totalUnread,
      unreadByConversation,
      presenceByUserId,
      setActiveConversationId,
      markConversationRead,
      isUserOnline,
      sendMessage,
      joinConversation,
      joinConversationById,
      leaveConversation,
      subscribeMessageNew,
      subscribeConversationsRefresh,
      refreshUnreadFromApi,
    ],
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}
