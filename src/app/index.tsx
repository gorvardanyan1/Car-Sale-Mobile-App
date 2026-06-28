import { Href, Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Redirect href={'/(tabs)' as Href} />;
  }

  return <Redirect href={'/(auth)/login' as Href} />;
}
