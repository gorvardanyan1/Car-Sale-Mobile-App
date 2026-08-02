export type PointTransactionReason =
  | 'referral'
  | 'urgent_redemption'
  | 'admin_adjustment'
  | 'birthday'
  | string;

export type PointTransaction = {
  id: number;
  amount: number;
  balance_after: number;
  reason: PointTransactionReason;
  description: string | null;
  created_at: string | null;
};

export type ReferralStats = {
  invited: number;
  points_earned: number;
};

export type ReferralOverview = {
  enabled: boolean;
  referral_code: string;
  referral_url: string;
  points_balance: number;
  point_value_cents: number;
  stats: ReferralStats;
  history: PointTransaction[];
};
