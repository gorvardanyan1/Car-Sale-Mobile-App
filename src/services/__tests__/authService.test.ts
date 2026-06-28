import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch, setAuthToken } from '@/lib/api/client';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth/tokenStorage';
import * as authService from '@/services/authService';

vi.mock('@/lib/auth/tokenStorage', () => ({
  getStoredToken: vi.fn(),
  setStoredToken: vi.fn(),
  clearStoredToken: vi.fn(),
}));

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return {
    ...actual,
    apiFetch: vi.fn(),
    setAuthToken: vi.fn(),
  };
});

const mockUser = {
  id: 1,
  name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  email_verified_at: null,
  is_dealer_verified: false,
  roles: ['user'],
  created_at: '2026-01-01T00:00:00+00:00',
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login persists token and returns credentials', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { user: mockUser, token: 'test-token' },
    });

    const result = await authService.login({
      email: 'john@example.com',
      password: 'Password1!',
    });

    expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: {
        email: 'john@example.com',
        password: 'Password1!',
        device_name: 'mobile',
      },
    });
    expect(result.token).toBe('test-token');
  });

  it('persistSession stores token in memory and secure storage', async () => {
    const user = await authService.persistSession({ user: mockUser, token: 'abc123' });

    expect(setAuthToken).toHaveBeenCalledWith('abc123');
    expect(setStoredToken).toHaveBeenCalledWith('abc123');
    expect(user.email).toBe('john@example.com');
  });

  it('restoreSession clears invalid tokens', async () => {
    vi.mocked(getStoredToken).mockResolvedValueOnce('stale-token');
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('401'));

    const user = await authService.restoreSession();

    expect(setAuthToken).toHaveBeenCalledWith('stale-token');
    expect(setAuthToken).toHaveBeenCalledWith(null);
    expect(clearStoredToken).toHaveBeenCalled();
    expect(user).toBeNull();
  });

  it('logout clears token even when api call fails', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('network'));

    await authService.logout();

    expect(setAuthToken).toHaveBeenCalledWith(null);
    expect(clearStoredToken).toHaveBeenCalled();
  });
});
