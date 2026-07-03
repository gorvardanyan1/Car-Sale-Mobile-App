import { resolveStorageImageUrl } from '@/lib/announcements/formatAnnouncement';
import type { DealerCard } from '@/types/dealer';

export function getDealerImageUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  return resolveStorageImageUrl(path);
}

export function getDealerLogoUrl(logo: string | null | undefined): string | null {
  return getDealerImageUrl(logo);
}

export function getDealerCoverUrl(cover: string | null | undefined): string | null {
  return getDealerImageUrl(cover);
}

export function isTopPerformerDealer(dealer: Pick<DealerCard, 'sold_listings'>): boolean {
  return (dealer.sold_listings ?? 0) >= 5;
}

export function getDealerInitial(name: string | null | undefined): string {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?';
}

export function formatDealerLocationLine(
  location: string | null | undefined,
  specialty: string | null | undefined,
): string {
  return [location, specialty].filter(Boolean).join(' · ');
}
