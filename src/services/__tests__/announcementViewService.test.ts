import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAnnouncementClientView } from '@/services/announcementViewService';

vi.mock('@/constants/config', () => ({
  config: {
    apiRootUrl: 'http://autohayq/api',
  },
}));

vi.mock('@/lib/device/deviceIdStorage', () => ({
  getOrCreateDeviceId: vi.fn(async () => 'device-123'),
  setStoredDeviceId: vi.fn(async () => undefined),
}));

describe('announcementViewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('records client view with device_id cookie', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, deviceId: 'device-123' }),
    } as Response);

    await recordAnnouncementClientView(15);

    expect(fetch).toHaveBeenCalledWith('http://autohayq/api/announcements/clientView/15', {
      headers: {
        Accept: 'application/json',
        Cookie: 'device_id=device-123',
      },
    });
  });

  it('ignores invalid announcement ids', async () => {
    await recordAnnouncementClientView(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
