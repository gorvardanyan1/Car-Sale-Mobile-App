import type { BillingSubscription, BillingTransaction } from '@/types/billing';
import type { BillingTab } from '@/types/billing';

export function getBillingEmptyMessageKey(activeTab: BillingTab): string {
  return activeTab === 'subscription'
    ? 'billing.empty_subscriptions'
    : 'billing.empty_one_time';
}

export function isCancelSubscriptionModalVisible(
  subscription: BillingSubscription | null,
): boolean {
  return subscription != null;
}

export function shouldShowBillingEmptyState(
  activeTab: BillingTab,
  transactions: BillingTransaction[],
  subscriptions: BillingSubscription[],
): boolean {
  if (activeTab === 'subscription') {
    return subscriptions.length === 0;
  }

  return transactions.length === 0;
}
