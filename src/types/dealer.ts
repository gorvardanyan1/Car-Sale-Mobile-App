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
  is_followed?: boolean;
  followers_count?: number;
};

export type DealerDetailResponse = {
  dealer: DealerProfile;
  listings: Announcement[];
  meta: DealerDetailMeta;
};

export type DealerProfileTab = 'listings' | 'reviews' | 'about';

/** Shape returned by `GET /v1/dealer/profile` — the dealer's own editable account data. */
export type DealerAccountProfile = {
  about_us: string | null;
  phone: string | null;
  website: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  location: string | null;
  business_hours: DealerBusinessHour[];
  specializations: string[];
  logo: string | null;
  feature_image: string | null;
};

export type DealerFeatureAccessStatus = 'granted' | 'locked' | 'payment_required';

export type DealerBadgeFeatureAccess = {
  status: DealerFeatureAccessStatus;
  feature: string;
  reason: string | null;
  billing_mode: string | null;
  price_cents: number | null;
  stripe_price_id: string | null;
};

export type DealerAccountUser = {
  id: number;
  name: string;
  last_name: string | null;
  email: string;
  email_verified_at: string | null;
  is_dealer_verified: boolean;
  roles: string[];
  created_at: string | null;
};

export type DealerAccountResponse = {
  user: DealerAccountUser;
  profile: DealerAccountProfile | null;
  dealer_verification_price_cents: number;
  dealer_verification_billing_mode: string | null;
  is_dealer_verified: boolean;
  dealer_badge_feature_access: DealerBadgeFeatureAccess;
};

export type DealerFollower = {
  id: number;
  name: string;
  followed_at: string | null;
  member_since: string | null;
};

export type DealerFollowersMeta = PaginationMeta & {
  followers_count: number;
};

export type DealerFollowStateResponse = {
  dealer_id: number;
  is_followed: boolean;
  followers_count: number;
};
