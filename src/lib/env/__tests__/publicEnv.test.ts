import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockExtra = vi.hoisted(() => ({ current: {} as Record<string, string | undefined> }));

vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return { extra: mockExtra.current };
    },
  },
}));

describe('readPublicEnv', () => {
  beforeEach(() => {
    mockExtra.current = {};
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers process.env when set', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://process.test/api/v1');
    mockExtra.current = { apiUrl: 'http://extra.test/api/v1' };

    const { readPublicEnv } = await import('../publicEnv');
    expect(readPublicEnv('EXPO_PUBLIC_API_URL')).toBe('http://process.test/api/v1');
  });

  it('falls back to expo extra when process.env is missing', async () => {
    mockExtra.current = { chatUrl: 'http://165.22.30.4:3000' };

    const { readPublicEnv } = await import('../publicEnv');
    expect(readPublicEnv('EXPO_PUBLIC_CHAT_URL')).toBe('http://165.22.30.4:3000');
  });

  it('returns undefined when neither source is set', async () => {
    const { readPublicEnv } = await import('../publicEnv');
    expect(readPublicEnv('EXPO_PUBLIC_API_URL')).toBeUndefined();
  });
});
