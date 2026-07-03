import { apiFetch } from '@/lib/api/client';
import {
  DEALER_DIRECTORY_PER_PAGE,
  DEALER_LISTINGS_PER_PAGE,
} from '@/constants/dealers';
import type { ApiResponse } from '@/types';
import type {
  DealerCard,
  DealerDetailResponse,
  DealerDirectoryMeta,
  DealerSort,
} from '@/types/dealer';

type FetchDealersParams = {
  page?: number;
  search?: string;
  sort?: DealerSort;
  perPage?: number;
};

type FetchDealerDetailParams = {
  page?: number;
  search?: string;
  perPage?: number;
  auth?: boolean;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }

    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export async function fetchDealers({
  page = 1,
  search = '',
  sort = 'rating',
  perPage = DEALER_DIRECTORY_PER_PAGE,
}: FetchDealersParams = {}): Promise<{ dealers: DealerCard[]; meta: DealerDirectoryMeta }> {
  const response = await apiFetch<ApiResponse<DealerCard[]>>(
    `/dealers${buildQuery({
      page,
      sort,
      per_page: perPage,
      search: search.trim() || undefined,
    })}`,
  );

  return {
    dealers: response.data,
    meta: (response.meta ?? {}) as DealerDirectoryMeta,
  };
}

export async function fetchDealerDetail(
  id: number,
  {
    page = 1,
    search = '',
    perPage = DEALER_LISTINGS_PER_PAGE,
    auth = false,
  }: FetchDealerDetailParams = {},
): Promise<DealerDetailResponse> {
  const response = await apiFetch<ApiResponse<{ dealer: DealerDetailResponse['dealer']; listings: DealerDetailResponse['listings'] }>>(
    `/dealers/${id}${buildQuery({
      page,
      per_page: perPage,
      search: search.trim() || undefined,
    })}`,
    { auth },
  );

  return {
    dealer: response.data.dealer,
    listings: response.data.listings,
    meta: (response.meta ?? {}) as DealerDetailResponse['meta'],
  };
}
