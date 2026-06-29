import { Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { shouldShowExpoGoPushBanner } from '@/lib/notifications/isRemotePushSupported';
import { colors, radii, spacing, typography } from '@/theme';

export function ExpoGoPushBanner() {
  const { t } = useTranslation();

  if (!shouldShowExpoGoPushBanner()) {
    return null;
  }

  return (
    <View style={styles.banner} testID="expo-go-push-banner">
      <Info color="#60A5FA" size={18} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('mobile.settings.expo_go_push_title')}</Text>
        <Text style={styles.message}>{t('mobile.settings.expo_go_push_message')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.sectionTitle,
    color: '#93C5FD',
    fontSize: 14,
  },
  message: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
