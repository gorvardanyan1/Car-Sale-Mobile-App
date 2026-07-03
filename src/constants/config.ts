import { readPublicEnv } from '@/lib/env/publicEnv';

const rawApiUrl = readPublicEnv('EXPO_PUBLIC_API_URL') ?? 'http://localhost/api/v1';
const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');

/** Normalized API base URL without trailing slash (includes /v1). */
export const config = {
  apiUrl: normalizedApiUrl,
  /** Legacy web API root (`/api`, without `/v1`) for routes like ai-support. */
  apiRootUrl: normalizedApiUrl.replace(/\/v1$/, ''),
  deviceName: 'mobile',
} as const;

/**
 * Warn in development when EXPO_PUBLIC_API_URL is misconfigured.
 * AI support routes require apiRootUrl (`/api`), derived by stripping `/v1`.
 */
export function validateApiConfig(): void {
  const isDev =
    (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production';

  if (!isDev) {
    return;
  }

  if (!config.apiUrl.endsWith('/v1')) {
    console.warn(
      '[config] EXPO_PUBLIC_API_URL should end with /api/v1 (e.g. http://autohayq/api/v1). ' +
        'Legacy routes such as /api/ai-support use apiRootUrl derived from this value.',
      { apiUrl: config.apiUrl, apiRootUrl: config.apiRootUrl },
    );
  }
}

if ((typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production') {
  validateApiConfig();
}
