import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AISupportWidget } from '@/components/ai/AISupportWidget';
import { TabBar } from '@/components/navigation/TabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('mobile.tabs.list') }} />
        <Tabs.Screen name="messages" options={{ title: t('mobile.tabs.messages') }} />
        <Tabs.Screen name="create" options={{ title: t('mobile.tabs.create') }} />
        <Tabs.Screen name="favorites" options={{ title: t('mobile.tabs.favorites') }} />
        <Tabs.Screen name="settings" options={{ title: t('mobile.tabs.settings') }} />
      </Tabs>
      <AISupportWidget />
    </>
  );
}
