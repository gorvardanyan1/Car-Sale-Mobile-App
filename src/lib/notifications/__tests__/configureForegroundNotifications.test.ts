import { beforeEach, describe, expect, it, vi } from 'vitest';

const setNotificationHandler = vi.fn();
const setNotificationChannelAsync = vi.fn().mockResolvedValue(null);
const setNotificationCategoryAsync = vi.fn().mockResolvedValue(null);

const notificationWith = (data: Record<string, unknown>) => ({ request: { content: { data } } });

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-notifications', () => ({
  setNotificationHandler,
  setNotificationChannelAsync,
  setNotificationCategoryAsync,
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PRIVATE: 0, PUBLIC: 1 },
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
    const behaviour = await handler.handleNotification(notificationWith({ type: 'chat_message' }));

    expect(behaviour.shouldShowBanner).toBe(true);
    expect(behaviour.shouldPlaySound).toBe(true);
    expect(behaviour).not.toHaveProperty('shouldShowAlert');
  });

  it('keeps a call push silent in the foreground, where the call screen already rings', async () => {
    const { configureForegroundNotifications } = await import(
      '@/lib/notifications/pushNotifications'
    );

    await configureForegroundNotifications();

    const handler = setNotificationHandler.mock.calls[0]?.[0];
    const behaviour = await handler.handleNotification(
      notificationWith({ type: 'chat_call', call_id: '64b7f0c2c2a4e1eeeeeeeeee' }),
    );

    expect(behaviour).toEqual({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    });
  });

  it('creates the public, max-importance call channel and the Answer / Decline category', async () => {
    const { configureForegroundNotifications, CALL_CHANNEL_ID, CALL_CATEGORY_ID, CALL_ACTION_ACCEPT, CALL_ACTION_DECLINE } =
      await import('@/lib/notifications/pushNotifications');

    await configureForegroundNotifications();

    // Must match IncomingCallNotification on the Laravel side.
    expect(CALL_CHANNEL_ID).toBe('chat-calls');
    expect(CALL_CATEGORY_ID).toBe('incoming-call');
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'chat-calls',
      expect.objectContaining({ importance: 5, lockscreenVisibility: 1 }),
    );

    const [category, actions] = setNotificationCategoryAsync.mock.calls[0];
    expect(category).toBe('incoming-call');
    expect(actions).toEqual([
      expect.objectContaining({
        identifier: CALL_ACTION_DECLINE,
        options: expect.objectContaining({ opensAppToForeground: false, isDestructive: true }),
      }),
      expect.objectContaining({
        identifier: CALL_ACTION_ACCEPT,
        options: expect.objectContaining({ opensAppToForeground: true }),
      }),
    ]);
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
