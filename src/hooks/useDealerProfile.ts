import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/api/errors';
import { followDealer, unfollowDealer } from '@/services/dealerAccountService';
import { fetchDealerDetail } from '@/services/dealerService';
import type { Announcement, PaginationMeta } from '@/types/announcement';
import type { DealerDetailMeta, DealerProfile, DealerProfileTab } from '@/types/dealer';

const emptyMeta: DealerDetailMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  is_owner: false,
  is_followed: false,
  followers_count: 0,
};

export function useDealerProfile(dealerId: number) {
  const { isAuthenticated } = useAuth();
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [listings, setListings] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<DealerDetailMeta>(emptyMeta);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<DealerProfileTab>('listings');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const skipSearchEffect = useRef(true);
  const searchRef = useRef(debouncedSearch);

  searchRef.current = debouncedSearch;

  const loadPage = useCallback(
    async ({
      page = 1,
      replace = false,
      searchValue = searchRef.current,
      isRefresh = false,
    } = {}) => {
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
        const result = await fetchDealerDetail(dealerId, {
          page,
          search: searchValue,
          auth: isAuthenticated,
        });

        setDealer(result.dealer);
        setListings((prev) => (replace || page === 1 ? result.listings : [...prev, ...result.listings]));
        setMeta(result.meta);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [dealerId, isAuthenticated],
  );

  useEffect(() => {
    void loadPage({ page: 1, replace: true });
  }, [loadPage]);

  useEffect(() => {
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false;
      return;
    }

    void loadPage({ page: 1, replace: true, searchValue: debouncedSearch });
  }, [debouncedSearch, loadPage]);

  const refresh = useCallback(() => {
    void loadPage({ page: 1, replace: true, isRefresh: true });
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || meta.current_page >= meta.last_page) {
      return;
    }

    void loadPage({ page: meta.current_page + 1, replace: false });
  }, [loadPage, loading, loadingMore, meta.current_page, meta.last_page]);

  const toggleFollow = useCallback(async () => {
    if (!isAuthenticated || isTogglingFollow) {
      return;
    }

    setIsTogglingFollow(true);
    const wasFollowed = meta.is_followed ?? false;

    try {
      const result = wasFollowed ? await unfollowDealer(dealerId) : await followDealer(dealerId);
      setMeta((prev) => ({
        ...prev,
        is_followed: result.is_followed,
        followers_count: result.followers_count,
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsTogglingFollow(false);
    }
  }, [dealerId, isAuthenticated, isTogglingFollow, meta.is_followed]);

  return {
    dealer,
    listings,
    meta: meta as PaginationMeta & { is_owner?: boolean },
    isOwner: meta.is_owner ?? false,
    isFollowed: meta.is_followed ?? false,
    followersCount: meta.followers_count ?? 0,
    isTogglingFollow,
    search,
    activeTab,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: meta.current_page < meta.last_page,
    setSearch,
    setActiveTab,
    refresh,
    loadMore,
    toggleFollow,
  };
}
