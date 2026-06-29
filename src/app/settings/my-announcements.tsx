import { useLocalSearchParams, useRouter } from 'expo-router';
import { BarChart3, Car, Filter, Plus, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MyAnnouncementCard } from '@/components/my-announcements/MyAnnouncementCard';
import { MyAnnouncementsStatsGrid } from '@/components/my-announcements/MyAnnouncementsStatsGrid';
import { OptionPickerModal } from '@/components/my-announcements/OptionPickerModal';
import { GradientButton } from '@/components/ui/GradientButton';
import {
  MY_ANNOUNCEMENTS_SORT_OPTIONS,
  MY_ANNOUNCEMENTS_STATUS_OPTIONS,
} from '@/constants/myAnnouncements';
import { useMyAnnouncements } from '@/hooks/useMyAnnouncements';
import { getErrorMessage } from '@/lib/api/errors';
import {
  deleteAnnouncement,
  markAnnouncementAsSold,
} from '@/services/announcementService';
import type { Announcement, MyAnnouncementsSort, MyAnnouncementsStatus } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

export default function MyAnnouncementsScreen() {
  const router = useRouter();
  const { paymentDone } = useLocalSearchParams<{ paymentDone?: string }>();
  const { t } = useTranslation();
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cardsResetKey, setCardsResetKey] = useState(0);

  const {
    announcements,
    stats,
    urgentPriceCents,
    urgentFeatureAccess,
    status,
    sort,
    search,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    setSearch,
    applyStatus,
    applySort,
    refresh,
    loadMore,
    removeAnnouncement,
    updateAnnouncement,
  } = useMyAnnouncements();

  useEffect(() => {
    if (paymentDone !== '1') {
      return;
    }

    setCardsResetKey((value) => value + 1);
    refresh();
    router.setParams({ paymentDone: undefined });
  }, [paymentDone, refresh, router]);

  function openDetail(announcement: Announcement) {
    router.push({
      pathname: '/announcement/[id]',
      params: { id: String(announcement.id) },
    });
  }

  function openEdit(announcement: Announcement) {
    router.push({
      pathname: '/settings/edit-announcement/[id]',
      params: { id: String(announcement.id) },
    });
  }

  async function handleDelete(announcement: Announcement) {
    setActionLoading(true);
    try {
      await deleteAnnouncement(announcement.id);
      removeAnnouncement(announcement.id);
    } catch (err) {
      Alert.alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkSold(announcement: Announcement) {
    setActionLoading(true);
    try {
      await markAnnouncementAsSold(announcement.id);
      updateAnnouncement(announcement.id, { status: 'sold' });
    } catch (err) {
      Alert.alert(t('my_announcements.mark_as_sold_failed'));
    } finally {
      setActionLoading(false);
    }
  }

  const selectedStatusLabel =
    t(
      MY_ANNOUNCEMENTS_STATUS_OPTIONS.find((option) => option.value === status)?.labelKey ??
        'my_announcements.all_status',
    );
  const selectedSortLabel =
    t(
      MY_ANNOUNCEMENTS_SORT_OPTIONS.find((option) => option.value === sort)?.labelKey ??
        'my_announcements.sort.newest',
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={t('my_announcements.title')}
          subtitle={t('my_announcements.subtitle')}
          showBack
          backFallback="/(tabs)/settings"
          rightSlot={
            <Pressable
              onPress={() => router.push('/(tabs)/create')}
              style={styles.addButton}
              accessibilityRole="button"
            >
              <Plus color={colors.white} size={18} />
            </Pressable>
          }
        />
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => `${item.id}-${cardsResetKey}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <MyAnnouncementsStatsGrid stats={stats} />

            <View style={styles.filtersCard}>
              <View style={styles.searchWrap}>
                <Search color={colors.textSubtle} size={16} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('my_announcements.search_placeholder')}
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.searchInput}
                />
              </View>

              <View style={styles.filterRow}>
                <Pressable style={styles.filterButton} onPress={() => setStatusPickerOpen(true)}>
                  <Filter color={colors.textSubtle} size={16} />
                  <Text style={styles.filterButtonText} numberOfLines={1}>
                    {selectedStatusLabel}
                  </Text>
                </Pressable>

                <Pressable style={styles.filterButton} onPress={() => setSortPickerOpen(true)}>
                  <BarChart3 color={colors.textSubtle} size={16} />
                  <Text style={styles.filterButtonText} numberOfLines={1}>
                    {selectedSortLabel}
                  </Text>
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
          </View>
        }
        renderItem={({ item }) => (
          <MyAnnouncementCard
            announcement={item}
            urgentPriceCents={urgentPriceCents}
            urgentFeatureAccess={urgentFeatureAccess}
            onView={openDetail}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMarkSold={handleMarkSold}
            onUrgentSuccess={(announcement) => {
              updateAnnouncement(announcement.id, { is_hurry: 'yes' });
              refresh();
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Car color={colors.textDisabled} size={48} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>{t('my_announcements.empty_title')}</Text>
              <Text style={styles.emptySubtitle}>{t('my_announcements.empty_subtitle')}</Text>
              <GradientButton
                label={t('my_announcements.add_new_car')}
                onPress={() => router.push('/(tabs)/create')}
                compact
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          loading || actionLoading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : loadingMore ? (
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

      <OptionPickerModal<MyAnnouncementsStatus>
        visible={statusPickerOpen}
        title={t('my_announcements.all_status')}
        value={status}
        options={MY_ANNOUNCEMENTS_STATUS_OPTIONS}
        onClose={() => setStatusPickerOpen(false)}
        onChange={applyStatus}
      />

      <OptionPickerModal<MyAnnouncementsSort>
        visible={sortPickerOpen}
        title={t('my_announcements.sort.newest')}
        value={sort}
        options={MY_ANNOUNCEMENTS_SORT_OPTIONS}
        onClose={() => setSortPickerOpen(false)}
        onChange={applySort}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
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
    fontWeight: '700',
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.sm,
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
