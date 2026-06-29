import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { emptyWantedSearchForm } from '@/lib/wanted-searches/wantedSearchForm';
import {
  createWantedSearch,
  deleteWantedSearch,
  fetchWantedSearchConfig,
  fetchWantedSearches,
  fetchWantedSearchUnreadSummary,
  markWantedSearchMatchesRead,
  updateWantedSearch,
} from '@/services/wantedSearchService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('wantedSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches config and index', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ data: { categories: [], brands: [] } })
      .mockResolvedValueOnce({
        data: {
          wanted_searches: [{ id: 1 }],
          matches: { data: [{ id: 99 }] },
        },
      });

    const config = await fetchWantedSearchConfig();
    const index = await fetchWantedSearches();

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/wanted-searches/config', { auth: true });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/wanted-searches', { auth: true });
    expect(config.categories).toEqual([]);
    expect(index.wanted_searches).toHaveLength(1);
    expect(index.matches?.data).toHaveLength(1);
  });

  it('creates and updates wanted searches with payload', async () => {
    const form = emptyWantedSearchForm(1, 2);
    form.name = 'Test alert';

    vi.mocked(apiFetch).mockResolvedValue({ data: { id: 3, name: 'Test alert' } });

    await createWantedSearch(form);
    await updateWantedSearch(3, form);

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/wanted-searches', {
      method: 'POST',
      auth: true,
      body: expect.objectContaining({ category_id: 1, name: 'Test alert' }),
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/wanted-searches/3', {
      method: 'PUT',
      auth: true,
      body: expect.objectContaining({ category_id: 1, name: 'Test alert' }),
    });
  });

  it('deletes and marks matches read', async () => {
    vi.mocked(apiFetch).mockResolvedValue(undefined);

    await deleteWantedSearch(7);
    await markWantedSearchMatchesRead();

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/wanted-searches/7', {
      method: 'DELETE',
      auth: true,
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/wanted-searches/mark-read', {
      method: 'POST',
      auth: true,
    });
  });

  it('fetches unread summary', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { total_unread: 3 },
    });

    const summary = await fetchWantedSearchUnreadSummary();

    expect(apiFetch).toHaveBeenCalledWith('/wanted-searches/unread-summary', { auth: true });
    expect(summary.total_unread).toBe(3);
  });
});
