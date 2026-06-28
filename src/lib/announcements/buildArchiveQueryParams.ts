import type { ArchiveFilterState, ArchiveSort, UserLocation } from '@/types/announcement';

type BuildArchiveQueryParamsOptions = {
  page?: number;
  sort?: ArchiveSort;
  location?: UserLocation | null;
};

/**
 * Build query string for archive listing requests (mirrors web buildArchiveQueryParams.js).
 */
export function buildArchiveQueryParams(
  filterState: Partial<ArchiveFilterState> = {},
  { page = 1, sort = 'default', location = null }: BuildArchiveQueryParamsOptions = {},
): string {
  const params = new URLSearchParams({ page: String(page), sort });
  const alwaysSendKeys = new Set(['country_id', 'place_id']);

  if (
    sort === 'nearest' &&
    location?.lat !== undefined &&
    location?.lat !== null &&
    location?.lng !== undefined &&
    location?.lng !== null
  ) {
    params.set('lat', String(location.lat));
    params.set('lng', String(location.lng));
  }

  Object.entries(filterState).forEach(([key, value]) => {
    if (alwaysSendKeys.has(key)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
      return;
    }

    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params.toString();
}
