import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { AuthGate } from '@/components/auth/AuthGate';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { WantedSearchUnreadProvider } from '@/contexts/WantedSearchUnreadContext';
import { PushNotificationsProvider } from '@/contexts/PushNotificationsProvider';
import { colors } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <I18nProvider>
        <AuthProvider>
          <FavoritesProvider>
            <WantedSearchUnreadProvider>
              <PushNotificationsProvider>
                <AuthGate>
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="announcement/[id]" />
                  <Stack.Screen name="dealers" />
                  <Stack.Screen name="settings" />
                  </Stack>
                  <StatusBar style="light" />
                </AuthGate>
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
