import { useCallback, useEffect, useState } from 'react';

import { getLocalViewIds, trackLocalAnnouncementView } from '@/lib/announcements/localViewStorage';
import { recordAnnouncementClientView } from '@/services/announcementViewService';

const CLIENT_VIEW_DELAY_MS = 5000;

export function useLocalViews() {
  const [viewedIds, setViewedIds] = useState<ReadonlySet<number>>(() => new Set());

  const refresh = useCallback(async () => {
    const ids = await getLocalViewIds();
    setViewedIds(new Set(ids));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isViewed = useCallback((announcementId: number) => viewedIds.has(announcementId), [viewedIds]);

  const trackView = useCallback(async (announcementId: number) => {
    await trackLocalAnnouncementView(announcementId);
    setViewedIds((prev) => new Set([...prev, announcementId]));
  }, []);

  return {
    isViewed,
    trackView,
    refresh,
  };
}

export function useAnnouncementViewTracking(announcementId: number | undefined) {
  useEffect(() => {
    if (!announcementId) {
      return;
    }

    void trackLocalAnnouncementView(announcementId);

    const timer = setTimeout(() => {
      void recordAnnouncementClientView(announcementId);
    }, CLIENT_VIEW_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [announcementId]);
}
