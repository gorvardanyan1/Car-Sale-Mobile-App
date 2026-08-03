import { beforeEach, describe, expect, it, vi } from 'vitest';

const setNotificationHandler = vi.fn();
const setNotificationChannelAsync = vi.fn().mockResolvedValue(null);

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-notifications', () => ({
  setNotificationHandler,
  setNotificationChannelAsync,
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
}));

vi.mock('@/lib/notifications/isRemotePushSupported', () => ({
  isRemotePushSupported: () => true,
}));

// Pulled in transitively via pushTokenStorage; its native module is not
// loadable under the node test environment.
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/pushTokenService', () => ({
  registerPushToken: vi.fn().mockResolvedValue(undefined),
  unregisterPushToken: vi.fn().mockResolvedValue(undefined),
}));

describe('configureForegroundNotifications on Android', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('creates the high-importance chat channel the backend targets', async () => {
    const { configureForegroundNotifications, CHAT_CHANNEL_ID } = await import(
      '@/lib/notifications/pushNotifications'
    );

    await expect(configureForegroundNotifications()).resolves.toBe(true);

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      CHAT_CHANNEL_ID,
      expect.objectContaining({ importance: 5, sound: 'default' }),
    );
  });

  it('installs a handler that shows a banner without the deprecated shouldShowAlert', async () => {
    const { configureForegroundNotifications } = await import(
      '@/lib/notifications/pushNotifications'
    );

    await configureForegroundNotifications();

    const handler = setNotificationHandler.mock.calls[0]?.[0];
    const behaviour = await handler.handleNotification();

    expect(behaviour.shouldShowBanner).toBe(true);
    expect(behaviour).not.toHaveProperty('shouldShowAlert');
  });

  it('still installs the handler when channel creation fails', async () => {
    setNotificationChannelAsync.mockRejectedValueOnce(new Error('no channel'));

    const { configureForegroundNotifications } = await import(
      '@/lib/notifications/pushNotifications'
    );

    await expect(configureForegroundNotifications()).resolves.toBe(true);
    expect(setNotificationHandler).toHaveBeenCalled();
  });
});
