import * as Clipboard from 'expo-clipboard';
import { Copy, Gift, Share2, Users } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { PointsHistoryCard } from '@/components/referrals/PointsHistoryCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useReferrals } from '@/hooks/useReferrals';
import { formatCents } from '@/lib/payment/formatCents';
import { colors, radii, spacing, typography } from '@/theme';

export default function ReferralsScreen() {
  const { t } = useTranslation();
  const referrals = useReferrals();
  const [copyLabel, setCopyLabel] = useState<string | null>(null);

  const overview = referrals.overview;

  async function handleShare() {
    if (!overview) {
      return;
    }

    try {
      await Share.share({ message: overview.referral_url });
    } catch {
      // User dismissed the share sheet — nothing to report.
    }
  }

  async function handleCopy() {
    if (!overview) {
      return;
    }

    await Clipboard.setStringAsync(overview.referral_url);
    setCopyLabel(t('referral.copied'));
    setTimeout(() => setCopyLabel(null), 2000);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={t('referral.page_title')}
          subtitle={t('referral.page_subtitle')}
          showBack
          backFallback="/(tabs)/settings"
        />
      </View>

      {referrals.loading && !overview ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : referrals.error && !overview ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{referrals.error}</Text>
          <Pressable onPress={referrals.refresh}>
            <Text style={styles.retryText}>{t('mobile.list.retry')}</Text>
          </Pressable>
        </View>
      ) : overview ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={referrals.refreshing}
              onRefresh={referrals.refresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {!overview.enabled ? (
            <View style={styles.disabledBanner} testID="referral-disabled-notice">
              <Text style={styles.disabledText}>{t('referral.disabled_notice')}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard} testID="referral-balance-card">
              <Gift color={colors.primaryLight} size={20} />
              <Text style={styles.statValue} testID="referral-balance-value">
                {overview.points_balance}
              </Text>
              <Text style={styles.statLabel}>{t('referral.your_points')}</Text>
              <Text style={styles.statHint}>
                {t('referral.worth_amount', {
                  amount: formatCents((overview.points_balance * overview.point_value_cents)),
                })}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Users color={colors.primaryLight} size={20} />
              <Text style={styles.statValue} testID="referral-invited-value">
                {overview.stats.invited}
              </Text>
              <Text style={styles.statLabel}>{t('referral.friends_invited')}</Text>
            </View>

            <View style={styles.statCard}>
              <Gift color="#4ADE80" size={20} />
              <Text style={styles.statValue} testID="referral-earned-value">
                {overview.stats.points_earned}
              </Text>
              <Text style={styles.statLabel}>{t('referral.points_earned')}</Text>
            </View>
          </View>

          <View style={styles.shareCard}>
            <Text style={styles.shareHeading}>{t('referral.share_heading')}</Text>
            <Text style={styles.shareDescription}>{t('referral.share_description')}</Text>

            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>{t('referral.your_code')}</Text>
              <Text style={styles.codeValue} testID="referral-code">
                {overview.referral_code}
              </Text>
            </View>

            <View style={styles.linkRow} testID="referral-link-input">
              <Text style={styles.linkText} numberOfLines={1}>
                {overview.referral_url}
              </Text>
            </View>

            {copyLabel ? <Text style={styles.copyHint}>{copyLabel}</Text> : null}

            <View style={styles.shareActions}>
              <Pressable
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => void handleCopy()}
                testID="referral-copy-button"
              >
                <Copy color={colors.primaryLight} size={16} />
                <Text style={styles.actionButtonSecondaryText}>{t('referral.copy_link')}</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => void handleShare()}
              >
                <Share2 color={colors.white} size={16} />
                <Text style={styles.actionButtonPrimaryText}>{t('referral.share_link')}</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('referral.history_heading')}</Text>

          {overview.history.length === 0 ? (
            <Text style={styles.emptyText} testID="referral-history-empty">
              {t('referral.history_empty')}
            </Text>
          ) : (
            <View style={styles.historyList} testID="referral-history-table">
              {overview.history.map((transaction) => (
                <PointsHistoryCard key={transaction.id} transaction={transaction} />
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
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
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  disabledBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  disabledText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 11,
  },
  statHint: {
    ...typography.caption,
    color: colors.primaryLight,
    fontSize: 10,
    textAlign: 'center',
  },
  shareCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  shareHeading: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  shareDescription: {
    ...typography.body,
    color: colors.textMuted,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primaryLight,
  },
  linkRow: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
  },
  linkText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  copyHint: {
    ...typography.caption,
    color: '#4ADE80',
    textAlign: 'center',
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.button,
    paddingVertical: 12,
  },
  actionButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonSecondaryText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonPrimaryText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textDisabled,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  historyList: {
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
