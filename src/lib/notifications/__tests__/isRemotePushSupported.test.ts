import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    appOwnership: 'expo',
  },
}));

import { isExpoGo, isRemotePushSupported } from '@/lib/notifications/isRemotePushSupported';

describe('isRemotePushSupported', () => {
  it('detects Expo Go', () => {
    expect(isExpoGo()).toBe(true);
    expect(isRemotePushSupported()).toBe(false);
  });
});
