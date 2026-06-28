import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { SupportedLanguage } from '@/i18n';

const LANGUAGE_KEY = 'language';

const SUPPORTED: SupportedLanguage[] = ['en', 'am', 'ru'];

function getWebLanguage(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(LANGUAGE_KEY);
}

function setWebLanguage(language: SupportedLanguage): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, language);
  }
}

function clearWebLanguage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LANGUAGE_KEY);
  }
}

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value !== null && value !== undefined && SUPPORTED.includes(value as SupportedLanguage);
}

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const stored =
      Platform.OS === 'web' ? getWebLanguage() : await SecureStore.getItemAsync(LANGUAGE_KEY);

    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export async function setStoredLanguage(language: SupportedLanguage): Promise<void> {
  if (Platform.OS === 'web') {
    setWebLanguage(language);
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}

export async function clearStoredLanguage(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      clearWebLanguage();
      return;
    }

    await SecureStore.deleteItemAsync(LANGUAGE_KEY);
  } catch {
    // Ignore missing value.
  }
}
