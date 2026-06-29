import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-web-browser', () => ({
  openAuthSessionAsync: vi.fn(),
}));

import * as WebBrowser from 'expo-web-browser';

import { openStripeCheckout } from '@/lib/payment/openStripeCheckout';

describe('openStripeCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-http checkout URLs', async () => {
    await expect(openStripeCheckout('javascript:alert(1)', 'http://example.com/return')).rejects.toThrow(
      'Invalid checkout URL',
    );
  });

  it('opens auth session and returns success with session id', async () => {
    vi.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValueOnce({
      type: 'success',
      url: 'http://192.168.0.109:8000/stripe/mobile-return?outcome=success&feature=urgent&session_id=cs_test',
    });

    const result = await openStripeCheckout(
      'https://checkout.stripe.com/pay/cs_test',
      'http://192.168.0.109:8000/stripe/mobile-return',
    );

    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://checkout.stripe.com/pay/cs_test',
      'http://192.168.0.109:8000/stripe/mobile-return',
      { preferEphemeralSession: false, showInRecents: false },
    );
    expect(result).toEqual({ outcome: 'success', sessionId: 'cs_test' });
  });

  it('maps cancel outcome from return URL', async () => {
    vi.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValueOnce({
      type: 'success',
      url: 'http://192.168.0.109:8000/stripe/mobile-return?outcome=cancel&feature=urgent',
    });

    const result = await openStripeCheckout(
      'https://checkout.stripe.com/pay/cs_test',
      'http://192.168.0.109:8000/stripe/mobile-return',
    );

    expect(result).toEqual({ outcome: 'cancel', sessionId: undefined });
  });
});
