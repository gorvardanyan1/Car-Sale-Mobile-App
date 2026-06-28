import { describe, expect, it } from 'vitest';

import { buildArchiveQueryParams } from '@/lib/announcements/buildArchiveQueryParams';

describe('buildArchiveQueryParams', () => {
  it('always sends page, sort, country_id, and place_id', () => {
    const query = buildArchiveQueryParams(
      { country_id: 1, place_id: '' },
      { page: 2, sort: 'newest' },
    );

    const params = new URLSearchParams(query);

    expect(params.get('page')).toBe('2');
    expect(params.get('sort')).toBe('newest');
    expect(params.get('country_id')).toBe('1');
    expect(params.get('place_id')).toBe('');
  });

  it('includes optional filters only when non-empty', () => {
    const query = buildArchiveQueryParams({
      search: 'bmw',
      brand_id: 3,
      model_id: '',
      price_min: 1000,
    });

    const params = new URLSearchParams(query);

    expect(params.get('search')).toBe('bmw');
    expect(params.get('brand_id')).toBe('3');
    expect(params.get('model_id')).toBeNull();
    expect(params.get('price_min')).toBe('1000');
  });

  it('adds lat and lng for nearest sort when location is provided', () => {
    const query = buildArchiveQueryParams(
      { country_id: 1, place_id: '' },
      { sort: 'nearest', location: { lat: 40.18, lng: 44.51 } },
    );

    const params = new URLSearchParams(query);

    expect(params.get('lat')).toBe('40.18');
    expect(params.get('lng')).toBe('44.51');
  });
});
