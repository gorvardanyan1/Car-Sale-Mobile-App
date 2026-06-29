import { describe, expect, it } from 'vitest';

import {
  isFeatureAccessBannerVisible,
  shouldShowFeatureAccessPayButton,
} from '@/lib/wanted-searches/featureAccessBanner';
import type { FeatureAccessInfo } from '@/types/wantedSearch';

const lockedAccess: FeatureAccessInfo = {
  status: 'locked',
  price_cents: null,
  billing_mode: null,
};

const paymentRequired: FeatureAccessInfo = {
  status: 'payment_required',
  price_cents: 500,
  billing_mode: 'one_time',
};

const grantedAccess: FeatureAccessInfo = {
  status: 'granted',
  price_cents: null,
  billing_mode: null,
};

describe('featureAccessBanner', () => {
  it('hides banner when access is granted', () => {
    expect(isFeatureAccessBannerVisible(grantedAccess)).toBe(false);
    expect(isFeatureAccessBannerVisible(null)).toBe(false);
  });

  it('shows banner for locked or payment required states', () => {
    expect(isFeatureAccessBannerVisible(lockedAccess)).toBe(true);
    expect(isFeatureAccessBannerVisible(paymentRequired)).toBe(true);
  });

  it('shows pay button only for payable non-locked states', () => {
    expect(shouldShowFeatureAccessPayButton(paymentRequired, true)).toBe(true);
    expect(shouldShowFeatureAccessPayButton(lockedAccess, true)).toBe(false);
    expect(shouldShowFeatureAccessPayButton(paymentRequired, false)).toBe(false);
  });
});
