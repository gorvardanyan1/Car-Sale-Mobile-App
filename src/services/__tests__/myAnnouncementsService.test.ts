import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { fetchMyAnnouncements } from '@/services/announcementService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('fetchMyAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests seller listings with filters and unwraps stats meta', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: [{ id: 1, status: 'active' }],
      meta: {
        current_page: 1,
        last_page: 2,
        per_page: 10,
        total: 11,
        stats: { total: 11, active: 8, pending: 2, urgent: 1, views: 40 },
        urgent_price_cents: 2500,
        urgent_feature_access: {
          status: 'payment_required',
          feature: 'urgent_announcement',
          reason: 'payment_required',
          billing_mode: 'one_time',
          price_cents: 2500,
          stripe_price_id: null,
        },
      },
    });

    const result = await fetchMyAnnouncements({
      page: 1,
      status: 'active',
      sort: 'price-low',
      search: 'BMW',
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/my-announcements?page=1&per_page=10&sort=price-low&status=active&search=BMW',
      { auth: true },
    );
    expect(result.announcements).toHaveLength(1);
    expect(result.meta.stats?.active).toBe(8);
    expect(result.meta.urgent_price_cents).toBe(2500);
    expect(result.meta.urgent_feature_access?.status).toBe('payment_required');
  });
});
