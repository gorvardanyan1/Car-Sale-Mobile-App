import { DEFAULT_ENGINE_TYPE } from '@/constants/createAnnouncement';
import type {
  AnnouncementMileage,
  CreateAnnouncementFormState,
  EditAnnouncementRecord,
  MileageUnit,
} from '@/types/announcement';

export function parseAnnouncementDescription(description: string | null | undefined): string {
  if (!description) {
    return '';
  }

  try {
    const parsed = JSON.parse(description) as { en?: string };
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.en === 'string') {
      return parsed.en;
    }
  } catch {
    // Plain text description.
  }

  return description;
}

export function parseAnnouncementTranslations(
  description: string | null | undefined,
): { am: string; ru: string } {
  if (!description) {
    return { am: '', ru: '' };
  }

  try {
    const parsed = JSON.parse(description) as { am?: string; ru?: string };
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        am: typeof parsed.am === 'string' ? parsed.am : '',
        ru: typeof parsed.ru === 'string' ? parsed.ru : '',
      };
    }
  } catch {
    // Plain text description.
  }

  return { am: '', ru: '' };
}

export function parseAnnouncementFeatures(feature: string | null | undefined): Record<string, boolean> {
  if (!feature) {
    return {};
  }

  try {
    const parsed = JSON.parse(feature) as Record<string, string>;
    const features: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (!key.startsWith('feature_')) {
        continue;
      }

      features[key.replace('feature_', '')] = value === 'on';
    }

    return features;
  } catch {
    return {};
  }
}

export function parseAdditionalImagePaths(additionalImagesPath: string | null | undefined): string[] {
  if (!additionalImagesPath) {
    return [];
  }

  try {
    const parsed = JSON.parse(additionalImagesPath);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  } catch {
    return [];
  }
}

function parseMileage(mileage: EditAnnouncementRecord['mileage']): {
  value: string;
  unit: MileageUnit;
} {
  if (!mileage) {
    return { value: '', unit: 'km' };
  }

  if (typeof mileage === 'string') {
    try {
      const parsed = JSON.parse(mileage) as AnnouncementMileage;
      if (parsed && typeof parsed === 'object') {
        return {
          value: parsed.value ? String(parsed.value) : '',
          unit: parsed.unit === 'mi' ? 'mi' : 'km',
        };
      }
    } catch {
      return { value: mileage, unit: 'km' };
    }
  }

  return {
    value: mileage.value ? String(mileage.value) : '',
    unit: mileage.unit === 'mi' ? 'mi' : 'km',
  };
}

export function mapAnnouncementToEditForm(announcement: EditAnnouncementRecord): CreateAnnouncementFormState {
  const mileage = parseMileage(announcement.mileage);
  const translations = parseAnnouncementTranslations(announcement.description);

  return {
    subcategory_slug: announcement.subcategory_slug ?? '',
    car_brand_id: announcement.car_brand_id ?? '',
    car_model_id: announcement.car_model_id ?? '',
    country_id: announcement.country_id ?? '',
    place_id: announcement.place_id ?? '',
    vin: announcement.vin ?? '',
    year: announcement.year != null ? String(announcement.year) : '',
    price: announcement.price != null ? String(announcement.price) : '',
    currency_id: announcement.currency_id ?? '',
    drive_type: announcement.drive_type ?? '',
    transmission: announcement.transmission ?? '',
    horsepower: announcement.horsepower != null ? String(announcement.horsepower) : '',
    mileage: mileage.value,
    mileage_unit: mileage.unit,
    engine_capacity:
      announcement.engine_capacity != null ? String(announcement.engine_capacity) : '',
    engine_type: announcement.engine_type ?? DEFAULT_ENGINE_TYPE,
    color_id: announcement.color_id ?? '',
    youtube_video: announcement.youtube_video ?? '',
    description: parseAnnouncementDescription(announcement.description),
    features: parseAnnouncementFeatures(announcement.feature),
    mainImage: null,
    additionalImages: [],
    existingMainImagePath: announcement.main_image_path ?? null,
    existingAdditionalImagePaths: parseAdditionalImagePaths(announcement.additional_images_path),
    translationsEnabled: Boolean(translations.am || translations.ru),
    translations,
    storePriceChange: false,
  };
}
