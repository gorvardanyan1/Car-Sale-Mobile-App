import { Href, useRouter, useSegments } from 'expo-router';
import { ReactNode, useEffect } from 'react';

import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = (segments as string[]).includes('(auth)');

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login' as Href);
      return;
    }

    if (user && inAuthGroup) {
      router.replace('/(tabs)' as Href);
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return children;
}
