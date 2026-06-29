export type BillingTransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'refunded'
  | string;

export type BillingSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'incomplete'
  | string;

export type BillingTransaction = {
  id: number;
  type: string;
  status: BillingTransactionStatus;
  amount_cents: number;
  currency: string;
  created_at: string | null;
  refunded_at?: string | null;
  announcement_id?: number | null;
  announcement?: {
    id: number;
    label: string;
  } | null;
};

export type BillingSubscription = {
  id: number;
  type: string;
  feature_key: string | null;
  status: BillingSubscriptionStatus;
  amount_cents: number;
  currency: string;
  created_at: string | null;
  current_period_end: string | null;
  refunded_at?: string | null;
  cancel_at_period_end: boolean;
  can_cancel: boolean;
};

export type BillingOverview = {
  transactions: BillingTransaction[];
  subscriptions: BillingSubscription[];
};

export type BillingTab = 'one_time' | 'subscription';
