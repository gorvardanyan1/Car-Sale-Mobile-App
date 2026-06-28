import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import * as announcementService from '@/services/announcementService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('announcementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchArchiveConfig unwraps data', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        countries: [],
        currencies: [],
        subcategoryFilters: [],
        brands: [],
        default_country_id: 1,
        defaultCurrencyId: 1,
      },
    });

    const config = await announcementService.fetchArchiveConfig();

    expect(apiFetch).toHaveBeenCalledWith('/announcements/archive/config');
    expect(config.default_country_id).toBe(1);
  });

  it('fetchArchive builds query and returns meta', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: [{ id: 10 }],
      meta: {
        current_page: 1,
        last_page: 2,
        per_page: 5,
        total: 6,
        ads: [{ id: 1, title: 'Promo', link_url: 'https://example.com' }],
        ads_interval: 4,
      },
    });

    const result = await announcementService.fetchArchive({
      filters: {
        search: '',
        country_id: 1,
        place_id: '',
        currency_id: 1,
        mileage_unit: 'km',
        subcategory_slug: '',
      },
      page: 1,
      sort: 'default',
    });

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('/announcements/archive?'),
    );
    expect(result.announcements).toHaveLength(1);
    expect(result.meta.total).toBe(6);
    expect(result.ads).toEqual([{ id: 1, title: 'Promo', link_url: 'https://example.com' }]);
    expect(result.adsInterval).toBe(4);
  });
});
