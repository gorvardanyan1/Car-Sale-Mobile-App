import { apiFetch } from '@/lib/api/client';
import type { ApiResponse } from '@/types';

export type MobileAuthConfig = {
  dealer_auth_enabled: boolean;
};

export async function fetchMobileAuthConfig(): Promise<MobileAuthConfig> {
  const response = await apiFetch<ApiResponse<MobileAuthConfig>>('/auth/config');

  return response.data;
}
