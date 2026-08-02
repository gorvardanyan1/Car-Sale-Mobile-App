import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-web-browser', () => ({
  openAuthSessionAsync: vi.fn(),
  maybeCompleteAuthSession: vi.fn(),
}));

import { apiFetch, apiFormData } from '@/lib/api/client';
import * as openStripeCheckoutModule from '@/lib/payment/openStripeCheckout';
import {
  completeDealerVerificationCheckout,
  fetchDealerAccount,
  fetchDealerFollowers,
  followDealer,
  unfollowDealer,
  updateDealerProfile,
  uploadDealerCover,
  uploadDealerLogo,
} from '@/services/dealerAccountService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  apiFormData: vi.fn(),
}));

vi.mock('@/lib/payment/buildPaymentRedirectUrls', () => ({
  buildPaymentRedirectUrls: () => ({
    success_url: 'http://192.168.0.109:8000/stripe/mobile-return?outcome=success&feature=dealer_verification',
    cancel_url: 'http://192.168.0.109:8000/stripe/mobile-return?outcome=cancel&feature=dealer_verification',
  }),
  getStripeMobileReturnPrefix: () => 'http://192.168.0.109:8000/stripe/mobile-return',
}));

describe('dealerAccountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the dealer account with verification metadata', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        user: { id: 1, name: 'Best Motors', roles: ['dealer'] },
        profile: { about_us: 'We sell cars', logo: null },
        dealer_verification_price_cents: 9900,
        dealer_verification_billing_mode: 'one_time',
        is_dealer_verified: false,
        dealer_badge_feature_access: {
          status: 'payment_required',
          feature: 'dealer_badge',
          reason: 'payment_required',
          billing_mode: 'one_time',
          price_cents: 9900,
          stripe_price_id: 'price_123',
        },
      },
    });

    const result = await fetchDealerAccount();

    expect(apiFetch).toHaveBeenCalledWith('/dealer/profile', { auth: true });
    expect(result.dealer_verification_price_cents).toBe(9900);
    expect(result.dealer_badge_feature_access.status).toBe('payment_required');
  });

  it('updates the dealer profile with the full company payload', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        user: { id: 1, name: 'New Name', roles: ['dealer'] },
        profile: { about_us: 'Updated', logo: null },
      },
    });

    await updateDealerProfile({
      name: 'New Name',
      about_us: 'Updated',
      phone: '+37410123456',
      location: 'Yerevan',
      business_hours: [{ day: 'Mon', hours: '9-6' }],
      specializations: ['SUV', 'Sedan'],
    });

    expect(apiFetch).toHaveBeenCalledWith('/dealer/profile', {
      method: 'PUT',
      auth: true,
      body: expect.objectContaining({
        name: 'New Name',
        about_us: 'Updated',
        business_hours: [{ day: 'Mon', hours: '9-6' }],
        specializations: ['SUV', 'Sedan'],
      }),
    });
  });

  it('uploads the dealer logo as multipart form data', async () => {
    vi.mocked(apiFormData).mockResolvedValueOnce({
      data: { url: 'https://cdn.test/logo.jpg' },
    });

    const image = { uri: 'file://logo.jpg', name: 'logo.jpg', type: 'image/jpeg' };
    const url = await uploadDealerLogo(image);

    expect(url).toBe('https://cdn.test/logo.jpg');
    expect(apiFormData).toHaveBeenCalledWith('/dealer/profile/logo', {
      method: 'POST',
      auth: true,
      fields: { logo: image },
    });
  });

  it('uploads the dealer cover image as multipart form data', async () => {
    vi.mocked(apiFormData).mockResolvedValueOnce({
      data: { url: 'https://cdn.test/cover.jpg' },
    });

    const image = { uri: 'file://cover.jpg', name: 'cover.jpg', type: 'image/jpeg' };
    const url = await uploadDealerCover(image);

    expect(url).toBe('https://cdn.test/cover.jpg');
    expect(apiFormData).toHaveBeenCalledWith('/dealer/profile/cover', {
      method: 'POST',
      auth: true,
      fields: { feature_image: image },
    });
  });

  it('follows a dealer and returns the updated follow state', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { dealer_id: 9, is_followed: true, followers_count: 4 },
    });

    const result = await followDealer(9);

    expect(apiFetch).toHaveBeenCalledWith('/dealers/9/follow', { method: 'POST', auth: true });
    expect(result).toEqual({ dealer_id: 9, is_followed: true, followers_count: 4 });
  });

  it('unfollows a dealer and returns the updated follow state', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { dealer_id: 9, is_followed: false, followers_count: 3 },
    });

    const result = await unfollowDealer(9);

    expect(apiFetch).toHaveBeenCalledWith('/dealers/9/follow', { method: 'DELETE', auth: true });
    expect(result.is_followed).toBe(false);
    expect(result.followers_count).toBe(3);
  });

  it('fetches the dealer followers list with pagination meta', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: [{ id: 5, name: 'Jane', followed_at: '2026-01-01T00:00:00Z', member_since: 'January 2025' }],
      meta: { current_page: 1, last_page: 2, per_page: 15, total: 20, followers_count: 20 },
    });

    const result = await fetchDealerFollowers(1);

    expect(apiFetch).toHaveBeenCalledWith('/dealer/followers?page=1', { auth: true });
    expect(result.followers).toHaveLength(1);
    expect(result.meta.followers_count).toBe(20);
  });

  it('returns fulfilled without opening the browser when verification is free', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { fulfilled: true, free: true },
    });

    const openSpy = vi.spyOn(openStripeCheckoutModule, 'openStripeCheckout');

    const outcome = await completeDealerVerificationCheckout();

    expect(outcome).toBe('fulfilled');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens Stripe checkout and verifies the session for paid verification', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { checkout_url: 'https://checkout.stripe.com/pay/cs_dealer', session_id: 'cs_dealer' },
    });

    vi.spyOn(openStripeCheckoutModule, 'openStripeCheckout').mockResolvedValueOnce({
      outcome: 'success',
      sessionId: 'cs_dealer',
    });

    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { fulfilled: true, type: 'dealer_verification' } });

    const outcome = await completeDealerVerificationCheckout();

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/payments/dealer-verification', {
      method: 'POST',
      auth: true,
      body: expect.objectContaining({
        success_url: expect.stringContaining('/stripe/mobile-return'),
        cancel_url: expect.stringContaining('/stripe/mobile-return'),
      }),
    });
    expect(openStripeCheckoutModule.openStripeCheckout).toHaveBeenCalledWith(
      'https://checkout.stripe.com/pay/cs_dealer',
      'http://192.168.0.109:8000/stripe/mobile-return',
    );
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/payments/verify-session', {
      method: 'POST',
      auth: true,
      body: { session_id: 'cs_dealer' },
    });
    expect(outcome).toBe('success');
  });

  it('returns cancel outcome without verifying a session when checkout is canceled', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { checkout_url: 'https://checkout.stripe.com/pay/cs_dealer', session_id: 'cs_dealer' },
    });

    vi.spyOn(openStripeCheckoutModule, 'openStripeCheckout').mockResolvedValueOnce({
      outcome: 'cancel',
    });

    const outcome = await completeDealerVerificationCheckout();

    expect(outcome).toBe('cancel');
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
