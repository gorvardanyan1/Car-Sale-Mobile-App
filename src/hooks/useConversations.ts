import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchConversations, deleteConversation } from '@/services/chatApiService';
import { useChatSocket } from '@/contexts/ChatSocketContext';
import type { ChatConversation } from '@/types/chat';

type UseConversationsReturn = {
  conversations: ChatConversation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  remove: (conversationId: string) => Promise<void>;
};

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { subscribeConversationsRefresh } = useChatSocket();
  const mountedRef = useRef(true);
  // Chat activity (new messages, unread updates) can fire several refresh
  // triggers within the same second. Each request is HMAC-signed over
  // method+path+timestamp-in-seconds+body, and the API rejects duplicate
  // signatures as replays — so firing one fetch per trigger causes real
  // 403s, not just wasted requests. Coalesce concurrent triggers into a
  // single in-flight fetch plus at most one trailing follow-up.
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      do {
        queuedRef.current = false;
        try {
          setError(null);
          const data = await fetchConversations();
          if (mountedRef.current) {
            setConversations(data);
          }
        } catch (err) {
          if (mountedRef.current) {
            setError(err instanceof Error ? err.message : 'Failed to load conversations');
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
      } while (queuedRef.current && mountedRef.current);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  // Re-fetch whenever a socket event signals the list changed (this also
  // fires on reconnect — see ChatSocketContext's `connect` handler — so the
  // list is re-synced after any period of being disconnected).
  useEffect(() => {
    return subscribeConversationsRefresh(() => {
      void refresh();
    });
  }, [subscribeConversationsRefresh, refresh]);

  const remove = useCallback(
    async (conversationId: string) => {
      await deleteConversation(conversationId);
      if (mountedRef.current) {
        setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      }
    },
    [],
  );

  return { conversations, isLoading, error, refresh, remove };
}
