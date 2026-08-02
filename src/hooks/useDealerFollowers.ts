import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/errors';
import { fetchDealerFollowers } from '@/services/dealerAccountService';
import type { DealerFollower, DealerFollowersMeta } from '@/types/dealer';

const emptyMeta: DealerFollowersMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  followers_count: 0,
};

export function useDealerFollowers() {
  const [followers, setFollowers] = useState<DealerFollower[]>([]);
  const [meta, setMeta] = useState<DealerFollowersMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (page = 1, { isRefresh = false } = {}) => {
    if (page === 1 && !isRefresh) {
      setLoading(true);
    } else if (page > 1) {
      setLoadingMore(true);
    }

    if (isRefresh) {
      setRefreshing(true);
    }

    setError(null);

    try {
      const result = await fetchDealerFollowers(page);
      setFollowers((prev) => (page === 1 ? result.followers : [...prev, ...result.followers]));
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchDealerFollowers(1);
        if (!cancelled) {
          setFollowers(result.followers);
          setMeta(result.meta);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    void loadPage(1, { isRefresh: true });
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || meta.current_page >= meta.last_page) {
      return;
    }

    void loadPage(meta.current_page + 1);
  }, [loadPage, loading, loadingMore, meta.current_page, meta.last_page]);

  return {
    followers,
    followersCount: meta.followers_count ?? 0,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: meta.current_page < meta.last_page,
    refresh,
    loadMore,
  };
}
