import { describe, expect, it } from 'vitest';

import {
  getBillingEmptyMessageKey,
  isCancelSubscriptionModalVisible,
  shouldShowBillingEmptyState,
} from '@/lib/billing/billingScreenState';

describe('billingScreenState', () => {
  it('returns the correct empty message key per tab', () => {
    expect(getBillingEmptyMessageKey('one_time')).toBe('billing.empty_one_time');
    expect(getBillingEmptyMessageKey('subscription')).toBe('billing.empty_subscriptions');
  });

  it('detects cancel modal visibility', () => {
    expect(isCancelSubscriptionModalVisible(null)).toBe(false);
    expect(
      isCancelSubscriptionModalVisible({
        id: 1,
        type: 'pro',
        status: 'active',
        amount_cents: 1000,
        currency: 'USD',
        current_period_end: null,
        cancel_at_period_end: false,
      }),
    ).toBe(true);
  });

  it('detects empty billing lists', () => {
    expect(shouldShowBillingEmptyState('one_time', [], [])).toBe(true);
    expect(shouldShowBillingEmptyState('one_time', [{ id: 1 } as never], [])).toBe(false);
    expect(shouldShowBillingEmptyState('subscription', [], [])).toBe(true);
    expect(shouldShowBillingEmptyState('subscription', [], [{ id: 2 } as never])).toBe(false);
  });
});
