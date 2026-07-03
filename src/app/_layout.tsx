import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { AuthGate } from '@/components/auth/AuthGate';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { WantedSearchUnreadProvider } from '@/contexts/WantedSearchUnreadContext';
import { PushNotificationsProvider } from '@/contexts/PushNotificationsProvider';
import { ChatSocketProvider } from '@/contexts/ChatSocketContext';
import { colors } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

/** Inner wrapper so ChatSocketProvider can read the auth user. */
function AppWithChat({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <ChatSocketProvider userId={user?.id ?? null}>
      {children}
    </ChatSocketProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <I18nProvider>
        <AuthProvider>
          <FavoritesProvider>
            <WantedSearchUnreadProvider>
              <PushNotificationsProvider>
                <AppWithChat>
                  <AuthGate>
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="announcement/[id]" />
                      <Stack.Screen name="dealers" />
                      <Stack.Screen name="settings" />
                      <Stack.Screen name="chat" />
                    </Stack>
                    <StatusBar style="light" />
                  </AuthGate>
                </AppWithChat>
              </PushNotificationsProvider>
            </WantedSearchUnreadProvider>
          </FavoritesProvider>
        </AuthProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
