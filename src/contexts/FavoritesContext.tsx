import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { isAnnouncementLiked } from '@/lib/announcements/isAnnouncementLiked';
import { getErrorMessage } from '@/lib/api/errors';
import {
  favoriteAnnouncement,
  fetchAllFavoriteIds,
  unfavoriteAnnouncement,
} from '@/services/announcementService';
import type { Announcement } from '@/types/announcement';

type FavoritesContextValue = {
  favoriteIds: ReadonlySet<number>;
  favoriteCount: number;
  favoritesHydrated: boolean;
  isFavorite: (announcement: Announcement) => boolean;
  toggleFavorite: (announcement: Announcement) => Promise<boolean>;
  refreshFavoriteIds: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<number>>(() => new Set());
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);

  const refreshFavoriteIds = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      setFavoritesHydrated(false);
      return;
    }

    try {
      const ids = await fetchAllFavoriteIds();
      setFavoriteIds(new Set(ids));
      setFavoritesHydrated(true);
    } catch (error) {
      if (__DEV__) {
        console.warn('[favorites] refresh ids failed:', getErrorMessage(error));
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!isAuthenticated) {
        setFavoriteIds(new Set());
        setFavoritesHydrated(false);
        return;
      }

      try {
        const ids = await fetchAllFavoriteIds();
        if (!cancelled) {
          setFavoriteIds(new Set(ids));
          setFavoritesHydrated(true);
        }
      } catch {
        if (!cancelled) {
          setFavoriteIds(new Set());
          setFavoritesHydrated(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (announcement: Announcement) =>
      isAnnouncementLiked(announcement, favoriteIds, favoritesHydrated),
    [favoriteIds, favoritesHydrated],
  );

  const toggleFavorite = useCallback(
    async (announcement: Announcement): Promise<boolean> => {
      if (!isAuthenticated) {
        return false;
      }

      const currentlyFavorite = isAnnouncementLiked(announcement, favoriteIds, favoritesHydrated);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (currentlyFavorite) {
          next.delete(announcement.id);
        } else {
          next.add(announcement.id);
        }
        return next;
      });
      setFavoritesHydrated(true);

      try {
        if (currentlyFavorite) {
          await unfavoriteAnnouncement(announcement.id);
        } else {
          await favoriteAnnouncement(announcement.id);
        }

        return true;
      } catch (error) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (currentlyFavorite) {
            next.add(announcement.id);
          } else {
            next.delete(announcement.id);
          }
          return next;
        });

        if (__DEV__) {
          console.warn('[favorites] toggle failed:', getErrorMessage(error));
        }

        return false;
      }
    },
    [favoriteIds, favoritesHydrated, isAuthenticated],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      favoriteCount: favoriteIds.size,
      favoritesHydrated,
      isFavorite,
      toggleFavorite,
      refreshFavoriteIds,
    }),
    [favoriteIds, favoritesHydrated, isFavorite, refreshFavoriteIds, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }

  return context;
}
