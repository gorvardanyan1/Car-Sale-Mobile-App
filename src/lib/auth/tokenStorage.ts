import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'autohayq_auth_token';

function getWebToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function setWebToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearWebToken(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return getWebToken();
    }

    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    setWebToken(token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      clearWebToken();
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Ignore missing token on logout.
  }
}
