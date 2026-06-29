import { describe, expect, it } from 'vitest';

import {
  buildWantedSearchPayload,
  emptyWantedSearchForm,
  getWantedSearchTitle,
  mapWantedSearchToForm,
} from '@/lib/wanted-searches/wantedSearchForm';
import type { WantedSearch } from '@/types/wantedSearch';

describe('wantedSearchForm', () => {
  it('builds empty form with defaults', () => {
    const form = emptyWantedSearchForm(3, 1);

    expect(form.category_id).toBe(3);
    expect(form.currency_id).toBe(1);
    expect(form.car_brand_id).toBe('');
    expect(form.mileage_unit).toBe('km');
  });

  it('maps search to form and builds API payload', () => {
    const search = {
      id: 5,
      category_id: 2,
      car_brand_id: 10,
      car_model_id: 20,
      name: 'Family SUV',
      min_price: 5000,
      max_price: null,
      currency_id: 1,
      min_year: 2018,
      max_year: null,
      min_horsepower: null,
      max_horsepower: 300,
      min_engine_capacity: null,
      max_engine_capacity: 3.5,
      min_mileage: 0,
      max_mileage: 120000,
      mileage_unit: 'mi',
      is_active: true,
    } as WantedSearch;

    const form = mapWantedSearchToForm(search, 1);
    const payload = buildWantedSearchPayload(form);

    expect(form.name).toBe('Family SUV');
    expect(form.mileage_unit).toBe('mi');
    expect(payload).toMatchObject({
      category_id: 2,
      car_brand_id: 10,
      car_model_id: 20,
      name: 'Family SUV',
      min_price: 5000,
      max_price: null,
      currency_id: 1,
      mileage_unit: 'mi',
      is_active: true,
    });
  });

  it('uses custom label or brand/model for title', () => {
    const withName = {
      name: 'Budget sedan',
      car_brand: { brand: 'Toyota' },
      car_model: { model: 'Camry' },
    } as WantedSearch;

    const withoutName = {
      name: null,
      car_brand: { brand: 'BMW' },
      car_model: { model: 'X5' },
    } as WantedSearch;

    expect(getWantedSearchTitle(withName, 'Any brand')).toBe('Budget sedan');
    expect(getWantedSearchTitle(withoutName, 'Any brand')).toBe('BMW X5');
  });
});
