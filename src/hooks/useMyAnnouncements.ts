import { useCallback, useEffect, useRef, useState } from 'react';

import { MY_ANNOUNCEMENTS_SEARCH_DEBOUNCE_MS } from '@/constants/myAnnouncements';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchMyAnnouncements } from '@/services/announcementService';
import type {
  Announcement,
  MyAnnouncementsSort,
  MyAnnouncementsStats,
  MyAnnouncementsStatus,
} from '@/types/announcement';
import type { FeatureAccessInfo } from '@/types/payment';
import { DEFAULT_URGENT_PRICE_CENTS } from '@/lib/payment/paymentFeatureDisplay';
import { useDebounce } from '@/hooks/useDebounce';

const emptyStats: MyAnnouncementsStats = {
  total: 0,
  active: 0,
  pending: 0,
  urgent: 0,
  views: 0,
};

export function useMyAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<MyAnnouncementsStats>(emptyStats);
  const [urgentPriceCents, setUrgentPriceCents] = useState(DEFAULT_URGENT_PRICE_CENTS);
  const [urgentFeatureAccess, setUrgentFeatureAccess] = useState<FeatureAccessInfo | null>(null);
  const [status, setStatus] = useState<MyAnnouncementsStatus>('');
  const [sort, setSort] = useState<MyAnnouncementsSort>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, MY_ANNOUNCEMENTS_SEARCH_DEBOUNCE_MS);
  const statusRef = useRef(status);
  const sortRef = useRef(sort);
  const searchRef = useRef(debouncedSearch);
  const pageRef = useRef(page);

  statusRef.current = status;
  sortRef.current = sort;
  searchRef.current = debouncedSearch;
  pageRef.current = page;

  const loadPage = useCallback(
    async (
      pageNum: number,
      {
        replace = false,
        nextStatus = statusRef.current,
        nextSort = sortRef.current,
        nextSearch = searchRef.current,
        silent = false,
      }: {
        replace?: boolean;
        nextStatus?: MyAnnouncementsStatus;
        nextSort?: MyAnnouncementsSort;
        nextSearch?: string;
        silent?: boolean;
      } = {},
    ) => {
      if (pageNum === 1) {
        if (!silent) {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const result = await fetchMyAnnouncements({
          page: pageNum,
          status: nextStatus,
          sort: nextSort,
          search: nextSearch,
        });

        setStats(result.meta.stats ?? emptyStats);
        setUrgentPriceCents(result.meta.urgent_price_cents ?? DEFAULT_URGENT_PRICE_CENTS);
        setUrgentFeatureAccess(result.meta.urgent_feature_access ?? null);
        setLastPage(result.meta.last_page);
        setAnnouncements((prev) =>
          replace || pageNum === 1 ? result.announcements : [...prev, ...result.announcements],
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPage(1);
    void loadPage(1, { replace: true });
  }, [debouncedSearch, loadPage, sort, status]);

  const applyStatus = useCallback((nextStatus: MyAnnouncementsStatus) => {
    setStatus(nextStatus);
  }, []);

  const applySort = useCallback((nextSort: MyAnnouncementsSort) => {
    setSort(nextSort);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    void loadPage(1, { replace: true, silent: true });
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || pageRef.current >= lastPage) {
      return;
    }

    const nextPage = pageRef.current + 1;
    setPage(nextPage);
    void loadPage(nextPage, { replace: false, silent: true });
  }, [lastPage, loadPage, loading, loadingMore]);

  const removeAnnouncement = useCallback((id: number) => {
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  const updateAnnouncement = useCallback((id: number, patch: Partial<Announcement>) => {
    setAnnouncements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  return {
    announcements,
    stats,
    urgentPriceCents,
    urgentFeatureAccess,
    status,
    sort,
    search,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: page < lastPage,
    setSearch,
    applyStatus,
    applySort,
    refresh,
    loadMore,
    removeAnnouncement,
    updateAnnouncement,
  };
}
