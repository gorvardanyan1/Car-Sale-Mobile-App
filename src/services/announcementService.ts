import { apiFetch } from '@/lib/api/client';
import { buildArchiveQueryParams } from '@/lib/announcements/buildArchiveQueryParams';
import type {
  Announcement,
  AnnouncementDetailResponse,
  ArchiveConfig,
  ArchiveFilterState,
  ArchiveListResponse,
  ArchiveSort,
  CarModel,
  MyAnnouncementsMeta,
  MyAnnouncementsResponse,
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
  auth?: boolean;
};

export async function fetchArchive({
  filters,
  page = 1,
  sort = 'default',
  location = null,
  auth = false,
}: FetchArchiveOptions): Promise<ArchiveListResponse> {
  const query = buildArchiveQueryParams(filters, { page, sort, location });
  const response = await apiFetch<ApiResponse<Announcement[]>>(`/announcements/archive?${query}`, {
    auth,
  });

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

export async function fetchAnnouncementDetail(id: number): Promise<AnnouncementDetailResponse> {
  const response = await apiFetch<ApiResponse<AnnouncementDetailResponse>>(`/announcements/${id}`, {
    auth: true,
  });

  return response.data;
}

type FetchFavoritesOptions = {
  page?: number;
  perPage?: number;
};

export async function fetchFavorites({
  page = 1,
  perPage = 15,
}: FetchFavoritesOptions = {}): Promise<ArchiveListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  const response = await apiFetch<ApiResponse<Announcement[]>>(
    `/announcements/favorites?${params.toString()}`,
    { auth: true },
  );

  const meta = (response.meta ?? {}) as PaginationMeta;

  return {
    announcements: response.data ?? [],
    meta: {
      current_page: meta.current_page ?? page,
      last_page: meta.last_page ?? 1,
      per_page: meta.per_page ?? perPage,
      total: meta.total ?? response.data?.length ?? 0,
    },
    ads: [],
    adsInterval: 4,
  };
}

export async function favoriteAnnouncement(id: number): Promise<void> {
  await apiFetch<ApiResponse<{ favorited: boolean }>>(`/announcements/${id}/favorite`, {
    method: 'POST',
    auth: true,
  });
}

export async function unfavoriteAnnouncement(id: number): Promise<void> {
  await apiFetch<ApiResponse<{ favorited: boolean }>>(`/announcements/${id}/favorite`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function fetchAllFavoriteIds(): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchFavorites({ page, perPage: 60 });
    ids.push(...result.announcements.map((announcement) => announcement.id));
    lastPage = result.meta.last_page;
    page += 1;
  } while (page <= lastPage);

  return ids;
}

type FetchMyAnnouncementsOptions = {
  page?: number;
  perPage?: number;
  status?: string;
  sort?: string;
  search?: string;
};

export async function fetchMyAnnouncements({
  page = 1,
  perPage = 10,
  status = '',
  sort = 'newest',
  search = '',
}: FetchMyAnnouncementsOptions = {}): Promise<MyAnnouncementsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort,
  });

  if (status) {
    params.set('status', status);
  }

  if (search.trim()) {
    params.set('search', search.trim());
  }

  const response = await apiFetch<ApiResponse<Announcement[]> & { meta?: MyAnnouncementsMeta }>(
    `/my-announcements?${params.toString()}`,
    { auth: true },
  );

  const meta = (response.meta ?? {}) as MyAnnouncementsMeta;

  return {
    announcements: response.data ?? [],
    meta: {
      current_page: meta.current_page ?? page,
      last_page: meta.last_page ?? 1,
      per_page: meta.per_page ?? perPage,
      total: meta.total ?? response.data?.length ?? 0,
      stats: meta.stats,
      urgent_price_cents: meta.urgent_price_cents,
      urgent_feature_access: meta.urgent_feature_access,
    },
  };
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await apiFetch<null>(`/announcements/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function markAnnouncementAsSold(id: number): Promise<void> {
  await apiFetch<ApiResponse<Record<string, unknown>>>(`/announcements/${id}/mark-sold`, {
    method: 'PATCH',
    auth: true,
  });
}
