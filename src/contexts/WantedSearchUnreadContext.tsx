import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import {
  fetchWantedSearchUnreadSummary,
  markWantedSearchMatchesRead,
} from '@/services/wantedSearchService';

type WantedSearchUnreadContextValue = {
  totalUnread: number;
  refreshUnread: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const WantedSearchUnreadContext = createContext<WantedSearchUnreadContextValue | null>(null);

export function useWantedSearchUnread(): WantedSearchUnreadContextValue {
  const context = useContext(WantedSearchUnreadContext);

  if (!context) {
    throw new Error('useWantedSearchUnread must be used within WantedSearchUnreadProvider');
  }

  return context;
}

export function WantedSearchUnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isIndividualUser = Boolean(user?.roles.includes('user'));
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user || !isIndividualUser) {
      setTotalUnread(0);
      return;
    }

    try {
      const summary = await fetchWantedSearchUnreadSummary();
      setTotalUnread(summary.total_unread);
    } catch {
      setTotalUnread(0);
    }
  }, [isIndividualUser, user]);

  const markAllRead = useCallback(async () => {
    if (!user || !isIndividualUser) {
      return;
    }

    setTotalUnread(0);

    try {
      await markWantedSearchMatchesRead();
    } catch {
      await refreshUnread();
    }
  }, [isIndividualUser, refreshUnread, user]);

  useEffect(() => {
    void refreshUnread();

    const intervalId = setInterval(() => {
      void refreshUnread();
    }, 60_000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshUnread();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [refreshUnread]);

  const value = useMemo(
    () => ({
      totalUnread,
      refreshUnread,
      markAllRead,
    }),
    [markAllRead, refreshUnread, totalUnread],
  );

  return (
    <WantedSearchUnreadContext.Provider value={value}>
      {children}
    </WantedSearchUnreadContext.Provider>
  );
}
