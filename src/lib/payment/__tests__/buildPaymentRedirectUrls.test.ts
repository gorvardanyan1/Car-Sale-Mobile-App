import { describe, expect, it, vi } from 'vitest';

vi.mock('@/constants/config', () => ({
  config: {
    apiUrl: 'http://192.168.0.109:8000/api/v1',
    apiRootUrl: 'http://192.168.0.109:8000/api',
    deviceName: 'mobile',
  },
}));

vi.mock('expo-linking', () => ({
  createURL: (path: string, options?: { queryParams?: Record<string, string> }) => {
    const query = options?.queryParams
      ? `?${new URLSearchParams(options.queryParams).toString()}`
      : '';

    return `exp://192.168.0.109:8081/--${path}${query}`;
  },
}));

import {
  buildPaymentRedirectUrls,
  getStripeMobileReturnPrefix,
  getWebAppOrigin,
} from '@/lib/payment/buildPaymentRedirectUrls';

describe('buildPaymentRedirectUrls', () => {
  it('builds HTTPS Stripe-compatible mobile return URLs with app_return deep link', () => {
    expect(getWebAppOrigin()).toBe('http://192.168.0.109:8000');

    const urls = buildPaymentRedirectUrls('urgent', 42);

    expect(urls.success_url).toContain('/stripe/mobile-return?');
    expect(urls.success_url).toContain('outcome=success');
    expect(urls.success_url).toContain('feature=urgent');
    expect(urls.success_url).toContain('app_scheme=exp');
    expect(urls.success_url).toContain(
      encodeURIComponent('exp://192.168.0.109:8081/--/settings/payment-result?outcome=success'),
    );
    expect(urls.cancel_url).toContain('outcome=cancel');
    expect(urls.success_url).not.toContain('car-sale-rn://');
    expect(urls.success_url).not.toContain('{CHECKOUT_SESSION_ID}');
    expect(getStripeMobileReturnPrefix()).toBe('http://192.168.0.109:8000/stripe/mobile-return');
  });

  it('builds wanted searches mobile return URLs', () => {
    const urls = buildPaymentRedirectUrls('wanted_searches');

    expect(urls.success_url).toContain('feature=wanted_searches');
    expect(urls.success_url).toContain('outcome=success');
    expect(urls.cancel_url).toContain('feature=wanted_searches');
    expect(urls.cancel_url).toContain('outcome=cancel');
  });
});
