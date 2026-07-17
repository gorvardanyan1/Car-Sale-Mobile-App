import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-web-browser', () => ({
  openAuthSessionAsync: vi.fn(),
  maybeCompleteAuthSession: vi.fn(),
}));

import { apiFetch } from '@/lib/api/client';
import * as openStripeCheckoutModule from '@/lib/payment/openStripeCheckout';
import {
  completeUrgentListingCheckout,
  completeWantedSearchesCheckout,
  initiateFeatureCheckout,
  initiateUrgentListingCheckout,
} from '@/services/paymentService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/payment/buildPaymentRedirectUrls', () => ({
  buildPaymentRedirectUrls: () => ({
    success_url: 'http://192.168.0.109:8000/stripe/mobile-return?outcome=success&feature=urgent&announcement_id=42',
    cancel_url: 'http://192.168.0.109:8000/stripe/mobile-return?outcome=cancel&feature=urgent&announcement_id=42',
  }),
  getStripeMobileReturnPrefix: () => 'http://192.168.0.109:8000/stripe/mobile-return',
}));

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initiates urgent listing checkout with redirect URLs', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { checkout_url: 'https://checkout.stripe.com/pay/cs_test', session_id: 'cs_test' },
    });

    const result = await initiateUrgentListingCheckout(42);

    expect(apiFetch).toHaveBeenCalledWith('/payments/urgent-listing', {
      method: 'POST',
      auth: true,
      body: expect.objectContaining({
        announcement_id: 42,
        success_url: expect.stringContaining('/stripe/mobile-return'),
        cancel_url: expect.stringContaining('/stripe/mobile-return'),
      }),
    });
    expect(result).toMatchObject({ checkout_url: 'https://checkout.stripe.com/pay/cs_test' });
  });

  it('returns fulfilled without opening browser when feature is free', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { fulfilled: true, free: true },
    });

    const openSpy = vi.spyOn(openStripeCheckoutModule, 'openStripeCheckout');

    const outcome = await completeUrgentListingCheckout(7);

    expect(outcome).toBe('fulfilled');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens Stripe checkout for paid urgent listing', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { checkout_url: 'https://checkout.stripe.com/pay/cs_test', session_id: 'cs_test' },
    });

    vi.spyOn(openStripeCheckoutModule, 'openStripeCheckout').mockResolvedValueOnce({
      outcome: 'success',
      sessionId: 'cs_test',
    });

    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { fulfilled: true, type: 'urgent' } });

    const outcome = await completeUrgentListingCheckout(9);

    expect(openStripeCheckoutModule.openStripeCheckout).toHaveBeenCalledWith(
      'https://checkout.stripe.com/pay/cs_test',
      'http://192.168.0.109:8000/stripe/mobile-return',
    );
    expect(apiFetch).toHaveBeenCalledWith('/payments/verify-session', {
      method: 'POST',
      auth: true,
      body: { session_id: 'cs_test' },
    });
    expect(outcome).toBe('success');
  });

  it('initiates wanted searches feature checkout with redirect URLs', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { checkout_url: 'https://checkout.stripe.com/pay/cs_wanted', session_id: 'cs_wanted' },
    });

    const result = await initiateFeatureCheckout('wanted_searches');

    expect(apiFetch).toHaveBeenCalledWith('/payments/feature-checkout', {
      method: 'POST',
      auth: true,
      body: expect.objectContaining({
        feature: 'wanted_searches',
        success_url: expect.stringContaining('/stripe/mobile-return'),
        cancel_url: expect.stringContaining('/stripe/mobile-return'),
      }),
    });
    expect(result).toMatchObject({ checkout_url: 'https://checkout.stripe.com/pay/cs_wanted' });
  });

  it('completes wanted searches checkout when feature is free', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { fulfilled: true, free: true },
    });

    const openSpy = vi.spyOn(openStripeCheckoutModule, 'openStripeCheckout');
    const outcome = await completeWantedSearchesCheckout();

    expect(outcome).toBe('fulfilled');
    expect(openSpy).not.toHaveBeenCalled();
  });
});
