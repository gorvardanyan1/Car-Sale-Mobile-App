import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import * as archiveAiSearchService from '@/services/archiveAiSearchService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

describe('archiveAiSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchArchiveAiSearch posts to v1 endpoint and unwraps data', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        announcements: [{ id: 1 }],
        filters: { brand: 'Toyota' },
        search_params: { brand_id: 2 },
      },
      meta: { current_page: 1, total: 1, has_more: false },
    });

    const result = await archiveAiSearchService.fetchArchiveAiSearch({
      message: 'Toyota RAV4',
      page: 1,
    });

    expect(apiFetch).toHaveBeenCalledWith('/announcements/archive/ai-search', {
      method: 'POST',
      body: { message: 'Toyota RAV4', page: 1 },
    });
    expect(result.announcements).toEqual([{ id: 1 }]);
    expect(result.meta.has_more).toBe(false);
  });

  it('passes ai_parsed meta flag through to callers', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        announcements: [{ id: 1 }],
        filters: {},
        search_params: { search: 'Toyota' },
      },
      meta: { current_page: 1, total: 1, has_more: false, ai_parsed: false },
    });

    const result = await archiveAiSearchService.fetchArchiveAiSearch({
      message: 'Toyota',
      page: 1,
    });

    expect(result.meta.ai_parsed).toBe(false);
  });

  it('maps ApiClientError to ArchiveAiSearchApiError', async () => {
    const { ApiClientError } = await import('@/lib/api/client');
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiClientError('Too many requests', 429));

    await expect(
      archiveAiSearchService.fetchArchiveAiSearch({ message: 'test' }),
    ).rejects.toBeInstanceOf(archiveAiSearchService.ArchiveAiSearchApiError);
  });
});
