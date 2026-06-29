import type { MyAnnouncementsSort, MyAnnouncementsStatus } from '@/types/announcement';

export const MY_ANNOUNCEMENTS_STATUS_OPTIONS: ReadonlyArray<{
  value: MyAnnouncementsStatus;
  labelKey: string;
}> = [
  { value: '', labelKey: 'my_announcements.all_status' },
  { value: 'active', labelKey: 'status.active' },
  { value: 'pending', labelKey: 'status.pending' },
  { value: 'expired', labelKey: 'status.expired' },
  { value: 'sold', labelKey: 'status.sold' },
  { value: 'urgent', labelKey: 'my_announcements.urgent_only' },
];

export const MY_ANNOUNCEMENTS_SORT_OPTIONS: ReadonlyArray<{
  value: MyAnnouncementsSort;
  labelKey: string;
}> = [
  { value: 'newest', labelKey: 'my_announcements.sort.newest' },
  { value: 'oldest', labelKey: 'my_announcements.sort.oldest' },
  { value: 'price-high', labelKey: 'my_announcements.sort.price_high' },
  { value: 'price-low', labelKey: 'my_announcements.sort.price_low' },
];

export const MY_ANNOUNCEMENTS_SEARCH_DEBOUNCE_MS = 600;
