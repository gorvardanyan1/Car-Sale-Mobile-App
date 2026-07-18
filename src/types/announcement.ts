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
  name?: string;
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

export type AnnouncementPlace = {
  id?: number;
  place?: string;
};

export type AnnouncementCountry = {
  id?: number;
  country?: string;
};

export type CarFeatureDefinition = {
  key: string;
  name_en?: string;
  name_ru?: string;
  name_am?: string;
};

export type Announcement = {
  id: number;
  year: number | null;
  price: number | string | null;
  currency_id: number | null;
  drive_type: string | null;
  transmission: string | null;
  description?: string | null;
  display_description?: string | null;
  horsepower: number | string | null;
  engine_capacity: number | string | null;
  engine_type?: string | null;
  status?: string | null;
  mileage: AnnouncementMileage | string | null;
  is_hurry: 'yes' | 'no' | string;
  main_image_path?: string | null;
  main_image?: string | null;
  additional_images_path?: string | null;
  created_at?: string | null;
  car_brand_id: number | null;
  car_model_id: number | null;
  car_brand?: CarBrand | null;
  car_model?: CarModel | null;
  currency?: Currency | null;
  user?: AnnouncementUser | null;
  user_id?: number | null;
  place?: AnnouncementPlace | null;
  country?: AnnouncementCountry | null;
  feature?: string | null;
  hidden_fields?: string[] | null;
  phone?: string | null;
  is_liked?: number | boolean;
  views_count?: number;
  likes_count?: number;
  viewsCount?: number;
  likedQuantity?: number;
  subcategory_label?: string | null;
  color?: { id?: number; name?: string; hex_code?: string } | null;
  /** Only present on entries returned inside `similarAnnouncements`. */
  match_score?: number;
  /** Reason keys like "same_model" or "same_transmission:automatic" (key:value). */
  match_reasons?: string[];
};

export type MyAnnouncementsSort = 'newest' | 'oldest' | 'price-low' | 'price-high';

export type MyAnnouncementsStatus = '' | 'active' | 'pending' | 'expired' | 'urgent' | 'sold';

import type { FeatureAccessInfo } from '@/types/payment';

export type MyAnnouncementsStats = {
  total: number;
  active: number;
  pending: number;
  urgent: number;
  views: number;
};

export type MyAnnouncementsMeta = PaginationMeta & {
  stats?: MyAnnouncementsStats;
  urgent_price_cents?: number;
  urgent_feature_access?: FeatureAccessInfo;
};

export type MyAnnouncementsResponse = {
  announcements: Announcement[];
  meta: MyAnnouncementsMeta;
};

export type AnnouncementDetailResponse = {
  announcement: Announcement;
  carFeatures?: CarFeatureDefinition[];
  similarAnnouncements?: Announcement[];
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

export type SubcategoryOption = {
  slug: string;
  name: string;
  path: string;
  hidden_fields?: string[];
  icon_url?: string | null;
};

export type ColorOption = {
  id: number;
  name: string;
  hex_code?: string | null;
};

export type EngineTypeOption = {
  value: string;
  label: string;
};

export type CreateFormConfig = {
  brands: CarBrand[];
  carFeatures: CarFeatureDefinition[];
  countries: Country[];
  currencies: Currency[];
  defaultCurrencyId: number | null;
  subcategoryOptions: SubcategoryOption[];
  colors: ColorOption[];
  engineTypeOptions: EngineTypeOption[];
};

export type EditAnnouncementRecord = {
  id: number;
  car_brand_id: number | null;
  car_model_id: number | null;
  country_id: number | null;
  place_id: number | null;
  subcategory_slug?: string | null;
  color_id?: number | null;
  vin?: string | null;
  year: number | null;
  price: number | string | null;
  currency_id: number | null;
  drive_type: string | null;
  transmission: string | null;
  horsepower: number | string | null;
  engine_capacity: number | string | null;
  engine_type?: string | null;
  mileage: AnnouncementMileage | string | null;
  youtube_video?: string | null;
  description?: string | null;
  feature?: string | null;
  main_image_path?: string | null;
  additional_images_path?: string | null;
  status?: string | null;
};

export type EditFormConfig = CreateFormConfig & {
  announcement: EditAnnouncementRecord;
};

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

export type CreateAnnouncementFormState = {
  subcategory_slug: string;
  car_brand_id: number | '';
  car_model_id: number | '';
  country_id: number | '';
  place_id: number | '';
  vin: string;
  year: string;
  price: string;
  currency_id: number | '';
  drive_type: string;
  transmission: string;
  horsepower: string;
  mileage: string;
  mileage_unit: MileageUnit;
  engine_capacity: string;
  engine_type: string;
  color_id: number | '';
  youtube_video: string;
  description: string;
  features: Record<string, boolean>;
  mainImage: PickedImage | null;
  additionalImages: PickedImage[];
  existingMainImagePath: string | null;
  existingAdditionalImagePaths: string[];
};
