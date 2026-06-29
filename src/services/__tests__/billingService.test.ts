import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { cancelBillingSubscription, fetchBillingOverview } from '@/services/billingService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches billing overview', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        transactions: [{ id: 1, type: 'urgent', status: 'completed', amount_cents: 2500, currency: 'usd' }],
        subscriptions: [{ id: 2, type: 'pro', status: 'active', amount_cents: 1000, currency: 'usd' }],
      },
    });

    const overview = await fetchBillingOverview();

    expect(apiFetch).toHaveBeenCalledWith('/billing', { auth: true });
    expect(overview.transactions).toHaveLength(1);
    expect(overview.subscriptions).toHaveLength(1);
  });

  it('cancels a subscription', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { message: 'Your subscription will cancel at the end of the current billing period.' },
    });

    const message = await cancelBillingSubscription(5);

    expect(apiFetch).toHaveBeenCalledWith('/billing/subscriptions/5/cancel', {
      method: 'POST',
      auth: true,
    });
    expect(message).toContain('cancel');
  });
});
