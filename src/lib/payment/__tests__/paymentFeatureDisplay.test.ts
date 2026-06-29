import { describe, expect, it } from 'vitest';

import {
  DEFAULT_URGENT_PRICE_CENTS,
  formatFeaturePriceLabel,
  isSubscriptionBilling,
  resolvePriceCents,
} from '@/lib/payment/paymentFeatureDisplay';
import type { FeatureAccessInfo } from '@/types/payment';

describe('paymentFeatureDisplay', () => {
  it('formats price from feature access or fallback', () => {
    const access: FeatureAccessInfo = {
      status: 'payment_required',
      feature: 'urgent_announcement',
      reason: 'payment_required',
      billing_mode: 'one_time',
      price_cents: 4999,
      stripe_price_id: null,
    };

    expect(resolvePriceCents(access, DEFAULT_URGENT_PRICE_CENTS)).toBe(4999);
    expect(formatFeaturePriceLabel(null, DEFAULT_URGENT_PRICE_CENTS)).toBe('$25.00');
    expect(formatFeaturePriceLabel(access, DEFAULT_URGENT_PRICE_CENTS)).toBe('$49.99');
  });

  it('detects subscription billing mode', () => {
    const subscription: FeatureAccessInfo = {
      status: 'payment_required',
      feature: 'urgent_announcement',
      reason: 'payment_required',
      billing_mode: 'subscription',
      price_cents: 999,
      stripe_price_id: 'price_123',
    };

    expect(isSubscriptionBilling(subscription)).toBe(true);
    expect(isSubscriptionBilling({ ...subscription, billing_mode: 'one_time' })).toBe(false);
  });
});
