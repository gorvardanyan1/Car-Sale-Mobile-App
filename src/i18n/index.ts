import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getStoredLanguage, isSupportedLanguage } from '@/lib/i18n/languageStorage';

import { am } from './locales/am';
import { en } from './locales/en';
import { ru } from './locales/ru';

export type SupportedLanguage = 'en' | 'am' | 'ru';

const resources = {
  en: { translation: en },
  am: { translation: am },
  ru: { translation: ru },
} as const;

function resolveDeviceLanguage(): SupportedLanguage {
  const deviceCode = Localization.getLocales()[0]?.languageCode ?? 'en';
  return isSupportedLanguage(deviceCode) ? deviceCode : 'en';
}

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const stored = await getStoredLanguage();
    const lng = stored ?? resolveDeviceLanguage();

    if (!i18n.isInitialized) {
      await i18n.use(initReactI18next).init({
        resources,
        lng,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        compatibilityJSON: 'v4',
      });
      return;
    }

    if (i18n.language !== lng) {
      await i18n.changeLanguage(lng);
    }
  })();

  return initPromise;
}

export default i18n;
