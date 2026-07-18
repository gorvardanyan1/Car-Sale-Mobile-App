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
  resolveStorageImageUrl,
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

  describe('resolveStorageImageUrl', () => {
    it('rebases a relative storage path onto the app API host', () => {
      expect(resolveStorageImageUrl('storage/cars/main.jpg')).toBe(
        'http://localhost/storage/cars/main.jpg',
      );
    });

    it('prefixes a bare path with /storage', () => {
      expect(resolveStorageImageUrl('cars/main.jpg')).toBe('http://localhost/storage/cars/main.jpg');
    });

    it('rebases a /storage/ URL from a mismatched host onto the app API host', () => {
      expect(resolveStorageImageUrl('http://autohayq.loc/storage/category-icons/suv.png')).toBe(
        'http://localhost/storage/category-icons/suv.png',
      );
    });

    it('rebases an https /storage/ URL from a mismatched host too', () => {
      expect(resolveStorageImageUrl('https://staging.autohayq.com/storage/icons/sedan.png')).toBe(
        'http://localhost/storage/icons/sedan.png',
      );
    });

    it('leaves a genuine external URL (no /storage/ path) untouched', () => {
      expect(resolveStorageImageUrl('https://cdn.example.com/logo.jpg')).toBe(
        'https://cdn.example.com/logo.jpg',
      );
    });

    it('returns falsy input unchanged', () => {
      expect(resolveStorageImageUrl('')).toBe('');
    });
  });
});
