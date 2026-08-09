import { useEffect, useState } from 'react';

import { isGoogleAuthConfigured } from '@/lib/auth/googleAuth';
import {
  MOBILE_AUTH_CONFIG_FALLBACK,
  resolveMobileAuthConfig,
  type ResolvedMobileAuthConfig,
} from '@/lib/auth/resolveMobileAuthConfig';
import { fetchMobileAuthConfig } from '@/services/authConfigService';

type MobileAuthConfigState = ResolvedMobileAuthConfig & {
  loading: boolean;
};

/**
 * The server-side auth switches, folded together with what this build can do.
 *
 * Presentation only — every switch is re-checked by the API on the endpoint
 * itself. See {@see resolveMobileAuthConfig} for the fallback policy.
 */
export function useMobileAuthConfig(): MobileAuthConfigState {
  const [state, setState] = useState<ResolvedMobileAuthConfig>(MOBILE_AUTH_CONFIG_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const config = await fetchMobileAuthConfig();

        if (!cancelled) {
          setState(resolveMobileAuthConfig(config, isGoogleAuthConfigured()));
        }
      } catch {
        if (!cancelled) {
          setState(resolveMobileAuthConfig(null, isGoogleAuthConfigured()));
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

  return { ...state, loading };
}
