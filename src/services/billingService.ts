import { apiFetch } from '@/lib/api/client';
import type { ApiResponse } from '@/types';
import type { BillingOverview } from '@/types/billing';

export async function fetchBillingOverview(): Promise<BillingOverview> {
  const response = await apiFetch<ApiResponse<BillingOverview>>('/billing', {
    auth: true,
  });

  return response.data;
}

export async function cancelBillingSubscription(subscriptionId: number): Promise<string> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    `/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      auth: true,
    },
  );

  return response.data.message;
}
