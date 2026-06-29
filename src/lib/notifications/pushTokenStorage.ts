import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { unregisterPushToken } from '@/services/pushTokenService';

const PUSH_TOKEN_KEY = 'autohayq_push_token';

function getWebPushToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(PUSH_TOKEN_KEY);
}

function setWebPushToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PUSH_TOKEN_KEY, token);
  }
}

function clearWebPushToken(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return getWebPushToken();
    }

    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredPushToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    setWebPushToken(token);
    return;
  }

  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      clearWebPushToken();
      return;
    }

    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch {
    // Ignore missing token on logout.
  }
}

export async function unregisterStoredPushToken(): Promise<void> {
  const token = await getStoredPushToken();

  if (!token) {
    return;
  }

  try {
    await unregisterPushToken(token);
  } catch {
    // Best effort — still clear local copy.
  } finally {
    await clearStoredPushToken();
  }
}
