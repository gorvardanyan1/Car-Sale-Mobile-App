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

const I18N_INIT_OPTIONS = {
  fallbackLng: 'en' as const,
  /** Locale files use flat Laravel-style keys such as `my_announcements.title`. */
  keySeparator: false as const,
  nsSeparator: false as const,
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4' as const,
  react: { useSuspense: false },
};

function syncResourceBundles(): void {
  for (const [language, bundle] of Object.entries(resources)) {
    i18n.addResourceBundle(language, 'translation', bundle.translation, true, true);
  }
}

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
  if (i18n.isInitialized) {
    syncResourceBundles();
    return Promise.resolve();
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const stored = await getStoredLanguage();
    const lng = stored ?? resolveDeviceLanguage();

    await i18n.use(initReactI18next).init({
      ...I18N_INIT_OPTIONS,
      resources,
      lng,
    });
  })();

  return initPromise;
}

export default i18n;
