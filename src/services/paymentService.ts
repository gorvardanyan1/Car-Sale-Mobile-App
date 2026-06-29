import { apiFetch } from '@/lib/api/client';
import { buildPaymentRedirectUrls, getUrgentCheckoutReturnUrl } from '@/lib/payment/buildPaymentRedirectUrls';
import { openStripeCheckout } from '@/lib/payment/openStripeCheckout';
import type { ApiResponse } from '@/types';
import type {
  FeatureCheckoutKey,
  FeatureCheckoutOutcome,
  FeatureCheckoutResponse,
  UrgentCheckoutOutcome,
  UrgentListingCheckoutResponse,
} from '@/types/payment';

function parseCheckoutPayload(
  data: UrgentListingCheckoutResponse | FeatureCheckoutResponse,
): { kind: 'fulfilled' } | { kind: 'checkout'; checkoutUrl: string } {
  if ('fulfilled' in data && data.fulfilled) {
    return { kind: 'fulfilled' };
  }

  const checkoutUrl = 'checkout_url' in data ? data.checkout_url : '';

  if (!checkoutUrl) {
    throw new Error('Payment session could not be created.');
  }

  return { kind: 'checkout', checkoutUrl };
}

export async function initiateUrgentListingCheckout(
  announcementId: number,
): Promise<UrgentListingCheckoutResponse> {
  const { success_url, cancel_url } = buildPaymentRedirectUrls('urgent', announcementId);

  const response = await apiFetch<ApiResponse<UrgentListingCheckoutResponse>>(
    '/payments/urgent-listing',
    {
      method: 'POST',
      auth: true,
      body: {
        announcement_id: announcementId,
        success_url,
        cancel_url,
      },
    },
  );

  return response.data;
}

export async function verifyPaymentSession(sessionId: string): Promise<{ fulfilled: boolean }> {
  const response = await apiFetch<ApiResponse<{ fulfilled: boolean; type?: string | null }>>(
    '/payments/verify-session',
    {
      method: 'POST',
      auth: true,
      body: { session_id: sessionId },
    },
  );

  return { fulfilled: Boolean(response.data.fulfilled) };
}

export async function completeUrgentListingCheckout(
  announcementId: number,
): Promise<UrgentCheckoutOutcome> {
  const result = await initiateUrgentListingCheckout(announcementId);
  const parsed = parseCheckoutPayload(result);

  if (parsed.kind === 'fulfilled') {
    return 'fulfilled';
  }

  const checkout = await openStripeCheckout(
    parsed.checkoutUrl,
    getUrgentCheckoutReturnUrl(),
  );

  if (checkout.outcome === 'success' && checkout.sessionId) {
    try {
      await verifyPaymentSession(checkout.sessionId);
    } catch {
      // /stripe/mobile-return may have already fulfilled the session.
    }
  }

  return checkout.outcome;
}

export async function initiateFeatureCheckout(
  feature: FeatureCheckoutKey,
): Promise<FeatureCheckoutResponse> {
  const { success_url, cancel_url } = buildPaymentRedirectUrls(feature);

  const response = await apiFetch<ApiResponse<FeatureCheckoutResponse>>(
    '/payments/feature-checkout',
    {
      method: 'POST',
      auth: true,
      body: {
        feature,
        success_url,
        cancel_url,
      },
    },
  );

  return response.data;
}

export async function completeWantedSearchesCheckout(): Promise<FeatureCheckoutOutcome> {
  const result = await initiateFeatureCheckout('wanted_searches');
  const parsed = parseCheckoutPayload(result);

  if (parsed.kind === 'fulfilled') {
    return 'fulfilled';
  }

  const checkout = await openStripeCheckout(parsed.checkoutUrl, getUrgentCheckoutReturnUrl());

  if (checkout.outcome === 'success' && checkout.sessionId) {
    try {
      await verifyPaymentSession(checkout.sessionId);
    } catch {
      // /stripe/mobile-return may have already fulfilled the session.
    }
  }

  return checkout.outcome;
}
