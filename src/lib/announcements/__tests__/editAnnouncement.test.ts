import { describe, expect, it } from 'vitest';

import { buildEditAnnouncementFormData } from '@/lib/announcements/buildEditAnnouncementFormData';
import {
  mapAnnouncementToEditForm,
  parseAnnouncementDescription,
  parseAnnouncementFeatures,
  parseAnnouncementTranslations,
  parseAdditionalImagePaths,
} from '@/lib/announcements/mapAnnouncementToEditForm';
import type { CreateAnnouncementFormState } from '@/types/announcement';

const editForm: CreateAnnouncementFormState = {
  subcategory_slug: 'suv',
  car_brand_id: 1,
  car_model_id: 2,
  country_id: 3,
  place_id: 4,
  vin: 'VIN123',
  year: '2020',
  price: '15000',
  currency_id: 1,
  drive_type: 'fwd',
  transmission: 'automatic',
  horsepower: '150',
  mileage: '50000',
  mileage_unit: 'km',
  engine_capacity: '2.0',
  engine_type: 'petrol',
  color_id: 5,
  youtube_video: 'https://youtu.be/abcdefghijk',
  description: 'Updated listing.',
  features: { abs: true },
  mainImage: { uri: 'file://new-main.jpg', name: 'new-main.jpg', type: 'image/jpeg' },
  additionalImages: [{ uri: 'file://extra.jpg', name: 'extra.jpg', type: 'image/jpeg' }],
  existingMainImagePath: null,
  existingAdditionalImagePaths: ['additional_images/keep.jpg'],
  translationsEnabled: false,
  translations: { am: '', ru: '' },
  storePriceChange: false,
};

describe('mapAnnouncementToEditForm', () => {
  it('parses multilingual description to english text', () => {
    expect(parseAnnouncementDescription('{"en":"English text","am":"","ru":""}')).toBe('English text');
  });

  it('parses stored feature flags', () => {
    expect(parseAnnouncementFeatures('{"feature_abs":"on"}')).toEqual({ abs: true });
  });

  it('parses armenian and russian translations from a multilingual description', () => {
    expect(
      parseAnnouncementTranslations('{"en":"English text","am":"Հայերեն","ru":"Русский"}'),
    ).toEqual({ am: 'Հայերեն', ru: 'Русский' });
  });

  it('returns empty translations for a plain-text description', () => {
    expect(parseAnnouncementTranslations('Just English text')).toEqual({ am: '', ru: '' });
    expect(parseAnnouncementTranslations(null)).toEqual({ am: '', ru: '' });
  });

  it('parses additional image paths from json', () => {
    expect(parseAdditionalImagePaths('["additional_images/a.jpg","additional_images/b.jpg"]')).toEqual([
      'additional_images/a.jpg',
      'additional_images/b.jpg',
    ]);
  });

  it('maps announcement record into editable form state', () => {
    const form = mapAnnouncementToEditForm({
      id: 9,
      car_brand_id: 1,
      car_model_id: 2,
      country_id: 3,
      place_id: 4,
      subcategory_slug: 'suv',
      color_id: 5,
      vin: 'SECRET',
      year: 2020,
      price: 15000,
      currency_id: 1,
      drive_type: 'fwd',
      transmission: 'automatic',
      horsepower: 150,
      engine_capacity: 2,
      engine_type: 'petrol',
      mileage: { value: '12000', unit: 'km' },
      youtube_video: '',
      description: '{"en":"Nice car","am":"","ru":""}',
      feature: '{"feature_abs":"on"}',
      main_image_path: 'main_images/old.jpg',
      additional_images_path: '["additional_images/old-extra.jpg"]',
      status: 'active',
    });

    expect(form.year).toBe('2020');
    expect(form.description).toBe('Nice car');
    expect(form.features).toEqual({ abs: true });
    expect(form.existingMainImagePath).toBe('main_images/old.jpg');
    expect(form.existingAdditionalImagePaths).toEqual(['additional_images/old-extra.jpg']);
    expect(form.translationsEnabled).toBe(false);
    expect(form.translations).toEqual({ am: '', ru: '' });
    expect(form.storePriceChange).toBe(false);
  });

  it('enables translations when the stored description already has am/ru text', () => {
    const form = mapAnnouncementToEditForm({
      id: 9,
      car_brand_id: 1,
      car_model_id: 2,
      country_id: 3,
      place_id: 4,
      year: 2020,
      price: 15000,
      currency_id: 1,
      drive_type: 'fwd',
      transmission: 'automatic',
      horsepower: 150,
      engine_capacity: 2,
      mileage: { value: '12000', unit: 'km' },
      description: '{"en":"Nice car","am":"Լավ մեքենա","ru":""}',
    });

    expect(form.translationsEnabled).toBe(true);
    expect(form.translations).toEqual({ am: 'Լավ մեքենա', ru: '' });
  });
});

describe('buildEditAnnouncementFormData', () => {
  it('maps update payload with retained and new images', () => {
    const fields = buildEditAnnouncementFormData({
      announcementId: 9,
      form: editForm,
      subcategoryOptions: [{ slug: 'suv', name: 'SUV', path: 'suv', hidden_fields: [] }],
    });

    expect(fields.id).toBe(9);
    expect(fields.main_image_path).toEqual(editForm.mainImage);
    expect(fields.additional_images_path).toEqual(editForm.additionalImages);
    expect(fields.additional_images_url).toEqual(['additional_images/keep.jpg']);
    expect(fields.feature_abs).toBe('on');
    expect(fields.store_price_change).toBeUndefined();
  });

  it('includes store_price_change only when the user opted to record the price change', () => {
    const fields = buildEditAnnouncementFormData({
      announcementId: 9,
      form: { ...editForm, storePriceChange: true },
      subcategoryOptions: [],
    });

    expect(fields.store_price_change).toBe('1');
  });

  it('encodes description as a multilingual JSON blob when translations are enabled', () => {
    const fields = buildEditAnnouncementFormData({
      announcementId: 9,
      form: {
        ...editForm,
        translationsEnabled: true,
        translations: { am: 'Հայերեն', ru: 'Русский' },
      },
      subcategoryOptions: [],
    });

    expect(fields.description).toBe(
      JSON.stringify({ en: 'Updated listing.', am: 'Հայերեն', ru: 'Русский' }),
    );
  });
});
