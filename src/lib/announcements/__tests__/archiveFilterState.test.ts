import { describe, expect, it } from 'vitest';

import {
  buildInitialArchiveFilters,
  buildResetArchiveFilters,
  countActiveFilters,
  sanitizeSubcategorySlug,
} from '@/lib/announcements/archiveFilterState';

describe('archiveFilterState', () => {
  const subcategories = [{ slug: 'suv' }, { slug: 'sedan' }];

  it('sanitizes unknown subcategory slugs', () => {
    expect(sanitizeSubcategorySlug('suv', subcategories)).toBe('suv');
    expect(sanitizeSubcategorySlug('truck', subcategories)).toBe('');
  });

  it('builds initial filters with defaults', () => {
    const filters = buildInitialArchiveFilters({
      search: 'audi',
      defaultCountryId: 2,
      defaultCurrencyId: 1,
      subcategorySlug: 'suv',
      subcategoryFilters: subcategories,
    });

    expect(filters).toEqual({
      search: 'audi',
      country_id: 2,
      place_id: '',
      currency_id: 1,
      mileage_unit: 'km',
      subcategory_slug: 'suv',
    });
  });

  it('reset keeps search and subcategory', () => {
    const reset = buildResetArchiveFilters('bmw', 2, 1, 'sedan');

    expect(reset.search).toBe('bmw');
    expect(reset.subcategory_slug).toBe('sedan');
    expect(reset.brand_id).toBeUndefined();
  });

  it('counts active advanced filters', () => {
    expect(
      countActiveFilters({
        search: '',
        country_id: 1,
        place_id: '',
        currency_id: 1,
        mileage_unit: 'km',
        subcategory_slug: '',
        brand_id: 5,
        price_max: 20000,
      }),
    ).toBe(2);
  });
});
