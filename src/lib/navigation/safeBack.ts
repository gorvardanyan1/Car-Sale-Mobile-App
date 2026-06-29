import type { Href } from 'expo-router';

const DEFAULT_BACK_FALLBACK: Href = '/(tabs)';

type SafeBackRouter = {
  back: () => void;
  replace: (href: Href) => void;
  canGoBack: () => boolean;
};

export function createSafeBackHandler(
  router: SafeBackRouter,
  fallback: Href = DEFAULT_BACK_FALLBACK,
) {
  return () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallback);
  };
}
