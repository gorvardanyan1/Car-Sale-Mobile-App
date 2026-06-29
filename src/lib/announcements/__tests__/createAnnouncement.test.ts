import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import { buildCreateAnnouncementFormData } from '@/lib/announcements/buildCreateAnnouncementFormData';
import {
  validateCreateAnnouncementStep1,
  validateCreateAnnouncementStep2,
} from '@/lib/announcements/validateCreateAnnouncement';
import type { CreateAnnouncementFormState, CreateFormConfig } from '@/types/announcement';

const t = ((key: string) => key) as TFunction;

const baseForm: CreateAnnouncementFormState = {
  subcategory_slug: 'suv',
  car_brand_id: 1,
  car_model_id: 2,
  country_id: 3,
  place_id: 4,
  vin: '',
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
  color_id: '',
  youtube_video: '',
  description: 'Great car.',
  features: { abs: true },
  mainImage: { uri: 'file://main.jpg', name: 'main.jpg', type: 'image/jpeg' },
  additionalImages: [],
  existingMainImagePath: null,
  existingAdditionalImagePaths: [],
};

const baseConfig: CreateFormConfig = {
  brands: [],
  carFeatures: [],
  countries: [],
  currencies: [],
  defaultCurrencyId: 1,
  subcategoryOptions: [{ slug: 'suv', name: 'SUV', path: 'suv', hidden_fields: [] }],
  colors: [],
  engineTypeOptions: [{ value: 'petrol', label: 'Petrol' }],
};

describe('validateCreateAnnouncementStep1', () => {
  it('passes when required fields are filled', () => {
    expect(validateCreateAnnouncementStep1(baseForm, baseConfig, t)).toEqual({ ok: true });
  });

  it('fails when brand is missing', () => {
    const result = validateCreateAnnouncementStep1(
      { ...baseForm, car_brand_id: '' },
      baseConfig,
      t,
    );
    expect(result.ok).toBe(false);
  });
});

describe('validateCreateAnnouncementStep2', () => {
  it('requires description and main image', () => {
    expect(validateCreateAnnouncementStep2(baseForm, t)).toEqual({ ok: true });

    expect(validateCreateAnnouncementStep2({ ...baseForm, description: ' ' }, t).ok).toBe(false);
    expect(validateCreateAnnouncementStep2({ ...baseForm, mainImage: null }, t).ok).toBe(false);
    expect(
      validateCreateAnnouncementStep2(
        { ...baseForm, mainImage: null, existingMainImagePath: 'main_images/existing.jpg' },
        t,
      ).ok,
    ).toBe(true);
  });
});

describe('buildCreateAnnouncementFormData', () => {
  it('maps core fields and enabled features', () => {
    const fields = buildCreateAnnouncementFormData({
      form: baseForm,
      subcategoryOptions: baseConfig.subcategoryOptions,
    });

    expect(fields.car_brand_id).toBe(1);
    expect(fields.description).toBe('Great car.');
    expect(fields.feature_abs).toBe('on');
    expect(fields.main_image).toEqual(baseForm.mainImage);
  });

  it('omits engine capacity for electric subcategories', () => {
    const fields = buildCreateAnnouncementFormData({
      form: { ...baseForm, engine_type: 'electro' },
      subcategoryOptions: [
        {
          slug: 'electric',
          name: 'Electric',
          path: 'electric',
          hidden_fields: ['engine_capacity'],
        },
      ],
    });

    expect(fields.engine_capacity).toBeUndefined();
  });
});
