import { formatAnnouncementPrice } from '@/lib/announcements/formatAnnouncement';
import type { Announcement } from '@/types/announcement';

function priceChip(
  price: unknown,
  label: string,
  currencySymbol: string,
): string {
  return `${label}: ${formatAnnouncementPrice({
    price: price as Announcement['price'],
    currency: { symbol: currencySymbol },
  } as Announcement)}`;
}

export function buildArchiveAiFilterChips(
  filters: Record<string, unknown>,
  t: (key: string) => string,
  currencySymbol = '$',
): string[] {
  if (!filters || Object.keys(filters).length === 0) {
    return [];
  }

  const chips: string[] = [];

  if (filters.brand) {
    chips.push(`${t('archive.ai.filter_brand')}: ${String(filters.brand)}`);
  }
  if (filters.model) {
    chips.push(`${t('archive.ai.filter_model')}: ${String(filters.model)}`);
  }
  if (filters.max_price != null) {
    chips.push(priceChip(filters.max_price, t('archive.ai.filter_max_price'), currencySymbol));
  }
  if (filters.min_price != null) {
    chips.push(priceChip(filters.min_price, t('archive.ai.filter_min_price'), currencySymbol));
  }
  if (filters.year != null) {
    chips.push(`${t('archive.ai.filter_year')}: ${String(filters.year)}`);
  }
  if (filters.limit != null) {
    chips.push(`${t('archive.ai.filter_limit')}: ${String(filters.limit)}`);
  }

  return chips;
}
