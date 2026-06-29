import type { WantedSearch, WantedSearchFormState } from '@/types/wantedSearch';

export function emptyWantedSearchForm(
  defaultCategoryId: number | null,
  defaultCurrencyId: number | null = null,
): WantedSearchFormState {
  return {
    category_id: defaultCategoryId ?? '',
    car_brand_id: '',
    car_model_id: '',
    name: '',
    min_price: '',
    max_price: '',
    currency_id: defaultCurrencyId ?? '',
    min_year: '',
    max_year: '',
    min_horsepower: '',
    max_horsepower: '',
    min_engine_capacity: '',
    max_engine_capacity: '',
    min_mileage: '',
    max_mileage: '',
    mileage_unit: 'km',
    is_active: true,
  };
}

function toInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function mapWantedSearchToForm(
  search: WantedSearch,
  defaultCategoryId: number | null,
): WantedSearchFormState {
  return {
    category_id: search.category_id ?? defaultCategoryId ?? '',
    car_brand_id: search.car_brand_id ?? '',
    car_model_id: search.car_model_id ?? '',
    name: search.name ?? '',
    min_price: toInputValue(search.min_price),
    max_price: toInputValue(search.max_price),
    currency_id: search.currency_id ?? '',
    min_year: toInputValue(search.min_year),
    max_year: toInputValue(search.max_year),
    min_horsepower: toInputValue(search.min_horsepower),
    max_horsepower: toInputValue(search.max_horsepower),
    min_engine_capacity: toInputValue(search.min_engine_capacity),
    max_engine_capacity: toInputValue(search.max_engine_capacity),
    min_mileage: toInputValue(search.min_mileage),
    max_mileage: toInputValue(search.max_mileage),
    mileage_unit: search.mileage_unit === 'mi' ? 'mi' : 'km',
    is_active: search.is_active ?? true,
  };
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return Number(trimmed);
}

function optionalId(value: number | ''): number | null {
  return value === '' ? null : value;
}

export function buildWantedSearchPayload(form: WantedSearchFormState): Record<string, unknown> {
  return {
    category_id: form.category_id,
    car_brand_id: optionalId(form.car_brand_id),
    car_model_id: optionalId(form.car_model_id),
    name: form.name.trim() || null,
    min_price: optionalNumber(form.min_price),
    max_price: optionalNumber(form.max_price),
    currency_id: optionalId(form.currency_id),
    min_year: optionalNumber(form.min_year),
    max_year: optionalNumber(form.max_year),
    min_horsepower: optionalNumber(form.min_horsepower),
    max_horsepower: optionalNumber(form.max_horsepower),
    min_engine_capacity: optionalNumber(form.min_engine_capacity),
    max_engine_capacity: optionalNumber(form.max_engine_capacity),
    min_mileage: optionalNumber(form.min_mileage),
    max_mileage: optionalNumber(form.max_mileage),
    mileage_unit: form.mileage_unit,
    is_active: form.is_active,
  };
}

export function getWantedSearchTitle(search: WantedSearch, anyBrandLabel: string): string {
  if (search.name?.trim()) {
    return search.name.trim();
  }

  const brand = search.car_brand?.brand ?? anyBrandLabel;
  const model = search.car_model?.model ?? '';

  return `${brand} ${model}`.trim();
}
