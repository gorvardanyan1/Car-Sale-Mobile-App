import { apiFetch } from '@/lib/api/client';

export type PushPlatform = 'ios' | 'android';

export async function registerPushToken(
  token: string,
  platform: PushPlatform,
  deviceName?: string,
): Promise<void> {
  await apiFetch('/push-tokens', {
    method: 'POST',
    auth: true,
    body: {
      token,
      platform,
      device_name: deviceName,
    },
  });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await apiFetch('/push-tokens', {
    method: 'DELETE',
    auth: true,
    body: { token },
  });
}
