import { useEffect, useState } from 'react';

import { fetchMobileAuthConfig } from '@/services/authConfigService';

type MobileAuthConfigState = {
  dealerAuthEnabled: boolean;
  loading: boolean;
};

export function useMobileAuthConfig(): MobileAuthConfigState {
  const [dealerAuthEnabled, setDealerAuthEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const config = await fetchMobileAuthConfig();

        if (!cancelled) {
          setDealerAuthEnabled(Boolean(config.dealer_auth_enabled));
        }
      } catch {
        if (!cancelled) {
          setDealerAuthEnabled(false);
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

  return { dealerAuthEnabled, loading };
}
