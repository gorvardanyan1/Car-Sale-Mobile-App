import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchMessages } from '@/services/chatApiService';
import { useChatSocket } from '@/contexts/ChatSocketContext';
import type { ChatMessageShape } from '@/types/chat';

type UseChatThreadReturn = {
  messages: ChatMessageShape[];
  isLoading: boolean;
  error: string | null;
  isSending: boolean;
  sendError: string | null;
  sendMessage: (text: string) => Promise<void>;
};

export function useChatThread(conversationId: string | null): UseChatThreadReturn {
  const [messages, setMessages] = useState<ChatMessageShape[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    setActiveConversationId,
    markConversationRead,
    subscribeMessageNew,
    subscribeReconnected,
    sendMessage: socketSend,
  } = useChatSocket();

  const mountedRef = useRef(true);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Register / unregister as active conversation
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => {
      setActiveConversationId(null);
    };
  }, [conversationId, setActiveConversationId]);

  // Load message history
  useEffect(() => {
    mountedRef.current = true;

    if (!conversationId) {
      setMessages([]);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    fetchMessages(conversationId)
      .then((data) => {
        if (mountedRef.current) {
          setMessages(data);
          // Mark all as read once loaded
          markConversationRead(conversationId);
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      })
      .finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, [conversationId, markConversationRead]);

  // Real-time: append incoming messages from the socket
  useEffect(() => {
    return subscribeMessageNew((msg) => {
      if (msg.conversationId !== conversationIdRef.current) return;

      setMessages((prev) => {
        // Deduplicate by _id
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Mark read immediately since we are viewing this thread
      if (conversationIdRef.current) {
        markConversationRead(conversationIdRef.current);
      }
    });
  }, [subscribeMessageNew, markConversationRead]);

  // Re-sync on reconnect: any messages sent/received while the socket was
  // disconnected arrive only via REST, since `message:new` is a live event
  // and isn't replayed for missed time — without this, messages sent during
  // a dropped connection would silently never appear in the open thread.
  useEffect(() => {
    return subscribeReconnected(() => {
      const id = conversationIdRef.current;
      if (!id) return;

      fetchMessages(id)
        .then((data) => {
          if (!mountedRef.current || conversationIdRef.current !== id) return;
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m._id));
            const missing = data.filter((m) => !known.has(m._id));
            if (missing.length === 0) return prev;
            return [...prev, ...missing];
          });
          markConversationRead(id);
        })
        .catch(() => {
          // non-fatal — the live event stream will catch subsequent messages
        });
    });
  }, [subscribeReconnected, markConversationRead]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !text.trim()) return;

      setSendError(null);
      setIsSending(true);

      try {
        const result = await socketSend(conversationId, text.trim());
        if (!result.success) {
          setSendError(result.error ?? 'Failed to send');
        }
      } catch {
        setSendError('Failed to send');
      } finally {
        if (mountedRef.current) setIsSending(false);
      }
    },
    [conversationId, socketSend],
  );

  return { messages, isLoading, error, isSending, sendError, sendMessage };
}
