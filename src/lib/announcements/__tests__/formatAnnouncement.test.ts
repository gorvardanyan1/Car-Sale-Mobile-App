import { describe, expect, it } from 'vitest';

import {
  formatDriveType,
  formatEngineCapacity,
  formatHorsepower,
  formatTransmission,
  getAnnouncementFeatureLabels,
  getAnnouncementGalleryUrls,
  getListingSubtitle,
  isVerifiedDealerListing,
} from '@/lib/announcements/formatAnnouncement';
import type { Announcement } from '@/types/announcement';

const baseAnnouncement: Announcement = {
  id: 1,
  year: 2017,
  price: 98000,
  currency_id: 1,
  drive_type: 'fwd',
  transmission: 'automatic',
  horsepower: 250,
  engine_capacity: 2,
  mileage: { value: '5000', unit: 'km' },
  is_hurry: 'no',
  car_brand_id: 1,
  car_model_id: 1,
  user: { id: 1, name: 'AutoLux', is_dealer_verified: true },
};

describe('formatAnnouncement helpers', () => {
  it('formats drive, transmission, hp, and engine', () => {
    expect(formatDriveType('awd')).toBe('AWD');
    expect(formatTransmission('automatic')).toBe('Automatic');
    expect(formatHorsepower(250)).toBe('250 HP');
    expect(formatEngineCapacity(2)).toBe('2L');
  });

  it('builds subtitle from year, mileage, and location', () => {
    expect(getListingSubtitle(baseAnnouncement, 'Dubai, UAE')).toBe('2017 · 5,000 km · Dubai, UAE');
  });

  it('detects verified dealer listings', () => {
    expect(isVerifiedDealerListing(baseAnnouncement)).toBe(true);
    expect(
      isVerifiedDealerListing({
        ...baseAnnouncement,
        user: { id: 2, name: 'John', is_dealer_verified: false },
      }),
    ).toBe(false);
  });

  it('builds gallery urls and feature labels from API payloads', () => {
    const announcement = {
      ...baseAnnouncement,
      main_image_path: 'storage/cars/main.jpg',
      additional_images_path: JSON.stringify(['storage/cars/extra.jpg']),
      feature: JSON.stringify({ feature_sunroof: 'on' }),
    };

    expect(getAnnouncementGalleryUrls(announcement)).toHaveLength(2);
    expect(
      getAnnouncementFeatureLabels(announcement, [{ key: 'sunroof', name_en: 'Sunroof' }]),
    ).toEqual(['Sunroof']);
  });
});
