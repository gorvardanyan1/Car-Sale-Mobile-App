import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchDealers } from '@/services/dealerService';
import type { DealerCard, DealerDirectoryMeta, DealerSort } from '@/types/dealer';
import type { PaginationMeta } from '@/types/announcement';

const emptyMeta: DealerDirectoryMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
  verified_count: 0,
};

type ViewMode = 'grid' | 'list';

export function useDealerDirectory() {
  const [dealers, setDealers] = useState<DealerCard[]>([]);
  const [meta, setMeta] = useState<DealerDirectoryMeta>(emptyMeta);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DealerSort>('rating');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const skipSearchEffect = useRef(true);
  const skipSortEffect = useRef(true);
  const sortRef = useRef(sort);
  const searchRef = useRef(debouncedSearch);

  sortRef.current = sort;
  searchRef.current = debouncedSearch;

  const loadPage = useCallback(
    async ({
      page = 1,
      replace = false,
      searchValue = searchRef.current,
      sortValue = sortRef.current,
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
        const result = await fetchDealers({
          page,
          search: searchValue,
          sort: sortValue,
        });

        setDealers((prev) => (replace || page === 1 ? result.dealers : [...prev, ...result.dealers]));
        setMeta(result.meta);
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
    void loadPage({ page: 1, replace: true });
  }, [loadPage]);

  useEffect(() => {
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false;
      return;
    }

    void loadPage({ page: 1, replace: true, searchValue: debouncedSearch });
  }, [debouncedSearch, loadPage]);

  useEffect(() => {
    if (skipSortEffect.current) {
      skipSortEffect.current = false;
      return;
    }

    void loadPage({ page: 1, replace: true, sortValue: sort });
  }, [sort, loadPage]);

  const refresh = useCallback(() => {
    void loadPage({ page: 1, replace: true, isRefresh: true });
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || meta.current_page >= meta.last_page) {
      return;
    }

    void loadPage({ page: meta.current_page + 1, replace: false });
  }, [loadPage, loading, loadingMore, meta.current_page, meta.last_page]);

  const hasMore = meta.current_page < meta.last_page;

  return {
    dealers,
    meta: meta as PaginationMeta & { verified_count?: number },
    verifiedCount: meta.verified_count ?? 0,
    search,
    sort,
    viewMode,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    setSearch,
    setSort,
    setViewMode,
    refresh,
    loadMore,
  };
}
