import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { registerPushToken, unregisterPushToken } from '@/services/pushTokenService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('pushTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a push token', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { id: 1, platform: 'android' } });

    await registerPushToken('ExponentPushToken[abc]', 'android', 'Pixel');

    expect(apiFetch).toHaveBeenCalledWith('/push-tokens', {
      method: 'POST',
      auth: true,
      body: {
        token: 'ExponentPushToken[abc]',
        platform: 'android',
        device_name: 'Pixel',
      },
    });
  });

  it('unregisters a push token', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(undefined);

    await unregisterPushToken('ExponentPushToken[abc]');

    expect(apiFetch).toHaveBeenCalledWith('/push-tokens', {
      method: 'DELETE',
      auth: true,
      body: { token: 'ExponentPushToken[abc]' },
    });
  });
});
