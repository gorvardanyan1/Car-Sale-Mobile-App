import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { unregisterStoredPushToken } from '@/lib/notifications/pushTokenStorage';
import * as pushTokenService from '@/services/pushTokenService';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('@/services/pushTokenService', () => ({
  unregisterPushToken: vi.fn(),
}));

describe('pushTokenStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unregisters and clears a stored push token on logout', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('ExponentPushToken[stored]');
    vi.mocked(pushTokenService.unregisterPushToken).mockResolvedValueOnce(undefined);
    vi.mocked(SecureStore.deleteItemAsync).mockResolvedValueOnce(undefined);

    await unregisterStoredPushToken();

    expect(pushTokenService.unregisterPushToken).toHaveBeenCalledWith('ExponentPushToken[stored]');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('autohayq_push_token');
  });

  it('skips unregister when no stored token exists', async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null);

    await unregisterStoredPushToken();

    expect(pushTokenService.unregisterPushToken).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});
