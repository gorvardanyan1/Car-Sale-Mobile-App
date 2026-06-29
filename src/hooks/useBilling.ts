import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/errors';
import { cancelBillingSubscription, fetchBillingOverview } from '@/services/billingService';
import type { BillingOverview, BillingSubscription, BillingTab } from '@/types/billing';

export function useBilling() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [activeTab, setActiveTab] = useState<BillingTab>('one_time');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const nextOverview = await fetchBillingOverview();
      setOverview(nextOverview);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const cancelSubscription = useCallback(
    async (subscription: BillingSubscription) => {
      setCancelingId(subscription.id);
      setError(null);
      setSuccessMessage(null);

      try {
        const message = await cancelBillingSubscription(subscription.id);
        setSuccessMessage(message);
        setActiveTab('subscription');
        await loadData(true);
        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setCancelingId(null);
      }
    },
    [loadData],
  );

  return {
    transactions: overview?.transactions ?? [],
    subscriptions: overview?.subscriptions ?? [],
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    cancelingId,
    error,
    successMessage,
    clearSuccessMessage: () => setSuccessMessage(null),
    refresh: () => loadData(true),
    cancelSubscription,
  };
}
