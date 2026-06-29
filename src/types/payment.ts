export type FeatureAccessInfo = {
  status: string;
  feature: string;
  reason: string | null;
  billing_mode: string | null;
  price_cents: number | null;
  stripe_price_id: string | null;
};

export type UrgentListingCheckoutResponse =
  | { fulfilled: true; free?: boolean }
  | { checkout_url: string; session_id: string };

export type UrgentCheckoutOutcome = 'fulfilled' | 'success' | 'cancel' | 'dismiss';

export type FeatureCheckoutKey = 'wanted_searches';

export type FeatureCheckoutResponse =
  | { fulfilled: true; free?: boolean; already_granted?: boolean }
  | { checkout_url: string; session_id: string };

export type FeatureCheckoutOutcome = 'fulfilled' | 'success' | 'cancel' | 'dismiss';
