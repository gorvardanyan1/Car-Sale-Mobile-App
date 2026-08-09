import { apiFetch } from '@/lib/api/client';
import type { ApiResponse } from '@/types';

/**
 * Server-side switches the auth screens need (Settings → Authentication).
 *
 * These are presentation only. Every one of them is re-checked by the API on
 * the endpoint itself, so hiding a button here closes nothing on its own — it
 * just avoids walking someone into a form the server will refuse.
 */
export type MobileAuthConfig = {
  dealer_auth_enabled: boolean;
  /** Email/password signup on mobile. */
  registration_enabled: boolean;
  /** Native Google sign-in: admin switch AND configured client IDs. */
  google_enabled: boolean;
  /** Whether a Google sign-in may create a brand-new account. */
  google_registration_enabled: boolean;
};

export async function fetchMobileAuthConfig(): Promise<MobileAuthConfig> {
  const response = await apiFetch<ApiResponse<MobileAuthConfig>>('/auth/config');

  return response.data;
}
