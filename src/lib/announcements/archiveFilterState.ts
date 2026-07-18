import type { ArchiveFilterState, SubcategoryFilter } from '@/types/announcement';

export function sanitizeSubcategorySlug(
  subcategorySlug: string,
  subcategoryFilters: SubcategoryFilter[] = [],
): string {
  const slug = String(subcategorySlug ?? '').trim();
  if (!slug) {
    return '';
  }

  const validSlugs = subcategoryFilters.map((item) => item.slug).filter(Boolean);

  return validSlugs.includes(slug) ? slug : '';
}

export function buildResetArchiveFilters(
  search = '',
  defaultCountryId: number | string | null = null,
  defaultCurrencyId: number | string | null = null,
  preservedSubcategorySlug = '',
): ArchiveFilterState {
  return {
    search: search ?? '',
    country_id: defaultCountryId ?? '',
    place_id: '',
    currency_id: defaultCurrencyId ?? '',
    mileage_unit: 'km',
    subcategory_slug: preservedSubcategorySlug ?? '',
  };
}

type BuildInitialArchiveFiltersOptions = {
  search?: string;
  defaultCountryId?: number | string | null;
  defaultCurrencyId?: number | string | null;
  subcategorySlug?: string;
  subcategoryFilters?: SubcategoryFilter[];
};

export function buildInitialArchiveFilters({
  search = '',
  defaultCountryId = null,
  defaultCurrencyId = null,
  subcategorySlug = '',
  subcategoryFilters = [],
}: BuildInitialArchiveFiltersOptions = {}): ArchiveFilterState {
  return {
    ...buildResetArchiveFilters(search, defaultCountryId, defaultCurrencyId),
    subcategory_slug: sanitizeSubcategorySlug(subcategorySlug, subcategoryFilters),
  };
}

export function countActiveFilters(filters: ArchiveFilterState): number {
  let count = 0;

  if (filters.subcategory_slug) count += 1;
  if (filters.brand_id) count += 1;
  if (filters.model_id) count += 1;
  if (filters.price_min) count += 1;
  if (filters.price_max) count += 1;
  if (filters.mileage_min) count += 1;
  if (filters.mileage_max) count += 1;
  if (filters.year_min) count += 1;
  if (filters.year_max) count += 1;
  if (filters.drive_type) count += 1;
  if (filters.transmission) count += 1;
  if (filters.place_id) count += 1;

  return count;
}
