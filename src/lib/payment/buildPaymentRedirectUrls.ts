import { config } from '@/constants/config';
import { getAppScheme } from '@/lib/payment/getAppScheme';
import * as Linking from 'expo-linking';

export type PaymentFeatureKey = 'urgent' | 'wanted_searches';

/** Web app origin (no /api suffix) derived from EXPO_PUBLIC_API_URL. */
export function getWebAppOrigin(): string {
  return config.apiRootUrl.replace(/\/api\/?$/, '');
}

function buildAppReturnUrl(
  outcome: 'success' | 'cancel',
  feature: PaymentFeatureKey,
  announcementId?: number,
): string {
  const queryParams: Record<string, string> = {
    outcome,
    feature,
  };

  if (announcementId != null) {
    queryParams.announcement_id = String(announcementId);
  }

  return Linking.createURL('/settings/payment-result', { queryParams });
}

function buildMobileReturnUrl(
  outcome: 'success' | 'cancel',
  feature: PaymentFeatureKey,
  announcementId?: number,
): string {
  const params = new URLSearchParams({
    outcome,
    feature,
    app_scheme: getAppScheme(),
    app_return: buildAppReturnUrl(outcome, feature, announcementId),
  });

  if (announcementId != null) {
    params.set('announcement_id', String(announcementId));
  }

  return `${getWebAppOrigin()}/stripe/mobile-return?${params.toString()}`;
}

export function buildPaymentRedirectUrls(
  feature: PaymentFeatureKey,
  announcementId?: number,
): { success_url: string; cancel_url: string } {
  return {
    success_url: buildMobileReturnUrl('success', feature, announcementId),
    cancel_url: buildMobileReturnUrl('cancel', feature, announcementId),
  };
}

/** Prefix matched by expo-web-browser when Stripe redirects back to the app bridge. */
export function getStripeMobileReturnPrefix(): string {
  return `${getWebAppOrigin()}/stripe/mobile-return`;
}

export function getUrgentCheckoutReturnUrl(): string {
  return getStripeMobileReturnPrefix();
}
