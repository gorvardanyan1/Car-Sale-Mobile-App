import { describe, expect, it } from 'vitest';

import { interleaveAds } from '@/lib/announcements/interleaveAds';
import type { Announcement, SponsoredAd } from '@/types/announcement';

const announcements = Array.from({ length: 8 }, (_, index) => ({ id: index + 1 })) as Announcement[];

const ads: SponsoredAd[] = [
  { id: 10, title: 'Ad A', link_url: 'https://example.com/a' },
  { id: 11, title: 'Ad B', link_url: 'https://example.com/b' },
];

describe('interleaveAds', () => {
  it('inserts an ad after every interval announcements', () => {
    const items = interleaveAds(announcements, ads, 4);

    expect(items.filter((item) => item.type === 'ad')).toHaveLength(2);
    expect(items[4]?.type).toBe('ad');
    expect(items[9]?.type).toBe('ad');
  });

  it('returns only announcements when ads are empty', () => {
    const items = interleaveAds(announcements, [], 4);

    expect(items).toHaveLength(announcements.length);
    expect(items.every((item) => item.type === 'announcement')).toBe(true);
  });

  it('rotates through multiple ads', () => {
    const items = interleaveAds(announcements, ads, 4);
    const adIds = items.filter((item) => item.type === 'ad').map((item) => item.data.id);

    expect(adIds).toEqual([10, 11]);
  });
});
