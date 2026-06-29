import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Matches Laravel `device_id` cookie used by announcement view tracking. */
const DEVICE_ID_KEY = 'device_id';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getWebDeviceId(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(DEVICE_ID_KEY);
}

function setWebDeviceId(deviceId: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
}

export async function getStoredDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return getWebDeviceId();
    }

    return await SecureStore.getItemAsync(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

export async function setStoredDeviceId(deviceId: string): Promise<void> {
  if (Platform.OS === 'web') {
    setWebDeviceId(deviceId);
    return;
  }

  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getStoredDeviceId();

  if (existing) {
    return existing;
  }

  const deviceId = generateUuid();
  await setStoredDeviceId(deviceId);

  return deviceId;
}
