import { config } from '@/constants/config';
import { getOrCreateDeviceId, setStoredDeviceId } from '@/lib/device/deviceIdStorage';

type ClientViewResponse = {
  success?: boolean;
  deviceId?: string;
};

/**
 * Records a server-side unique view (legacy `/api/announcements/clientView/{id}`).
 * Sends the persisted `device_id` cookie equivalent used on web.
 */
export async function recordAnnouncementClientView(announcementId: number): Promise<void> {
  if (!Number.isFinite(announcementId) || announcementId <= 0) {
    return;
  }

  const deviceId = await getOrCreateDeviceId();
  const url = `${config.apiRootUrl}/announcements/clientView/${announcementId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Cookie: `device_id=${deviceId}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as ClientViewResponse;

    if (payload.deviceId) {
      await setStoredDeviceId(payload.deviceId);
    }
  } catch {
    // View tracking is best-effort.
  }
}
