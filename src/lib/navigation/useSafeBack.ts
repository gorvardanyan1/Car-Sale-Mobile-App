import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { createSafeBackHandler } from '@/lib/navigation/safeBack';

export function useSafeBack(fallback?: Href) {
  const router = useRouter();

  return useCallback(createSafeBackHandler(router, fallback), [fallback, router]);
}
