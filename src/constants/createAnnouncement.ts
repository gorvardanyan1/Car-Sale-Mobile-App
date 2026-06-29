import type { MileageUnit } from '@/types/announcement';

export const DRIVE_TYPE_OPTIONS = [
  { value: 'fwd', labelKey: 'filters.drive_fwd' },
  { value: 'rwd', labelKey: 'filters.drive_rwd' },
  { value: 'awd', labelKey: 'filters.drive_awd' },
] as const;

export const TRANSMISSION_OPTIONS = [
  { value: 'automatic', labelKey: 'filters.transmission_automatic' },
  { value: 'manual', labelKey: 'filters.transmission_manual' },
  { value: 'robotic', labelKey: 'filters.transmission_robotic' },
] as const;

export const MILEAGE_UNIT_OPTIONS: ReadonlyArray<{ value: MileageUnit; labelKey: string }> = [
  { value: 'km', labelKey: 'mobile.filters.unit_km' },
  { value: 'mi', labelKey: 'mobile.filters.unit_mi' },
];

export const DEFAULT_ENGINE_TYPE = 'petrol';

export const MAX_ADDITIONAL_IMAGES = 10;
