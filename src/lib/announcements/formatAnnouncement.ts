import { config } from '@/constants/config';
import type { Announcement } from '@/types/announcement';

const storageBaseUrl = config.apiUrl.replace(/\/api\/v1$/, '');

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

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalized = path.replace(/^\/+/, '');

  if (normalized.startsWith('storage/')) {
    return `${storageBaseUrl}/${normalized}`;
  }

  return `${storageBaseUrl}/storage/${normalized}`;
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
