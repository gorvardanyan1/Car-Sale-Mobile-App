import { Users } from 'lucide-react-native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useDealerFollowers } from '@/hooks/useDealerFollowers';
import type { DealerFollower } from '@/types/dealer';
import { colors, radii, spacing, typography } from '@/theme';

export default function DealerFollowersScreen() {
  const { t } = useTranslation();
  const followers = useDealerFollowers();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={t('dealer.followers_title')}
          subtitle={t('dealer.followers_count', { count: followers.followersCount })}
          showBack
          backFallback="/(tabs)/settings"
        />
      </View>

      {followers.loading && followers.followers.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : followers.error && followers.followers.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{followers.error}</Text>
          <Pressable onPress={followers.refresh}>
            <Text style={styles.retryText}>{t('mobile.list.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={followers.followers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={followers.refreshing}
              onRefresh={followers.refresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={followers.loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => <FollowerRow follower={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState} testID="dealer-followers-empty">
              <View style={styles.emptyIcon}>
                <Users color={colors.textMuted} size={28} />
              </View>
              <Text style={styles.emptyTitle}>{t('dealer.followers_empty_title')}</Text>
              <Text style={styles.emptySubtitle}>{t('dealer.followers_empty_hint')}</Text>
            </View>
          }
          ListFooterComponent={
            followers.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function getFollowerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function FollowerRow({ follower }: { follower: DealerFollower }) {
  const { t } = useTranslation();

  return (
    <View style={styles.row} testID="dealer-follower-row">
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getFollowerInitials(follower.name)}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{follower.name}</Text>
        {follower.member_since ? (
          <Text style={styles.rowMeta}>
            {t('dealer.followers_member_since', { date: follower.member_since })}
          </Text>
        ) : null}
      </View>
    </View>
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
});
