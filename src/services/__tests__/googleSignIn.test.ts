import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { fetchMobileAuthConfig } from '@/services/authConfigService';
import * as authService from '@/services/authService';

// tokenStorage reaches into react-native for Platform; the node test env
// cannot parse RN's Flow-typed entrypoint, and this suite is about the request
// shape, not storage.
vi.mock('@/lib/auth/tokenStorage', () => ({
  getStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
  clearStoredToken: vi.fn(),
}));

vi.mock('@/lib/notifications/pushTokenStorage', () => ({
  unregisterStoredPushToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiFetch: vi.fn(), setAuthToken: vi.fn() };
});

const mockUser = {
  id: 7,
  name: 'Ani',
  last_name: 'Petrosyan',
  email: 'ani.petrosyan@gmail.com',
  email_verified_at: '2026-08-09T00:00:00+00:00',
  is_dealer_verified: false,
  roles: ['user'],
  created_at: '2026-08-09T00:00:00+00:00',
};

describe('loginWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockResolvedValue({ data: { user: mockUser, token: 'sanctum-token' } });
  });

  it('posts only the id token and device name, never an identity claim', async () => {
    await authService.loginWithGoogle({ idToken: 'google.id.token' });

    expect(apiFetch).toHaveBeenCalledWith('/auth/google', {
      method: 'POST',
      body: { id_token: 'google.id.token', device_name: 'mobile' },
    });

    // The server reads email/name/sub out of the verified token. Sending them
    // would create a field an attacker could set to claim another identity.
    const body = vi.mocked(apiFetch).mock.calls[0][1]?.body as Record<string, unknown>;
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('name');
    expect(body).not.toHaveProperty('google_id');
  });

  it('forwards an invite code when the user arrived through a referral link', async () => {
    await authService.loginWithGoogle({ idToken: 'google.id.token', referralCode: 'INVITE01' });

    const body = vi.mocked(apiFetch).mock.calls[0][1]?.body as Record<string, unknown>;
    expect(body.referral_code).toBe('INVITE01');
  });

  it('omits the referral code entirely rather than sending an empty one', async () => {
    await authService.loginWithGoogle({ idToken: 'google.id.token', referralCode: '' });

    const body = vi.mocked(apiFetch).mock.calls[0][1]?.body as Record<string, unknown>;
    expect(body).not.toHaveProperty('referral_code');
  });

  it('returns the credentials the API issued', async () => {
    const credentials = await authService.loginWithGoogle({ idToken: 'google.id.token' });

    expect(credentials.token).toBe('sanctum-token');
    expect(credentials.user.email).toBe('ani.petrosyan@gmail.com');
  });

  it('propagates an API rejection instead of swallowing it', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('401 unauthorized'));

    await expect(authService.loginWithGoogle({ idToken: 'forged' })).rejects.toThrow(
      '401 unauthorized',
    );
  });
});

describe('fetchMobileAuthConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns every auth switch the screens need', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        dealer_auth_enabled: false,
        registration_enabled: true,
        google_enabled: true,
        google_registration_enabled: false,
      },
    });

    const config = await fetchMobileAuthConfig();

    expect(config).toEqual({
      dealer_auth_enabled: false,
      registration_enabled: true,
      google_enabled: true,
      google_registration_enabled: false,
    });
    expect(apiFetch).toHaveBeenCalledWith('/auth/config');
  });
});
