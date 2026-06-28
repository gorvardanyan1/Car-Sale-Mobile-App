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
      { auth: false },
    );
    expect(result.announcements).toHaveLength(1);
    expect(result.meta.total).toBe(6);
    expect(result.ads).toEqual([{ id: 1, title: 'Promo', link_url: 'https://example.com' }]);
    expect(result.adsInterval).toBe(4);
  });

  it('fetchFavorites requests authenticated favorites list', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: [{ id: 5 }],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    });

    const result = await announcementService.fetchFavorites({ page: 1 });

    expect(apiFetch).toHaveBeenCalledWith(
      '/announcements/favorites?page=1&per_page=15',
      { auth: true },
    );
    expect(result.announcements).toEqual([{ id: 5 }]);
    expect(result.meta.total).toBe(1);
  });

  it('favoriteAnnouncement posts with auth', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { favorited: true } });

    await announcementService.favoriteAnnouncement(12);

    expect(apiFetch).toHaveBeenCalledWith('/announcements/12/favorite', {
      method: 'POST',
      auth: true,
    });
  });

  it('unfavoriteAnnouncement deletes with auth', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { favorited: false } });

    await announcementService.unfavoriteAnnouncement(12);

    expect(apiFetch).toHaveBeenCalledWith('/announcements/12/favorite', {
      method: 'DELETE',
      auth: true,
    });
  });

  it('fetchAllFavoriteIds paginates through favorites', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        meta: { current_page: 1, last_page: 2, per_page: 60, total: 3 },
      })
      .mockResolvedValueOnce({
        data: [{ id: 3 }],
        meta: { current_page: 2, last_page: 2, per_page: 60, total: 3 },
      });

    const ids = await announcementService.fetchAllFavoriteIds();

    expect(ids).toEqual([1, 2, 3]);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
