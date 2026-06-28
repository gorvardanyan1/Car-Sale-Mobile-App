import type { Announcement, ArchiveFeedItem, SponsoredAd } from '@/types/announcement';

/**
 * Build a mixed list of announcements and sponsored ads.
 * Inserts one ad after every `interval` announcements (e.g. interval 4 → after 4th, 8th, …).
 */
export function interleaveAds(
  announcements: Announcement[] = [],
  ads: SponsoredAd[] = [],
  interval = 4,
): ArchiveFeedItem[] {
  const safeInterval = Math.max(1, Number(interval) || 4);
  const activeAds = Array.isArray(ads) ? ads.filter(Boolean) : [];
  const items: ArchiveFeedItem[] = [];
  let adIndex = 0;

  announcements.forEach((announcement, index) => {
    items.push({
      type: 'announcement',
      data: announcement,
      key: `announcement-${announcement.id}`,
    });

    if (activeAds.length > 0 && (index + 1) % safeInterval === 0) {
      const ad = activeAds[adIndex % activeAds.length];
      items.push({
        type: 'ad',
        data: ad,
        key: `ad-${ad.id}-${index}`,
      });
      adIndex += 1;
    }
  });

  return items;
}
