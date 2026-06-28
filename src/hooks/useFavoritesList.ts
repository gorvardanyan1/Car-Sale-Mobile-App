import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage } from '@/lib/api/errors';
import { fetchFavorites } from '@/services/announcementService';
import type { Announcement, PaginationMeta } from '@/types/announcement';

type UseFavoritesListResult = {
  announcements: Announcement[];
  meta: PaginationMeta;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  removeAnnouncement: (id: number) => void;
};

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

export function useFavoritesList(): UseFavoritesListResult {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(page);
  pageRef.current = page;

  const loadPage = useCallback(
    async (
      pageNum: number,
      { replace = false, silent = false }: { replace?: boolean; silent?: boolean } = {},
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
        const result = await fetchFavorites({ page: pageNum, perPage: 15 });
        setMeta(result.meta);
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
    void loadPage(1, { replace: true });
  }, [loadPage]);

  const hasMore = useMemo(
    () => meta.current_page < meta.last_page,
    [meta.current_page, meta.last_page],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;

    const nextPage = pageRef.current + 1;
    setPage(nextPage);
    void loadPage(nextPage, { replace: false, silent: true });
  }, [hasMore, loadPage, loading, loadingMore]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    void loadPage(1, { replace: true, silent: true });
  }, [loadPage]);

  const removeAnnouncement = useCallback((id: number) => {
    setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
    setMeta((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  return {
    announcements,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    removeAnnouncement,
  };
}
