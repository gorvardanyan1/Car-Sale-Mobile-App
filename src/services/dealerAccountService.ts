import { apiFetch, apiFormData } from '@/lib/api/client';
import { buildPaymentRedirectUrls, getStripeMobileReturnPrefix } from '@/lib/payment/buildPaymentRedirectUrls';
import { openStripeCheckout } from '@/lib/payment/openStripeCheckout';
import type { ApiResponse } from '@/types';
import type {
  DealerAccountResponse,
  DealerBusinessHour,
  DealerFollower,
  DealerFollowersMeta,
  DealerFollowStateResponse,
} from '@/types/dealer';
import type { PickedImage } from '@/types/announcement';

export type UpdateDealerProfilePayload = {
  name: string;
  about_us?: string | null;
  phone?: string | null;
  website?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  location?: string | null;
  business_hours?: DealerBusinessHour[];
  specializations?: string[];
};

export async function fetchDealerAccount(): Promise<DealerAccountResponse> {
  const response = await apiFetch<ApiResponse<DealerAccountResponse>>('/dealer/profile', {
    auth: true,
  });

  return response.data;
}

export type UpdateDealerProfileResult = Pick<DealerAccountResponse, 'user' | 'profile'>;

export async function updateDealerProfile(
  payload: UpdateDealerProfilePayload,
): Promise<UpdateDealerProfileResult> {
  const response = await apiFetch<ApiResponse<UpdateDealerProfileResult>>('/dealer/profile', {
    method: 'PUT',
    auth: true,
    body: payload,
  });

  return response.data;
}

export async function uploadDealerLogo(image: PickedImage): Promise<string> {
  const response = await apiFormData<ApiResponse<{ url: string }>>('/dealer/profile/logo', {
    method: 'POST',
    auth: true,
    fields: { logo: image },
  });

  return response.data.url;
}

export async function uploadDealerCover(image: PickedImage): Promise<string> {
  const response = await apiFormData<ApiResponse<{ url: string }>>('/dealer/profile/cover', {
    method: 'POST',
    auth: true,
    fields: { feature_image: image },
  });

  return response.data.url;
}

export async function followDealer(dealerId: number): Promise<DealerFollowStateResponse> {
  const response = await apiFetch<ApiResponse<DealerFollowStateResponse>>(
    `/dealers/${dealerId}/follow`,
    { method: 'POST', auth: true },
  );

  return response.data;
}

export async function unfollowDealer(dealerId: number): Promise<DealerFollowStateResponse> {
  const response = await apiFetch<ApiResponse<DealerFollowStateResponse>>(
    `/dealers/${dealerId}/follow`,
    { method: 'DELETE', auth: true },
  );

  return response.data;
}

export async function fetchDealerFollowers(
  page = 1,
): Promise<{ followers: DealerFollower[]; meta: DealerFollowersMeta }> {
  const response = await apiFetch<ApiResponse<DealerFollower[]>>(
    `/dealer/followers?page=${page}`,
    { auth: true },
  );

  return {
    followers: response.data,
    meta: (response.meta ?? {}) as DealerFollowersMeta,
  };
}

type DealerVerificationCheckoutResponse =
  | { fulfilled: true; free?: boolean }
  | { checkout_url: string; session_id: string };

function parseCheckoutPayload(
  data: DealerVerificationCheckoutResponse,
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

async function initiateDealerVerificationCheckout(): Promise<DealerVerificationCheckoutResponse> {
  const { success_url, cancel_url } = buildPaymentRedirectUrls('dealer_verification');

  const response = await apiFetch<ApiResponse<DealerVerificationCheckoutResponse>>(
    '/payments/dealer-verification',
    {
      method: 'POST',
      auth: true,
      body: { success_url, cancel_url },
    },
  );

  return response.data;
}

export async function verifyDealerVerificationSession(sessionId: string): Promise<{ fulfilled: boolean }> {
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

export type DealerVerificationCheckoutOutcome = 'fulfilled' | 'success' | 'cancel' | 'dismiss';

export async function completeDealerVerificationCheckout(): Promise<DealerVerificationCheckoutOutcome> {
  const result = await initiateDealerVerificationCheckout();
  const parsed = parseCheckoutPayload(result);

  if (parsed.kind === 'fulfilled') {
    return 'fulfilled';
  }

  const checkout = await openStripeCheckout(parsed.checkoutUrl, getStripeMobileReturnPrefix());

  if (checkout.outcome === 'success' && checkout.sessionId) {
    try {
      await verifyDealerVerificationSession(checkout.sessionId);
    } catch {
      // /stripe/mobile-return may have already fulfilled the session.
    }
  }

  return checkout.outcome;
}
