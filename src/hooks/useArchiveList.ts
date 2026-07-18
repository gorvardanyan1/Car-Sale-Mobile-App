import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import i18n from '@/i18n';

import {
  buildInitialArchiveFilters,
  buildResetArchiveFilters,
} from '@/lib/announcements/archiveFilterState';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchArchive, fetchArchiveConfig } from '@/services/announcementService';
import type {
  Announcement,
  ArchiveConfig,
  ArchiveFeedItem,
  ArchiveFilterState,
  ArchiveSort,
  PaginationMeta,
  SponsoredAd,
  UserLocation,
} from '@/types/announcement';
import { useDebounce } from '@/hooks/useDebounce';
import { interleaveAds } from '@/lib/announcements/interleaveAds';

type UseArchiveListResult = {
  announcements: Announcement[];
  feedItems: ArchiveFeedItem[];
  ads: SponsoredAd[];
  adsInterval: number;
  config: ArchiveConfig | null;
  filters: ArchiveFilterState;
  sort: ArchiveSort;
  page: number;
  meta: PaginationMeta;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  setFilters: React.Dispatch<React.SetStateAction<ArchiveFilterState>>;
  setSearch: (search: string) => void;
  setSort: (sort: ArchiveSort) => void;
  applyFilters: (nextFilters?: ArchiveFilterState) => void;
  resetFilters: () => void;
  loadMore: () => void;
  refresh: () => void;
  requestNearestSort: (getLocation: () => Promise<UserLocation>) => void;
};

const emptyMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 5,
  total: 0,
};

export function useArchiveList(): UseArchiveListResult {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState<ArchiveConfig | null>(null);
  const [filters, setFilters] = useState<ArchiveFilterState>(() => buildInitialArchiveFilters());
  const [sort, setSortState] = useState<ArchiveSort>('default');
  const [page, setPage] = useState(1);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [adsInterval, setAdsInterval] = useState(4);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const skipDebouncedSearch = useRef(true);
  const debouncedSearch = useDebounce(filters.search, 500);
  const filtersRef = useRef(filters);
  const sortRef = useRef(sort);
  const locationRef = useRef(userLocation);

  filtersRef.current = filters;
  sortRef.current = sort;
  locationRef.current = userLocation;

  const loadPage = useCallback(
    async (
      pageNum: number,
      {
        replace = false,
        nextFilters = filtersRef.current,
        nextSort = sortRef.current,
        location = locationRef.current,
        silent = false,
      }: {
        replace?: boolean;
        nextFilters?: ArchiveFilterState;
        nextSort?: ArchiveSort;
        location?: UserLocation | null;
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
        const result = await fetchArchive({
          filters: nextFilters,
          page: pageNum,
          sort: nextSort,
          location: nextSort === 'nearest' ? location : null,
          auth: isAuthenticated,
        });

        setMeta(result.meta);
        setAds(result.ads);
        setAdsInterval(result.adsInterval);
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
    [isAuthenticated],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);

      try {
        const archiveConfig = await fetchArchiveConfig();
        if (cancelled) return;

        setConfig(archiveConfig);

        const initialFilters = buildInitialArchiveFilters({
          defaultCountryId: archiveConfig.default_country_id,
          defaultCurrencyId: archiveConfig.defaultCurrencyId,
          subcategoryFilters: archiveConfig.subcategoryFilters,
        });

        setFilters(initialFilters);
        await loadPage(1, { replace: true, nextFilters: initialFilters });
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  useEffect(() => {
    if (skipDebouncedSearch.current) {
      skipDebouncedSearch.current = false;
      return;
    }

    setPage(1);
    loadPage(1, { replace: true, nextFilters: { ...filtersRef.current, search: debouncedSearch } });
  }, [debouncedSearch, loadPage]);

  const hasMore = useMemo(
    () => meta.current_page < meta.last_page,
    [meta.current_page, meta.last_page],
  );

  const feedItems = useMemo(
    () => interleaveAds(announcements, ads, adsInterval),
    [announcements, ads, adsInterval],
  );

  const applyFilters = useCallback(
    (nextFilters?: ArchiveFilterState) => {
      const resolved = nextFilters ?? filtersRef.current;
      setFilters(resolved);
      setPage(1);
      loadPage(1, { replace: true, nextFilters: resolved });
    },
    [loadPage],
  );

  const resetFilters = useCallback(() => {
    if (!config) return;

    const reset = buildResetArchiveFilters(
      filtersRef.current.search,
      config.default_country_id,
      config.defaultCurrencyId,
      filtersRef.current.subcategory_slug,
    );

    setFilters(reset);
    setPage(1);
    loadPage(1, { replace: true, nextFilters: reset });
  }, [config, loadPage]);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setSort = useCallback(
    (nextSort: ArchiveSort) => {
      setSortState(nextSort);
      setPage(1);
      loadPage(1, { replace: true, nextSort });
    },
    [loadPage],
  );

  const requestNearestSort = useCallback(
    (getLocation: () => Promise<UserLocation>) => {
      const previousSort = sortRef.current;
      setSortState('nearest');
      setPage(1);

      getLocation()
        .then((location) => {
          setUserLocation(location);
          loadPage(1, { replace: true, nextSort: 'nearest', location });
        })
        .catch(() => {
          setSortState(previousSort);
          setError(i18n.t('mobile.errors.location_required'));
        });
    },
    [loadPage],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(nextPage, { replace: false, silent: true });
  }, [hasMore, loadPage, loading, loadingMore, page]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadPage(1, { replace: true, silent: true });
  }, [loadPage]);

  return {
    announcements,
    feedItems,
    ads,
    adsInterval,
    config,
    filters,
    sort,
    page,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    setFilters,
    setSearch,
    setSort,
    applyFilters,
    resetFilters,
    loadMore,
    refresh,
    requestNearestSort,
  };
}
