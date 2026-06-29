import type { TFunction } from 'i18next';

import type { BillingSubscription, BillingTransaction } from '@/types/billing';

const TRANSACTION_TYPE_KEYS: Record<string, string> = {
  urgent: 'billing.transaction.urgent',
  dealer_verification: 'billing.transaction.dealer_verification',
  wanted_searches: 'billing.transaction.wanted_searches',
  price_history_chart: 'billing.transaction.price_history_chart',
};

export function getTransactionTypeLabel(type: string | null | undefined, t: TFunction): string {
  if (!type) {
    return '—';
  }

  const key = TRANSACTION_TYPE_KEYS[type];

  if (key) {
    return t(key);
  }

  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getSubscriptionTypeLabel(
  subscription: BillingSubscription | null | undefined,
  t: TFunction,
): string {
  if (!subscription) {
    return '—';
  }

  if (subscription.type === 'pro') {
    return t('billing.subscription.pro');
  }

  if (subscription.feature_key) {
    const mappedType =
      subscription.feature_key === 'dealer_badge'
        ? 'dealer_verification'
        : subscription.feature_key;

    return getTransactionTypeLabel(mappedType, t);
  }

  return subscription.type
    ? subscription.type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : '—';
}

export function getTransactionInfoLabel(transaction: BillingTransaction): string {
  if (transaction.announcement?.label) {
    return transaction.announcement.label;
  }

  if (transaction.announcement_id) {
    return `#${transaction.announcement_id}`;
  }

  return '—';
}
