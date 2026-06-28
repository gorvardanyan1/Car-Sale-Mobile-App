import type { Announcement } from '@/types/announcement';

export function isAnnouncementLiked(
  announcement: Announcement,
  favoriteIds: ReadonlySet<number>,
  favoritesHydrated: boolean,
): boolean {
  if (favoritesHydrated) {
    return favoriteIds.has(announcement.id);
  }

  return Boolean(announcement.is_liked);
}
