import type { DealerSort } from '@/types/dealer';

export const DEALER_SORT_OPTIONS: { value: DealerSort; labelKey: string }[] = [
  { value: 'rating', labelKey: 'dealer.sort_top_rated' },
  { value: 'listings', labelKey: 'dealer.sort_most_listings' },
  { value: 'sold', labelKey: 'dealer.sort_most_sold' },
];

export const DEALER_DIRECTORY_PER_PAGE = 12;
export const DEALER_LISTINGS_PER_PAGE = 15;
