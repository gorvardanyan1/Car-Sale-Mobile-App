import type { TFunction } from 'i18next';

import type { CreateAnnouncementFormState, CreateFormConfig } from '@/types/announcement';

export type CreateAnnouncementValidationResult =
  | { ok: true }
  | { ok: false; message: string; fieldLabel: string };

function isEmpty(value: string | number | '' | null | undefined): boolean {
  return value === '' || value === null || value === undefined;
}

export function validateCreateAnnouncementStep1(
  form: CreateAnnouncementFormState,
  config: CreateFormConfig,
  t: TFunction,
): CreateAnnouncementValidationResult {
  const required: Array<{ value: string | number | ''; labelKey: string }> = [];

  if (config.subcategoryOptions.length > 0) {
    required.push({ value: form.subcategory_slug, labelKey: 'announcement.vehicle_type' });
  }

  required.push(
    { value: form.car_brand_id, labelKey: 'filters.brand' },
    { value: form.car_model_id, labelKey: 'filters.model' },
    { value: form.year, labelKey: 'announcement.year' },
    { value: form.price, labelKey: 'announcement.price' },
    { value: form.currency_id, labelKey: 'announcement.currency' },
    { value: form.drive_type, labelKey: 'announcement.drive_type' },
    { value: form.transmission, labelKey: 'announcement.transmission' },
    { value: form.engine_type, labelKey: 'announcement.engine_type' },
    { value: form.horsepower, labelKey: 'car.horsepower' },
    { value: form.country_id, labelKey: 'announcement.country' },
    { value: form.place_id, labelKey: 'announcement.place' },
  );

  const missing = required.find((field) => isEmpty(field.value));
  if (missing) {
    return {
      ok: false,
      message: t('announcement.complete_required_fields'),
      fieldLabel: t(missing.labelKey),
    };
  }

  return { ok: true };
}

export function validateCreateAnnouncementStep2(
  form: CreateAnnouncementFormState,
  t: TFunction,
): CreateAnnouncementValidationResult {
  if (!form.description.trim()) {
    return {
      ok: false,
      message: t('announcement.complete_required_fields'),
      fieldLabel: t('announcement.description'),
    };
  }

  if (!form.mainImage && !form.existingMainImagePath) {
    return {
      ok: false,
      message: t('announcement.complete_required_fields'),
      fieldLabel: t('announcement.main_image_required'),
    };
  }

  return { ok: true };
}
