import { apiFetch } from '@/lib/api/client';
import { buildArchiveQueryParams } from '@/lib/announcements/buildArchiveQueryParams';
import type {
  Announcement,
  ArchiveConfig,
  ArchiveFilterState,
  ArchiveListResponse,
  ArchiveSort,
  CarModel,
  PaginationMeta,
  PlaceOption,
  UserLocation,
} from '@/types/announcement';
import type { ApiResponse } from '@/types';

export async function fetchArchiveConfig(): Promise<ArchiveConfig> {
  const response = await apiFetch<ApiResponse<ArchiveConfig>>('/announcements/archive/config');
  return response.data;
}

type FetchArchiveOptions = {
  filters: ArchiveFilterState;
  page?: number;
  sort?: ArchiveSort;
  location?: UserLocation | null;
};

export async function fetchArchive({
  filters,
  page = 1,
  sort = 'default',
  location = null,
}: FetchArchiveOptions): Promise<ArchiveListResponse> {
  const query = buildArchiveQueryParams(filters, { page, sort, location });
  const response = await apiFetch<ApiResponse<Announcement[]>>(`/announcements/archive?${query}`);

  const meta = (response.meta ?? {}) as PaginationMeta;

  return {
    announcements: response.data ?? [],
    meta: {
      current_page: meta.current_page ?? page,
      last_page: meta.last_page ?? 1,
      per_page: meta.per_page ?? 5,
      total: meta.total ?? response.data?.length ?? 0,
    },
    ads: Array.isArray(meta.ads) ? meta.ads : [],
    adsInterval: meta.ads_interval ?? 4,
  };
}

export async function fetchBrandModels(brandId: number | string): Promise<CarModel[]> {
  const response = await apiFetch<ApiResponse<{ models: CarModel[] }>>(
    `/announcements/brand/${brandId}/models`,
  );

  return response.data.models ?? [];
}

type FetchPlacesOptions = {
  countryId?: number | string;
  search?: string;
  perPage?: number;
};

export async function fetchPlaces({
  countryId,
  search,
  perPage = 50,
}: FetchPlacesOptions = {}): Promise<PlaceOption[]> {
  const params = new URLSearchParams({ per_page: String(perPage) });

  if (countryId) {
    params.set('country_id', String(countryId));
  }

  if (search?.trim()) {
    params.set('search', search.trim());
  }

  const response = await apiFetch<ApiResponse<PlaceOption[]>>(`/reference/places?${params.toString()}`);

  return response.data ?? [];
}

export async function fetchAnnouncementDetail(id: number): Promise<Record<string, unknown>> {
  const response = await apiFetch<ApiResponse<Record<string, unknown>>>(`/announcements/${id}`);
  return response.data;
}
