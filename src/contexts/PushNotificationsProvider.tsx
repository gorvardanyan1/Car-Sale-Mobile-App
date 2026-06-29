import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { isRemotePushSupported } from '@/lib/notifications/isRemotePushSupported';
import { parsePushNotificationData } from '@/lib/notifications/pushNotificationData';
import {
  addNotificationResponseListener,
  configureForegroundNotifications,
  syncPushTokenWithBackend,
  type NotificationResponseSubscription,
} from '@/lib/notifications/pushNotifications';
import { unregisterPushToken } from '@/services/pushTokenService';
import {
  unregisterStoredPushToken,
} from '@/lib/notifications/pushTokenStorage';

function navigateFromPushData(
  router: ReturnType<typeof useRouter>,
  data: ReturnType<typeof parsePushNotificationData>,
): void {
  if (data.type === 'wanted_search_match') {
    if (data.announcement_id != null) {
      router.push({
        pathname: '/announcement/[id]',
        params: { id: String(data.announcement_id) },
      });
      return;
    }

    router.push('/settings/wanted-searches');
  }
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const activeTokenRef = useRef<string | null>(null);
  const responseListener = useRef<NotificationResponseSubscription | null>(null);

  useEffect(() => {
    if (!isRemotePushSupported()) {
      return;
    }

    void configureForegroundNotifications();
  }, []);

  useEffect(() => {
    if (!isRemotePushSupported()) {
      return;
    }

    if (!isAuthenticated || !user) {
      const token = activeTokenRef.current;

      if (token) {
        void unregisterPushToken(token).catch(() => undefined);
        activeTokenRef.current = null;
      }

      void unregisterStoredPushToken().catch(() => undefined);

      return;
    }

    let cancelled = false;

    void (async () => {
      const token = await syncPushTokenWithBackend();

      if (!cancelled && token) {
        activeTokenRef.current = token;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isRemotePushSupported()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const subscription = await addNotificationResponseListener((rawData) => {
        const data = parsePushNotificationData(rawData);
        navigateFromPushData(router, data);
      });

      if (cancelled) {
        subscription?.remove();
        return;
      }

      responseListener.current = subscription;
    })();

    return () => {
      cancelled = true;
      responseListener.current?.remove();
      responseListener.current = null;
    };
  }, [router]);

  return children;
}
