import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/errors';
import { fetchReferralOverview } from '@/services/referralService';
import type { ReferralOverview } from '@/types/referral';

export function useReferrals() {
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const nextOverview = await fetchReferralOverview();
      setOverview(nextOverview);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const nextOverview = await fetchReferralOverview();
        if (!cancelled) {
          setOverview(nextOverview);
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

  return {
    overview,
    loading,
    refreshing,
    error,
    refresh: () => loadData(true),
  };
}
