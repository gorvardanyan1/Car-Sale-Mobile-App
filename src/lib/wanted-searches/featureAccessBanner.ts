import type { FeatureAccessInfo } from '@/types/wantedSearch';

export function isFeatureAccessBannerVisible(
  featureAccess: FeatureAccessInfo | null | undefined,
): featureAccess is FeatureAccessInfo & { status: 'locked' | 'payment_required' | string } {
  return featureAccess != null && featureAccess.status !== 'granted';
}

export function shouldShowFeatureAccessPayButton(
  featureAccess: FeatureAccessInfo | null | undefined,
  hasPayHandler: boolean,
): boolean {
  return (
    hasPayHandler
    && featureAccess != null
    && featureAccess.status !== 'granted'
    && featureAccess.status !== 'locked'
  );
}
