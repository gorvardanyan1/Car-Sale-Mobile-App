import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowDownUp, Bell, Building2, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ArchiveFilterModal } from '@/components/announcements/ArchiveFilterModal';
import {
  ArchiveAiSearchButton,
  ArchiveAiSearchModal,
} from '@/components/announcements/ArchiveAiSearchModal';
import { ArchiveSubcategoryChips } from '@/components/announcements/ArchiveSubcategoryChips';
import { ListingCard } from '@/components/announcements/ListingCard';
import { SponsoredAdCard } from '@/components/announcements/SponsoredAdCard';
import { SortPickerModal } from '@/components/announcements/SortPickerModal';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { ARCHIVE_SORT_OPTIONS } from '@/constants/archive';
import { useFavorites } from '@/contexts/FavoritesContext';
import { countActiveFilters } from '@/lib/announcements/archiveFilterState';
import { getDeviceLocation } from '@/lib/location/getDeviceLocation';
import { useArchiveList } from '@/hooks/useArchiveList';
import { useLocalViews } from '@/hooks/useLocalViews';
import type { Announcement } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

export default function ListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isViewed, refresh: refreshLocalViews } = useLocalViews();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  const {
    feedItems,
    announcements,
    config,
    filters,
    sort,
    meta,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    setSearch,
    setSubcategorySlug,
    applyFilters,
    resetFilters,
    loadMore,
    refresh,
    setSort,
    requestNearestSort,
  } = useArchiveList();

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const currencySymbol = useMemo(() => {
    const currency = config?.currencies.find(
      (item) => String(item.id) === String(filters.currency_id),
    );
    return currency?.symbol ?? '$';
  }, [config?.currencies, filters.currency_id]);
  const sortLabel =
    t(ARCHIVE_SORT_OPTIONS.find((option) => option.value === sort)?.labelKey ?? 'archive.sort.default');

  useFocusEffect(
    useCallback(() => {
      void refreshLocalViews();
    }, [refreshLocalViews]),
  );

  function openDetail(announcement: Announcement) {
    router.push({
      pathname: '/announcement/[id]',
      params: { id: String(announcement.id) },
    });
  }

  const handleToggleFavorite = useCallback(
    async (announcement: Announcement) => {
      const succeeded = await toggleFavorite(announcement);
      if (!succeeded) {
        Alert.alert(t('mobile.errors.favorite_toggle_failed'));
      }
    },
    [toggleFavorite, t],
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.headerSection}>
        <ScreenHeader
          greeting={t('mobile.greeting.afternoon')}
          title={t('mobile.list.title')}
          rightSlot={
            <Pressable style={styles.bellButton}>
              <Bell color={colors.textSecondary} size={20} />
              <View style={styles.bellDot} />
            </Pressable>
          }
        />

        <Pressable
          style={styles.dealersLink}
          onPress={() => router.push('/dealers')}
          testID="browse-dealers-link"
        >
          <Building2 color={colors.primaryLight} size={18} />
          <Text style={styles.dealersLinkText}>{t('mobile.list.browse_dealers')}</Text>
        </Pressable>

        <View style={styles.searchRow}>
          <ArchiveAiSearchButton onPress={() => setAiSearchOpen(true)} />
          <View style={styles.searchInputWrap}>
            <Search color={colors.textSubtle} size={16} />
            <TextInput
              value={filters.search}
              onChangeText={setSearch}
              placeholder={t('mobile.list.search_placeholder')}
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => applyFilters()}
            />
            {filters.search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X color={colors.textSubtle} size={16} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
            <SlidersHorizontal color={colors.white} size={16} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {config ? (
          <ArchiveSubcategoryChips
            subcategories={config.subcategoryFilters}
            activeSlug={filters.subcategory_slug}
            onChange={setSubcategorySlug}
          />
        ) : null}

        <View style={styles.resultsRow}>
          <Text style={styles.resultsCount}>
            {t('archive.showing_label')}{' '}
            <Text style={styles.resultsCountBold}>{meta.total}</Text> {t('archive.results_label')}
          </Text>
          <Pressable style={styles.sortButton} onPress={() => setSortOpen(true)}>
            <ArrowDownUp color={colors.textSubtle} size={14} />
            <Text style={styles.sortText}>{sortLabel}</Text>
          </Pressable>
        </View>
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
          <Text style={styles.stateText}>{t('mobile.list.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) =>
            item.type === 'ad' ? (
              <SponsoredAdCard ad={item.data} />
            ) : (
              <ListingCard
                announcement={item.data}
                viewed={isViewed(item.data.id)}
                isFavorite={isFavorite(item.data)}
                onPress={openDetail}
                onToggleFavorite={handleToggleFavorite}
              />
            )
          }
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centerState}>
                <Text style={styles.stateTitle}>{t('mobile.list.no_listings_title')}</Text>
                <Text style={styles.stateText}>{t('mobile.list.no_listings_subtitle')}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : hasMore && announcements.length > 0 ? (
              <View style={styles.loadMoreWrap}>
                <GradientButton label={t('common.load_more')} compact onPress={loadMore} />
              </View>
            ) : (
              <View style={styles.listFooterSpacer} />
            )
          }
        />
      )}

      {config ? (
        <ArchiveFilterModal
          visible={filtersOpen}
          config={config}
          filters={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      ) : null}

      <SortPickerModal
        visible={sortOpen}
        value={sort}
        onClose={() => setSortOpen(false)}
        onChange={setSort}
        onRequestNearest={() => requestNearestSort(getDeviceLocation)}
      />

      <ArchiveAiSearchModal
        visible={aiSearchOpen}
        countryId={filters.country_id}
        currencyId={filters.currency_id}
        currencySymbol={currencySymbol}
        onClose={() => setAiSearchOpen(false)}
        onOpenListing={openDetail}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  dealersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  dealersLinkText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  resultsCountBold: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  listSeparator: {
    height: spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  stateTitle: {
    ...typography.sectionTitle,
    color: colors.textMuted,
  },
  stateText: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
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
