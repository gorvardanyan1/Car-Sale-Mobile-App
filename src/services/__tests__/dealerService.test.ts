import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { fetchDealerDetail, fetchDealers } from '@/services/dealerService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('dealerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches dealer directory with query params', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: [{ id: 1, name: 'Best Motors', verified: true }],
      meta: { current_page: 1, last_page: 1, per_page: 12, total: 1, verified_count: 1 },
    });

    const result = await fetchDealers({ page: 1, search: 'best', sort: 'listings' });

    expect(apiFetch).toHaveBeenCalledWith('/dealers?page=1&sort=listings&per_page=12&search=best');
    expect(result.dealers).toHaveLength(1);
    expect(result.meta.verified_count).toBe(1);
  });

  it('fetches dealer profile with listings', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        dealer: { id: 8, name: 'AutoLux', verified: true, stats: { total_listings: 2, active_listings: 1, sold_vehicles: 1 } },
        listings: [{ id: 100 }],
      },
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, is_owner: false },
    });

    const result = await fetchDealerDetail(8, { search: 'bmw' });

    expect(apiFetch).toHaveBeenCalledWith('/dealers/8?page=1&per_page=15&search=bmw', { auth: false });
    expect(result.dealer.name).toBe('AutoLux');
    expect(result.listings).toHaveLength(1);
  });
});
