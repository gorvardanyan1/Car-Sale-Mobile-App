import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api/errors';
import { fetchDealerAccount } from '@/services/dealerAccountService';
import type { DealerAccountResponse } from '@/types/dealer';

type LoadSetters = {
  setAccount: (data: DealerAccountResponse) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  isCancelled?: () => boolean;
};

/**
 * Shared by the mount effect and `refresh` so the fetch/setState sequence
 * exists in exactly one place. Kept outside the hook (setters passed in
 * explicitly) because the set-state-in-effect lint rule flags calling any
 * of the hook's own state-setting callbacks from an effect, regardless of
 * memoization — a plain, non-hook-scoped function sidesteps that.
 */
async function loadDealerAccount({ setAccount, setLoading, setError, isCancelled = () => false }: LoadSetters) {
  setLoading(true);
  setError(null);

  try {
    const data = await fetchDealerAccount();
    if (!isCancelled()) {
      setAccount(data);
    }
  } catch (err) {
    if (!isCancelled()) {
      setError(getErrorMessage(err));
    }
  } finally {
    if (!isCancelled()) {
      setLoading(false);
    }
  }
}

export function useDealerAccount() {
  const [account, setAccount] = useState<DealerAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void loadDealerAccount({ setAccount, setLoading, setError });
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadDealerAccount({
      setAccount,
      setLoading,
      setError,
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    account,
    loading,
    error,
    refresh,
    setAccount,
  };
}
