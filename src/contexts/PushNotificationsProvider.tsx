import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { isRemotePushSupported } from '@/lib/notifications/isRemotePushSupported';
import { parsePushNotificationData } from '@/lib/notifications/pushNotificationData';
import { callActionFromResponse, publishCallPushEvent } from '@/lib/calls/callPushEvents';
import {
  CALL_ACTION_ACCEPT,
  CALL_ACTION_DECLINE,
  addNotificationResponseListener,
  configureForegroundNotifications,
  getLaunchNotificationData,
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
  actionIdentifier: string | null = null,
): void {
  // Calls are handed to CallProvider, which owns the socket: it checks the
  // call is still ringing before showing anything, and declines without
  // opening a screen.
  if (data.type === 'chat_call' && data.call_id) {
    publishCallPushEvent({
      callId: data.call_id,
      conversationId: data.conversation_id ?? null,
      callType: data.call_type ?? 'voice',
      action: callActionFromResponse(actionIdentifier, CALL_ACTION_ACCEPT, CALL_ACTION_DECLINE),
    });
    return;
  }

  if (data.type === 'wanted_search_match') {
    if (data.announcement_id != null) {
      router.push({
        pathname: '/announcement/[id]',
        params: { id: String(data.announcement_id) },
      });
      return;
    }

    router.push('/settings/wanted-searches');
    return;
  }

  if (data.type === 'chat_message' && data.conversation_id) {
    router.push({
      pathname: '/chat/[id]',
      params: { id: data.conversation_id },
    });
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

    // Expo can rotate the FCM registration behind a token, and a token the
    // backend never learned about is indistinguishable from having no token at
    // all — the user just stops receiving chat pushes. Re-syncing whenever the
    // app returns to the foreground repairs that without any user action.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }

      void (async () => {
        const token = await syncPushTokenWithBackend();

        if (!cancelled && token) {
          activeTokenRef.current = token;
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isRemotePushSupported()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      // A tap that cold-starts the app happens before this listener exists
      // to catch it — check for the response that launched the app first.
      const launch = await getLaunchNotificationData();

      if (!cancelled && launch) {
        navigateFromPushData(router, parsePushNotificationData(launch.data), launch.actionIdentifier);
      }

      const subscription = await addNotificationResponseListener((rawData, actionIdentifier) => {
        const data = parsePushNotificationData(rawData);
        navigateFromPushData(router, data, actionIdentifier);
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
