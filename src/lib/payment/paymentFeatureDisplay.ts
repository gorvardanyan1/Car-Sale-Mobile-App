import { formatCents } from '@/lib/payment/formatCents';
import type { FeatureAccessInfo } from '@/types/payment';

export const BILLING_ONE_TIME = 'one_time';
export const BILLING_SUBSCRIPTION = 'subscription';

export const DEFAULT_URGENT_PRICE_CENTS = 2500;

export function resolveBillingMode(featureAccess: FeatureAccessInfo | null | undefined): string {
  return featureAccess?.billing_mode === BILLING_SUBSCRIPTION
    ? BILLING_SUBSCRIPTION
    : BILLING_ONE_TIME;
}

export function isSubscriptionBilling(featureAccess: FeatureAccessInfo | null | undefined): boolean {
  return resolveBillingMode(featureAccess) === BILLING_SUBSCRIPTION;
}

export function resolvePriceCents(
  featureAccess: FeatureAccessInfo | null | undefined,
  fallbackCents = 0,
): number {
  const fromAccess = featureAccess?.price_cents;

  if (fromAccess != null && Number(fromAccess) > 0) {
    return Number(fromAccess);
  }

  return Number(fallbackCents ?? 0);
}

export function formatFeaturePriceLabel(
  featureAccess: FeatureAccessInfo | null | undefined,
  fallbackCents = 0,
  currency = 'USD',
): string {
  return formatCents(resolvePriceCents(featureAccess, fallbackCents), currency);
}
