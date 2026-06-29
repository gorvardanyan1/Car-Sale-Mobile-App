import { describe, expect, it, vi } from 'vitest';

import { shouldShowExpoGoPushBanner } from '@/lib/notifications/isRemotePushSupported';

vi.mock('expo-constants', () => ({
  default: {
    appOwnership: 'expo',
  },
}));

describe('shouldShowExpoGoPushBanner', () => {
  it('shows banner in Expo Go', () => {
    expect(shouldShowExpoGoPushBanner()).toBe(true);
  });
});
