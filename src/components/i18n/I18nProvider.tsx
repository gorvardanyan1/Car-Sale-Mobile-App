import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import { LoadingScreen } from '@/components/layout/LoadingScreen';
import i18n, { initI18n } from '@/i18n';

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      return;
    }

    let cancelled = false;

    initI18n()
      .catch(() => {
        // Fallback to default init state; UI still renders in English.
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <LoadingScreen message="Loading…" />;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
