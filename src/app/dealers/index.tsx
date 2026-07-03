import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownUp, Building2, LayoutGrid, List, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DealerDirectoryCard } from '@/components/dealers/DealerDirectoryCard';
import { DealerListItem } from '@/components/dealers/DealerListItem';
import { DealerSortModal } from '@/components/dealers/DealerSortModal';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DEALER_SORT_OPTIONS } from '@/constants/dealers';
import { useDealerDirectory } from '@/hooks/useDealerDirectory';
import type { DealerCard } from '@/types/dealer';
import { colors, gradients, radii, spacing, typography } from '@/theme';

export default function DealersScreen() {
  const { t } = useTranslation();
  const directory = useDealerDirectory();
  const [sortOpen, setSortOpen] = useState(false);

  const sortLabel = useMemo(
    () => t(DEALER_SORT_OPTIONS.find((option) => option.value === directory.sort)?.labelKey ?? 'dealer.sort_top_rated'),
    [directory.sort, t],
  );

  const renderItem = ({ item }: { item: DealerCard }) =>
    directory.viewMode === 'grid' ? (
      <View style={styles.gridItem}>
        <DealerDirectoryCard dealer={item} />
      </View>
    ) : (
      <DealerListItem dealer={item} />
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={gradients.primary} style={styles.hero}>
        <ScreenHeader
          title={t('dealer.directory_title')}
          subtitle={t('dealer.directory_subtitle')}
          showBack
          backFallback="/(tabs)"
        />
        <View style={styles.heroMeta}>
          <Building2 color={colors.white} size={18} />
          <Text style={styles.heroMetaText}>
            {t('dealer.verified_count', { count: directory.verifiedCount })}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Search color={colors.textSubtle} size={16} />
          <TextInput
            value={directory.search}
            onChangeText={directory.setSearch}
            placeholder={t('dealer.search_placeholder')}
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {directory.search.length > 0 ? (
            <Pressable onPress={() => directory.setSearch('')} hitSlop={8}>
              <X color={colors.textSubtle} size={16} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.toolbarRow}>
          <Pressable style={styles.sortButton} onPress={() => setSortOpen(true)}>
            <ArrowDownUp color={colors.textMuted} size={14} />
            <Text style={styles.sortText} numberOfLines={1}>
              {sortLabel}
            </Text>
          </Pressable>

          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => directory.setViewMode('grid')}
              style={[styles.viewButton, directory.viewMode === 'grid' && styles.viewButtonActive]}
              accessibilityLabel={t('dealer.view_grid')}
            >
              <LayoutGrid
                color={directory.viewMode === 'grid' ? colors.primaryLight : colors.textMuted}
                size={16}
              />
            </Pressable>
            <Pressable
              onPress={() => directory.setViewMode('list')}
              style={[styles.viewButton, directory.viewMode === 'list' && styles.viewButtonActive]}
              accessibilityLabel={t('dealer.view_list')}
            >
              <List
                color={directory.viewMode === 'list' ? colors.primaryLight : colors.textMuted}
                size={16}
              />
            </Pressable>
          </View>
        </View>

        <Text style={styles.countText}>
          {t('dealer.dealers_count', { count: directory.meta.total })}
        </Text>
      </View>

      {directory.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{directory.error}</Text>
          <Pressable onPress={directory.refresh}>
            <Text style={styles.retryText}>{t('mobile.list.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {directory.loading && directory.dealers.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={directory.dealers}
          key={directory.viewMode}
          numColumns={directory.viewMode === 'grid' ? 1 : 1}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={directory.refreshing}
              onRefresh={directory.refresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => directory.loadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            !directory.loading ? (
              <View style={styles.centerState}>
                <Text style={styles.emptyTitle}>{t('dealer.no_dealers_found')}</Text>
                <Text style={styles.stateText}>{t('dealer.try_adjusting_search')}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            directory.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      <DealerSortModal
        visible={sortOpen}
        activeSort={directory.sort}
        onClose={() => setSortOpen(false)}
        onSelect={directory.setSort}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  heroMetaText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  toolbar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 10,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  sortText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
  },
  viewButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  countText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  gridItem: {
    width: '100%',
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.errorMuted,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: '#FCA5A5',
  },
  retryText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  stateText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
});
