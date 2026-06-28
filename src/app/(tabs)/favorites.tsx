import { Heart } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { colors, spacing, typography } from '@/theme';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const favoriteCount = 0;

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader
        title={t('mobile.favorites.title')}
        subtitle={t('mobile.favorites.saved_count', { count: favoriteCount })}
      />

      <View style={styles.emptyState}>
        <Heart color={colors.textDisabled} size={56} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>{t('mobile.favorites.empty_title')}</Text>
        <Text style={styles.emptySubtitle}>{t('mobile.favorites.empty_subtitle')}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
