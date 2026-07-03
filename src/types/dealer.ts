import type { Announcement, PaginationMeta } from '@/types/announcement';

export type DealerSort = 'rating' | 'listings' | 'sold';

export type DealerCard = {
  id: number;
  name: string;
  location: string | null;
  logo: string | null;
  cover_image: string | null;
  active_listings: number;
  total_listings: number;
  sold_listings: number;
  specializations: string[];
  specialty: string | null;
  verified: boolean;
};

export type DealerBusinessHour = {
  day: string;
  hours: string;
};

export type DealerProfile = {
  id: number;
  name: string;
  verified: boolean;
  joined_date: string;
  logo: string | null;
  feature_image: string | null;
  about_us: string | null;
  phone: string | null;
  website: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  location: string | null;
  business_hours: DealerBusinessHour[];
  specializations: string[];
  stats: {
    total_listings: number;
    active_listings: number;
    sold_vehicles: number;
  };
};

export type DealerDirectoryMeta = PaginationMeta & {
  verified_count?: number;
};

export type DealerDetailMeta = PaginationMeta & {
  is_owner?: boolean;
};

export type DealerDetailResponse = {
  dealer: DealerProfile;
  listings: Announcement[];
  meta: DealerDetailMeta;
};

export type DealerProfileTab = 'listings' | 'reviews' | 'about';
