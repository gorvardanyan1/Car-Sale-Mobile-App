import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { isRemotePushSupported } from '@/lib/notifications/isRemotePushSupported';
import { setStoredPushToken } from '@/lib/notifications/pushTokenStorage';
import { registerPushToken } from '@/services/pushTokenService';
import type { PushPlatform } from '@/services/pushTokenService';

export { parsePushNotificationData } from '@/lib/notifications/pushNotificationData';
export type { PushNotificationData } from '@/lib/notifications/pushNotificationData';

type NotificationsModule = typeof import('expo-notifications');
type DeviceModule = typeof import('expo-device');

let notificationsModule: NotificationsModule | null | undefined;
let deviceModule: DeviceModule | null | undefined;

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (!isRemotePushSupported()) {
    return null;
  }

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    notificationsModule = await import('expo-notifications');
    return notificationsModule;
  } catch {
    notificationsModule = null;
    return null;
  }
}

async function loadDeviceModule(): Promise<DeviceModule | null> {
  if (deviceModule !== undefined) {
    return deviceModule;
  }

  try {
    deviceModule = await import('expo-device');
    return deviceModule;
  } catch {
    deviceModule = null;
    return null;
  }
}

export async function configureForegroundNotifications(): Promise<boolean> {
  const Notifications = await loadNotificationsModule();

  if (!Notifications) {
    return false;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return true;
}

export async function requestPushPermissions(): Promise<boolean> {
  const [Notifications, Device] = await Promise.all([
    loadNotificationsModule(),
    loadDeviceModule(),
  ]);

  if (!Notifications || !Device?.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const [Notifications, Device] = await Promise.all([
    loadNotificationsModule(),
    loadDeviceModule(),
  ]);

  if (!Notifications || !Device?.isDevice) {
    return null;
  }

  const granted = await requestPushPermissions();

  if (!granted) {
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    return token.data;
  } catch {
    return null;
  }
}

export function resolvePushPlatform(): PushPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export async function syncPushTokenWithBackend(deviceName?: string): Promise<string | null> {
  if (!isRemotePushSupported()) {
    return null;
  }

  const token = await getExpoPushToken();

  if (!token) {
    return null;
  }

  await registerPushToken(token, resolvePushPlatform(), deviceName);
  await setStoredPushToken(token);

  return token;
}

export type NotificationResponseSubscription = {
  remove: () => void;
};

export async function addNotificationResponseListener(
  onResponse: (data: Record<string, unknown>) => void,
): Promise<NotificationResponseSubscription | null> {
  const Notifications = await loadNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse(response.notification.request.content.data as Record<string, unknown>);
  });

  return subscription;
}
