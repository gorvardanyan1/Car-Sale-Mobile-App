import { config } from '@/constants/config';

import type { Announcement, CarFeatureDefinition } from '@/types/announcement';

const storageBaseUrl = config.apiUrl.replace(/\/api\/v1$/, '');

/**
 * Rebases a storage path/URL onto this app's own API host.
 *
 * Some backend fields (e.g. category icon_url) are built server-side from
 * APP_URL and can point at a host the device can't reach (a local dev
 * domain, a different LAN IP than EXPO_PUBLIC_API_URL, etc). Any absolute
 * URL whose path matches our own Storage::url() convention (`/storage/...`)
 * gets rebased onto storageBaseUrl so it keeps loading regardless of what
 * origin the backend embedded. Absolute URLs that don't match that shape
 * (e.g. a dealer logo hosted on a real external CDN) are left untouched.
 */
export function resolveStorageImageUrl(path: string): string {
  if (!path) {
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    let pathname: string;
    try {
      pathname = new URL(path).pathname;
    } catch {
      return path;
    }

    const normalized = pathname.replace(/^\/+/, '');
    if (!normalized.startsWith('storage/')) {
      return path;
    }

    return `${storageBaseUrl}/${normalized}`;
  }

  const normalized = path.replace(/^\/+/, '');

  if (normalized.startsWith('storage/')) {
    return `${storageBaseUrl}/${normalized}`;
  }

  return `${storageBaseUrl}/storage/${normalized}`;
}

export function formatAnnouncementPrice(announcement: Announcement): string {
  const price = announcement.price ?? '';
  const currencyLabel = announcement.currency?.symbol || announcement.currency?.code || '$';

  if (price === '' || price === null || price === undefined) {
    return currencyLabel;
  }

  const formattedPrice = Number(price).toLocaleString();

  return `${formattedPrice} ${currencyLabel}`.trim();
}

export function getAnnouncementImageUrl(announcement: Announcement): string | null {
  const path = announcement.main_image_path ?? announcement.main_image;

  if (!path) {
    return null;
  }

  return resolveStorageImageUrl(path);
}

export function getAnnouncementTitle(announcement: Announcement): string {
  const brand = announcement.car_brand?.brand ?? '';
  const model = announcement.car_model?.model ?? '';

  return `${brand} ${model}`.trim() || `Listing #${announcement.id}`;
}

export function getMileageDisplay(announcement: Announcement): string {
  const mileage = announcement.mileage;

  if (!mileage) {
    return '';
  }

  if (typeof mileage === 'object' && mileage.value) {
    return `${Number(mileage.value).toLocaleString()} ${mileage.unit ?? 'km'}`;
  }

  if (typeof mileage === 'string') {
    return mileage;
  }

  return '';
}

export function formatDriveType(driveType: string | null | undefined): string {
  if (!driveType) return '—';
  return driveType.toUpperCase();
}

export function formatTransmission(transmission: string | null | undefined): string {
  if (!transmission) return '—';
  return transmission.charAt(0).toUpperCase() + transmission.slice(1);
}

export function formatHorsepower(horsepower: number | string | null | undefined): string {
  if (horsepower === null || horsepower === undefined || horsepower === '') return '—';
  return `${horsepower} HP`;
}

export function formatEngineCapacity(capacity: number | string | null | undefined): string {
  if (capacity === null || capacity === undefined || capacity === '') return '—';
  const numeric = Number(capacity);
  if (Number.isNaN(numeric)) return String(capacity);
  return `${numeric}L`;
}

export function isVerifiedDealerListing(announcement: Announcement): boolean {
  const user = announcement.user;
  return user?.is_dealer_verified === true || user?.is_dealer_verified === 1;
}

export function getDealerName(announcement: Announcement): string | null {
  if (!isVerifiedDealerListing(announcement)) return null;
  return announcement.user?.name ?? null;
}

export function getListingSubtitle(announcement: Announcement, location?: string | null): string {
  const parts = [
    announcement.year ? String(announcement.year) : null,
    getMileageDisplay(announcement) || null,
    location || null,
  ].filter(Boolean);

  return parts.join(' · ');
}

export function getAnnouncementLocation(announcement: Announcement): string {
  const place = announcement.place?.place;
  const country = announcement.country?.country;

  return [place, country].filter(Boolean).join(', ');
}

export function getAnnouncementViewsCount(announcement: Announcement): number {
  return announcement.views_count ?? announcement.viewsCount ?? 0;
}

export function getAnnouncementLikesCount(announcement: Announcement): number {
  return announcement.likes_count ?? announcement.likedQuantity ?? 0;
}

export function getAnnouncementShareUrl(announcementId: number): string {
  return `${storageBaseUrl}/announcements/view/${announcementId}`;
}

export function getAnnouncementDescription(announcement: Announcement): string {
  return (
    announcement.display_description?.trim() ||
    announcement.description?.trim() ||
    ''
  );
}

export function getAnnouncementGalleryUrls(announcement: Announcement): string[] {
  const urls: string[] = [];
  const main = getAnnouncementImageUrl(announcement);

  if (main) {
    urls.push(main);
  }

  if (!announcement.additional_images_path) {
    return urls;
  }

  try {
    const additional = JSON.parse(announcement.additional_images_path) as unknown;

    if (!Array.isArray(additional)) {
      return urls;
    }

    for (const item of additional) {
      if (typeof item !== 'string' || !item.trim()) {
        continue;
      }

      const url = resolveStorageImageUrl(item);
      if (!urls.includes(url)) {
        urls.push(url);
      }
    }
  } catch {
    // Ignore invalid additional image payloads.
  }

  return urls;
}

export function getAnnouncementFeatureLabels(
  announcement: Announcement,
  carFeatures: CarFeatureDefinition[] = [],
  language = 'en',
): string[] {
  let parsed: Record<string, unknown> = {};

  try {
    parsed = JSON.parse(announcement.feature || '{}') as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const keys = Object.entries(parsed)
    .filter(([key, value]) => key.startsWith('feature_') && value === 'on')
    .map(([key]) => key.replace('feature_', ''));

  const currentLang = language || 'en';

  return keys.map((featureKey) => {
    const definition = carFeatures.find((feature) => feature.key === featureKey);
    const localizedKey = `name_${currentLang}` as keyof CarFeatureDefinition;

    return (
      (definition?.[localizedKey] as string | undefined) ||
      definition?.name_en ||
      featureKey.replace(/_/g, ' ')
    );
  });
}
