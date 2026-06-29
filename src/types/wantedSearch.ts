import type { Announcement, CarBrand, Currency } from '@/types/announcement';

export type WantedSearchCategory = {
  id: number;
  name: string;
  slug: string;
};

export type WantedSearchMileageUnit = 'km' | 'mi';

export type WantedSearch = {
  id: number;
  category_id: number;
  car_brand_id: number | null;
  car_model_id: number | null;
  name: string | null;
  min_price: number | string | null;
  max_price: number | string | null;
  currency_id: number | null;
  min_year: number | null;
  max_year: number | null;
  min_horsepower: number | null;
  max_horsepower: number | null;
  min_engine_capacity: number | string | null;
  max_engine_capacity: number | string | null;
  min_mileage: number | null;
  max_mileage: number | null;
  mileage_unit: WantedSearchMileageUnit | null;
  is_active: boolean;
  category?: { id: number; name: string; slug?: string } | null;
  car_brand?: CarBrand | null;
  car_model?: { id: number; model: string } | null;
  currency?: Currency | null;
};

export type WantedSearchFormState = {
  category_id: number | '';
  car_brand_id: number | '';
  car_model_id: number | '';
  name: string;
  min_price: string;
  max_price: string;
  currency_id: number | '';
  min_year: string;
  max_year: string;
  min_horsepower: string;
  max_horsepower: string;
  min_engine_capacity: string;
  max_engine_capacity: string;
  min_mileage: string;
  max_mileage: string;
  mileage_unit: WantedSearchMileageUnit;
  is_active: boolean;
};

export type FeatureAccessInfo = {
  status: 'granted' | 'locked' | 'payment_required' | string;
  feature?: string;
  reason?: string;
  billing_mode?: string | null;
  price_cents?: number | null;
};

export type WantedSearchConfig = {
  categories: WantedSearchCategory[];
  currencies: Currency[];
  defaultCategoryId: number | null;
  defaultCurrencyId: number | null;
  brands: CarBrand[];
  featureAccess: FeatureAccessInfo;
};

export type WantedSearchMatchesPage = {
  data: Announcement[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type WantedSearchesIndexResponse = {
  wanted_searches: WantedSearch[];
  matches: WantedSearchMatchesPage;
};
