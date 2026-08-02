import type { TFunction } from 'i18next';

import type { PointTransaction } from '@/types/referral';

const REASON_KEYS: Record<string, string> = {
  referral: 'referral.reason_referral',
  urgent_redemption: 'referral.reason_urgent_redemption',
  admin_adjustment: 'referral.reason_admin_adjustment',
};

export function getPointTransactionReasonLabel(
  transaction: Pick<PointTransaction, 'reason' | 'description'>,
  t: TFunction,
): string {
  if (transaction.description) {
    return transaction.description;
  }

  const key = REASON_KEYS[transaction.reason];

  return t(key ?? 'referral.reason_other');
}

export function formatPointsAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : String(amount);
}
