export type MileageUnit = 'km' | 'mi';

export type ArchiveSort =
  | 'default'
  | 'nearest'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'year-newest'
  | 'mileage-low';

export type DriveType = '' | 'awd' | 'fwd' | 'rwd';

export type TransmissionType = '' | 'automatic' | 'manual' | 'robotic';

export type ArchiveFilterState = {
  search: string;
  country_id: string | number;
  place_id: string;
  currency_id: string | number;
  mileage_unit: MileageUnit;
  subcategory_slug: string;
  brand_id?: string | number;
  model_id?: string | number;
  price_min?: string | number;
  price_max?: string | number;
  mileage_min?: string | number;
  mileage_max?: string | number;
  year_min?: string | number;
  year_max?: string | number;
  drive_type?: DriveType;
  transmission?: TransmissionType;
};

export type CarBrand = {
  id: number;
  brand: string;
};

export type CarModel = {
  id: number;
  model: string;
  car_brand_id?: number;
};

export type Currency = {
  id: number;
  code: string;
  symbol: string;
};

export type Country = {
  id: number;
  country: string;
  country_code?: string;
};

export type PlaceOption = {
  value: number;
  label: string;
};

export type SubcategoryFilter = {
  slug: string;
  label?: string;
  icon_url?: string | null;
};

export type ArchiveConfig = {
  countries: Country[];
  currencies: Currency[];
  subcategoryFilters: SubcategoryFilter[];
  brands: CarBrand[];
  default_country_id: number | null;
  defaultCurrencyId: number | null;
};

export type AnnouncementMileage = {
  value: string;
  unit: MileageUnit;
};

export type AnnouncementUser = {
  id: number;
  name: string;
  is_dealer_verified?: boolean | number;
};

export type Announcement = {
  id: number;
  year: number | null;
  price: number | string | null;
  currency_id: number | null;
  drive_type: string | null;
  transmission: string | null;
  description?: string | null;
  horsepower: number | string | null;
  engine_capacity: number | string | null;
  mileage: AnnouncementMileage | string | null;
  is_hurry: 'yes' | 'no' | string;
  main_image_path?: string | null;
  main_image?: string | null;
  car_brand_id: number | null;
  car_model_id: number | null;
  car_brand?: CarBrand | null;
  car_model?: CarModel | null;
  currency?: Currency | null;
  user?: AnnouncementUser | null;
  is_liked?: number | boolean;
  views_count?: number;
  likes_count?: number;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  ads?: SponsoredAd[];
  ads_interval?: number;
};

export type SponsoredAd = {
  id: number;
  title: string;
  description?: string | null;
  link_url: string;
  cta_text?: string;
  image_url?: string | null;
};

export type ArchiveFeedItem =
  | { type: 'announcement'; data: Announcement; key: string }
  | { type: 'ad'; data: SponsoredAd; key: string };

export type ArchiveListResponse = {
  announcements: Announcement[];
  meta: PaginationMeta;
  ads: SponsoredAd[];
  adsInterval: number;
};

export type UserLocation = {
  lat: number;
  lng: number;
};
