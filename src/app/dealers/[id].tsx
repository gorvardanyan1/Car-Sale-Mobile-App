import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ListingCard } from '@/components/announcements/ListingCard';
import { DealerProfileHeader } from '@/components/dealers/DealerProfileHeader';
import {
  DealerAboutSection,
  DealerProfileTabs,
  DealerReviewsPlaceholder,
} from '@/components/dealers/DealerProfileSections';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useDealerProfile } from '@/hooks/useDealerProfile';
import { useSafeBack } from '@/lib/navigation/useSafeBack';
import { getErrorMessage } from '@/lib/api/errors';
import { addDealerConversation } from '@/services/chatApiService';
import type { Announcement } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

export default function DealerProfileScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/dealers');
  const { id } = useLocalSearchParams<{ id: string }>();
  const dealerId = Number(id);
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const profile = useDealerProfile(dealerId);
  const [messaging, setMessaging] = useState(false);

  const isOwnProfile = user?.id === dealerId;
  const canMessage = isAuthenticated && !isOwnProfile && Boolean(profile.dealer?.verified);

  const listingsCount = profile.meta.total || profile.dealer?.stats.active_listings || 0;

  const openDetail = useCallback(
    (announcement: Announcement) => {
      router.push({
        pathname: '/announcement/[id]',
        params: { id: String(announcement.id) },
      });
    },
    [router],
  );

  const handleMessage = useCallback(async () => {
    if (!canMessage || !profile.dealer) {
      return;
    }

    if (listingsCount === 0) {
      Alert.alert(t('dealer.message'), t('dealer.message_no_listings'));
      return;
    }

    setMessaging(true);

    try {
      await addDealerConversation(profile.dealer.id);
      router.push('/(tabs)/messages');
    } catch (error) {
      Alert.alert(t('chat.send_failed'), getErrorMessage(error, t('chat.send_failed')));
    } finally {
      setMessaging(false);
    }
  }, [canMessage, listingsCount, profile.dealer, router, t]);

  const listHeader = useMemo(() => {
    if (!profile.dealer) {
      return null;
    }

    return (
      <View style={styles.headerContent}>
        <DealerProfileHeader
          dealer={profile.dealer}
          canMessage={canMessage}
          messaging={messaging}
          onBack={goBack}
          onMessage={() => void handleMessage()}
        />

        <DealerProfileTabs
          activeTab={profile.activeTab}
          listingsCount={listingsCount}
          onChange={profile.setActiveTab}
        />

        {profile.activeTab === 'listings' ? (
          <View style={styles.searchWrap}>
            <Search color={colors.textSubtle} size={16} />
            <TextInput
              value={profile.search}
              onChangeText={profile.setSearch}
              placeholder={t('dealer.search_inventory')}
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.searchInput}
            />
            {profile.search.length > 0 ? (
              <Pressable onPress={() => profile.setSearch('')} hitSlop={8}>
                <X color={colors.textSubtle} size={16} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {profile.activeTab === 'reviews' ? <DealerReviewsPlaceholder /> : null}
        {profile.activeTab === 'about' ? <DealerAboutSection dealer={profile.dealer} /> : null}
      </View>
    );
  }, [
    canMessage,
    goBack,
    handleMessage,
    listingsCount,
    messaging,
    profile.activeTab,
    profile.dealer,
    profile.search,
    profile.setActiveTab,
    profile.setSearch,
    t,
  ]);

  if (!Number.isFinite(dealerId) || dealerId <= 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={t('dealer.directory_title')} showBack backFallback="/dealers" />
        <Text style={styles.stateText}>{t('dealer.no_dealers_found')}</Text>
      </SafeAreaView>
    );
  }

  if (profile.loading && !profile.dealer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingHeader}>
          <ScreenHeader title={t('dealer.directory_title')} showBack backFallback="/dealers" />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profile.error && !profile.dealer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingHeader}>
          <ScreenHeader title={t('dealer.directory_title')} showBack backFallback="/dealers" />
        </View>
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{profile.error}</Text>
          <Pressable onPress={profile.refresh}>
            <Text style={styles.retryText}>{t('mobile.list.retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {profile.activeTab === 'listings' ? (
        <FlatList
          data={profile.listings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <View style={styles.listingItem}>
              <ListingCard
                announcement={item}
                isFavorite={isFavorite(item)}
                onPress={openDetail}
                onToggleFavorite={async (announcement) => {
                  const succeeded = await toggleFavorite(announcement);
                  if (!succeeded) {
                    Alert.alert(t('mobile.errors.favorite_toggle_failed'));
                  }
                }}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={profile.refreshing}
              onRefresh={profile.refresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => profile.loadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            !profile.loading ? (
              <View style={styles.emptyList}>
                <Text style={styles.stateText}>{t('archive.no_results')}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            profile.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'static'}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={profile.refreshing}
              onRefresh={profile.refresh}
              tintColor={colors.primary}
            />
          }
          renderItem={() => null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingHeader: {
    paddingHorizontal: spacing.md,
  },
  headerContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  searchWrap: {
    marginHorizontal: spacing.md,
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
  listContent: {
    paddingBottom: spacing.xl,
  },
  listingItem: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorBanner: {
    margin: spacing.md,
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
  stateText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyList: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
});
