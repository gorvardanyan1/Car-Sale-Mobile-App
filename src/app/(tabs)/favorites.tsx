import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ListingCard } from '@/components/announcements/ListingCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import type { Announcement } from '@/types/announcement';
import { colors, spacing, typography } from '@/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite, refreshFavoriteIds } = useFavorites();
  const {
    announcements,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    removeAnnouncement,
  } = useFavoritesList();

  const handleRefresh = useCallback(() => {
    void refreshFavoriteIds();
    refresh();
  }, [refresh, refreshFavoriteIds]);

  function openDetail(announcement: Announcement) {
    router.push({
      pathname: '/announcement/[id]',
      params: { id: String(announcement.id) },
    });
  }

  async function handleToggleFavorite(announcement: Announcement) {
    const wasFavorite = isFavorite(announcement);
    const succeeded = await toggleFavorite(announcement);

    if (!succeeded) {
      Alert.alert(t('mobile.errors.favorite_toggle_failed'));
      return;
    }

    if (wasFavorite) {
      removeAnnouncement(announcement.id);
    }
  }

  const favoriteCount = meta.total || announcements.length;

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.headerSection}>
        <ScreenHeader
          title={t('mobile.favorites.title')}
          subtitle={t('mobile.favorites.saved_count', { count: favoriteCount })}
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retryText}>{t('mobile.list.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && announcements.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>{t('mobile.favorites.loading')}</Text>
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Heart color={colors.textDisabled} size={56} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{t('mobile.favorites.empty_title')}</Text>
          <Text style={styles.emptySubtitle}>{t('mobile.favorites.empty_subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ListingCard
              announcement={item}
              isFavorite={isFavorite(item)}
              onPress={openDetail}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : hasMore ? (
              <View style={styles.loadMoreWrap}>
                <GradientButton label={t('common.load_more')} compact onPress={loadMore} />
              </View>
            ) : (
              <View style={styles.listFooterSpacer} />
            )
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.errorMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  retryText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  stateText: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  listSeparator: {
    height: spacing.md,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadMoreWrap: {
    paddingVertical: spacing.md,
  },
  listFooterSpacer: {
    height: spacing.md,
  },
});
