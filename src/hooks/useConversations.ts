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

  const refresh = useCallback(async () => {
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
  }, []);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  // Re-fetch whenever a socket event signals the list changed
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
