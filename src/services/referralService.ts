import { apiFetch } from '@/lib/api/client';
import type { ApiResponse } from '@/types';
import type { ReferralOverview } from '@/types/referral';

export async function fetchReferralOverview(): Promise<ReferralOverview> {
  const response = await apiFetch<ApiResponse<ReferralOverview>>('/referrals', {
    auth: true,
  });

  return response.data;
}
