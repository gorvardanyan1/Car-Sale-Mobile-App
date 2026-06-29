import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getLocalViewIds,
  LOCAL_VIEW_STORAGE_KEY,
  trackLocalAnnouncementView,
} from '@/lib/announcements/localViewStorage';

const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
});

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

describe('localViewStorage', () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  it('tracks each announcement id only once', async () => {
    await trackLocalAnnouncementView(42);
    await trackLocalAnnouncementView(42);
    await trackLocalAnnouncementView(99);

    expect(await getLocalViewIds()).toEqual([42, 99]);
    expect(JSON.parse(storage.get(LOCAL_VIEW_STORAGE_KEY) ?? '[]')).toEqual([42, 99]);
  });

  it('ignores invalid ids', async () => {
    await trackLocalAnnouncementView(null);
    await trackLocalAnnouncementView('');

    expect(await getLocalViewIds()).toEqual([]);
  });
});
