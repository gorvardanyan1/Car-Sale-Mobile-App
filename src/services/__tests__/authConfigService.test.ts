import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { fetchMobileAuthConfig } from '@/services/authConfigService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('authConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches mobile auth config', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { dealer_auth_enabled: false },
    });

    const config = await fetchMobileAuthConfig();

    expect(apiFetch).toHaveBeenCalledWith('/auth/config');
    expect(config.dealer_auth_enabled).toBe(false);
  });
});
