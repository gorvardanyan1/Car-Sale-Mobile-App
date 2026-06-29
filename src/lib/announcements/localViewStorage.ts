import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Matches web `localStorage` key for viewed listing ids. */
export const LOCAL_VIEW_STORAGE_KEY = 'localView';

function getWebLocalViews(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(LOCAL_VIEW_STORAGE_KEY);
}

function setWebLocalViews(value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_VIEW_STORAGE_KEY, value);
  }
}

async function readRawLocalViews(): Promise<unknown[]> {
  try {
    const raw =
      Platform.OS === 'web'
        ? getWebLocalViews()
        : await SecureStore.getItemAsync(LOCAL_VIEW_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRawLocalViews(views: unknown[]): Promise<void> {
  const payload = JSON.stringify(views);

  if (Platform.OS === 'web') {
    setWebLocalViews(payload);
    return;
  }

  await SecureStore.setItemAsync(LOCAL_VIEW_STORAGE_KEY, payload);
}

export async function getLocalViewIds(): Promise<number[]> {
  const views = await readRawLocalViews();

  return views
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

export async function isAnnouncementViewedLocally(announcementId: number): Promise<boolean> {
  const views = await getLocalViewIds();
  return views.some((item) => item === announcementId);
}

/**
 * Record a listing id once (guest view tracking), mirroring web `trackLocalAnnouncementView`.
 */
export async function trackLocalAnnouncementView(
  announcementId: number | string | null | undefined,
): Promise<void> {
  if (announcementId == null || announcementId === '') {
    return;
  }

  const id = Number(announcementId);
  if (!Number.isFinite(id) || id <= 0) {
    return;
  }

  const views = await readRawLocalViews();
  const alreadyTracked = views.some((item) => Number(item) === id);

  if (alreadyTracked) {
    return;
  }

  await writeRawLocalViews([...views, id]);
}
