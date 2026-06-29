import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/api/errors';
import {
  emptyWantedSearchForm,
  mapWantedSearchToForm,
} from '@/lib/wanted-searches/wantedSearchForm';
import { fetchBrandModels } from '@/services/announcementService';
import {
  createWantedSearch,
  deleteWantedSearch,
  fetchWantedSearchConfig,
  fetchWantedSearches,
  updateWantedSearch,
} from '@/services/wantedSearchService';
import { useWantedSearchUnread } from '@/contexts/WantedSearchUnreadContext';
import type { Announcement, CarModel } from '@/types/announcement';
import type {
  WantedSearch,
  WantedSearchConfig,
  WantedSearchFormState,
} from '@/types/wantedSearch';

export function useWantedSearches() {
  const { markAllRead } = useWantedSearchUnread();
  const [config, setConfig] = useState<WantedSearchConfig | null>(null);
  const [searches, setSearches] = useState<WantedSearch[]>([]);
  const [matches, setMatches] = useState<Announcement[]>([]);
  const [form, setForm] = useState<WantedSearchFormState>(emptyWantedSearchForm(null));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [models, setModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessGranted = useMemo(
    () => !config?.featureAccess || config.featureAccess.status === 'granted',
    [config?.featureAccess],
  );

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [nextConfig, index] = await Promise.all([
        fetchWantedSearchConfig(),
        fetchWantedSearches(),
      ]);

      setConfig(nextConfig);
      setSearches(index.wanted_searches);
      setMatches(index.matches?.data ?? []);
      setForm((prev) =>
        editingId
          ? prev
          : emptyWantedSearchForm(
              nextConfig.defaultCategoryId,
              nextConfig.defaultCurrencyId,
            ),
      );

      try {
        await markAllRead();
      } catch {
        // Feature may be locked; index still loads for read-only UI.
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [editingId, markAllRead]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!form.car_brand_id) {
      setModels([]);
      return;
    }

    let cancelled = false;
    setLoadingModels(true);

    fetchBrandModels(form.car_brand_id)
      .then((nextModels) => {
        if (!cancelled) {
          setModels(nextModels);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingModels(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.car_brand_id]);

  const updateForm = useCallback((patch: Partial<WantedSearchFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const startCreate = useCallback(() => {
    if (!config) {
      return;
    }

    setEditingId(null);
    setForm(emptyWantedSearchForm(config.defaultCategoryId, config.defaultCurrencyId));
  }, [config]);

  const startEdit = useCallback(
    (search: WantedSearch) => {
      if (!config) {
        return;
      }

      setEditingId(search.id);
      setForm(mapWantedSearchToForm(search, config.defaultCategoryId));
    },
    [config],
  );

  const cancelEdit = useCallback(() => {
    if (!config) {
      return;
    }

    setEditingId(null);
    setForm(emptyWantedSearchForm(config.defaultCategoryId, config.defaultCurrencyId));
  }, [config]);

  const submit = useCallback(async () => {
    if (!config) {
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await updateWantedSearch(editingId, form);
      } else {
        await createWantedSearch(form);
      }

      setEditingId(null);
      setForm(emptyWantedSearchForm(config.defaultCategoryId, config.defaultCurrencyId));
      await loadData(true);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [config, editingId, form, loadData]);

  const remove = useCallback(
    async (id: number) => {
      setSubmitting(true);
      setError(null);

      try {
        await deleteWantedSearch(id);
        if (editingId === id) {
          cancelEdit();
        }
        await loadData(true);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [cancelEdit, editingId, loadData],
  );

  return {
    config,
    searches,
    matches,
    form,
    editingId,
    models,
    loading,
    refreshing,
    loadingModels,
    submitting,
    error,
    accessGranted,
    updateForm,
    startCreate,
    startEdit,
    cancelEdit,
    submit,
    remove,
    refresh: () => loadData(true),
  };
}
