import { apiFetch } from '@/lib/api/client';
import { buildWantedSearchPayload } from '@/lib/wanted-searches/wantedSearchForm';
import type { ApiResponse } from '@/types';
import type {
  WantedSearch,
  WantedSearchConfig,
  WantedSearchFormState,
  WantedSearchesIndexResponse,
} from '@/types/wantedSearch';

export async function fetchWantedSearchConfig(): Promise<WantedSearchConfig> {
  const response = await apiFetch<ApiResponse<WantedSearchConfig>>('/wanted-searches/config', {
    auth: true,
  });

  return response.data;
}

export async function fetchWantedSearches(): Promise<WantedSearchesIndexResponse> {
  const response = await apiFetch<ApiResponse<WantedSearchesIndexResponse>>('/wanted-searches', {
    auth: true,
  });

  return response.data;
}

export async function createWantedSearch(form: WantedSearchFormState): Promise<WantedSearch> {
  const response = await apiFetch<ApiResponse<WantedSearch>>('/wanted-searches', {
    method: 'POST',
    auth: true,
    body: buildWantedSearchPayload(form),
  });

  return response.data;
}

export async function updateWantedSearch(
  id: number,
  form: WantedSearchFormState,
): Promise<WantedSearch> {
  const response = await apiFetch<ApiResponse<WantedSearch>>(`/wanted-searches/${id}`, {
    method: 'PUT',
    auth: true,
    body: buildWantedSearchPayload(form),
  });

  return response.data;
}

export async function deleteWantedSearch(id: number): Promise<void> {
  await apiFetch<void>(`/wanted-searches/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function markWantedSearchMatchesRead(): Promise<void> {
  await apiFetch('/wanted-searches/mark-read', {
    method: 'POST',
    auth: true,
  });
}

export async function fetchWantedSearchUnreadSummary(): Promise<{ total_unread: number }> {
  const response = await apiFetch<ApiResponse<{ total_unread: number }>>(
    '/wanted-searches/unread-summary',
    {
      auth: true,
    },
  );

  return response.data;
}
