import { describe, expect, it } from 'vitest';

import { isAnnouncementLiked } from '@/lib/announcements/isAnnouncementLiked';
import type { Announcement } from '@/types/announcement';

const announcement = { id: 42 } as Announcement;

describe('isAnnouncementLiked', () => {
  it('uses favoriteIds when favorites are hydrated', () => {
    expect(isAnnouncementLiked(announcement, new Set([42]), true)).toBe(true);
    expect(isAnnouncementLiked(announcement, new Set(), true)).toBe(false);
  });

  it('falls back to announcement.is_liked before hydration', () => {
    expect(isAnnouncementLiked({ ...announcement, is_liked: 1 }, new Set(), false)).toBe(true);
    expect(isAnnouncementLiked({ ...announcement, is_liked: 0 }, new Set([42]), false)).toBe(false);
  });
});
