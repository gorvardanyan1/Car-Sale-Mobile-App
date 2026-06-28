import { apiFetch, ApiClientError } from '@/lib/api/client';
import type { Announcement } from '@/types/announcement';
import type { ApiResponse } from '@/types';

export class ArchiveAiSearchApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ArchiveAiSearchApiError';
  }
}

export type ArchiveAiSearchPayload = {
  message?: string;
  search_params?: Record<string, unknown> | null;
  country_id?: number | string | null;
  currency_id?: number | string | null;
  page?: number;
};

export type ArchiveAiSearchMeta = {
  current_page?: number;
  total?: number;
  has_more?: boolean;
  ai_parsed?: boolean;
};

export type ArchiveAiSearchResult = {
  announcements: Announcement[];
  filters: Record<string, unknown>;
  search_params: Record<string, unknown> | null;
  meta: ArchiveAiSearchMeta;
};

type ArchiveAiSearchResponseData = {
  announcements?: Announcement[];
  filters?: Record<string, unknown>;
  search_params?: Record<string, unknown> | null;
};

function normalizeArchiveAiSearchBody(
  payload: ArchiveAiSearchPayload,
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...payload };

  if (body.message == null || String(body.message).trim() === '') {
    delete body.message;
  }

  if (body.country_id == null || body.country_id === '') {
    delete body.country_id;
  } else {
    body.country_id = Number(body.country_id);
  }

  if (body.currency_id == null || body.currency_id === '') {
    delete body.currency_id;
  } else {
    body.currency_id = Number(body.currency_id);
  }

  if (body.page != null) {
    body.page = Number(body.page);
  }

  return body;
}

export async function fetchArchiveAiSearch(
  payload: ArchiveAiSearchPayload,
): Promise<ArchiveAiSearchResult> {
  try {
    const response = await apiFetch<ApiResponse<ArchiveAiSearchResponseData>>(
      '/announcements/archive/ai-search',
      {
        method: 'POST',
        body: normalizeArchiveAiSearchBody(payload),
      },
    );

    const meta = (response.meta ?? {}) as ArchiveAiSearchMeta;

    return {
      announcements: response.data?.announcements ?? [],
      filters: response.data?.filters ?? {},
      search_params: response.data?.search_params ?? null,
      meta,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new ArchiveAiSearchApiError(error.message, error.status);
    }

    throw error;
  }
}
