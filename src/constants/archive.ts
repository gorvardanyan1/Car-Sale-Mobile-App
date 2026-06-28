import type { ArchiveSort } from '@/types/announcement';

export const ARCHIVE_SORT_OPTIONS: { value: ArchiveSort; labelKey: string }[] = [
  { value: 'default', labelKey: 'archive.sort.default' },
  { value: 'nearest', labelKey: 'archive.sort.nearest' },
  { value: 'newest', labelKey: 'archive.sort.newest' },
  { value: 'price-low', labelKey: 'archive.sort.price_low' },
  { value: 'price-high', labelKey: 'archive.sort.price_high' },
  { value: 'year-newest', labelKey: 'archive.sort.year_newest' },
  { value: 'mileage-low', labelKey: 'archive.sort.mileage_low' },
];

export const DRIVE_TYPE_OPTIONS = [
  { value: '', labelKey: 'filters.all_drive_types' },
  { value: 'awd', labelKey: 'filters.drive_awd' },
  { value: 'fwd', labelKey: 'filters.drive_fwd' },
  { value: 'rwd', labelKey: 'filters.drive_rwd' },
] as const;

export const TRANSMISSION_OPTIONS = [
  { value: '', labelKey: 'filters.all_transmissions' },
  { value: 'automatic', labelKey: 'filters.transmission_automatic' },
  { value: 'manual', labelKey: 'filters.transmission_manual' },
  { value: 'robotic', labelKey: 'filters.transmission_robotic' },
] as const;

export const MILEAGE_UNIT_OPTIONS = [
  { value: 'km', labelKey: 'mobile.filters.unit_km' },
  { value: 'mi', labelKey: 'mobile.filters.unit_mi' },
] as const;
