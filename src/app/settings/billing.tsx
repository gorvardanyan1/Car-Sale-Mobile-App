import { CreditCard } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BillingSubscriptionCard } from '@/components/billing/BillingSubscriptionCard';
import { BillingTabSwitcher } from '@/components/billing/BillingTabSwitcher';
import { BillingTransactionCard } from '@/components/billing/BillingTransactionCard';
import { CancelSubscriptionModal } from '@/components/billing/CancelSubscriptionModal';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useBilling } from '@/hooks/useBilling';
import type { BillingSubscription } from '@/types/billing';
import { colors, radii, spacing, typography } from '@/theme';

export default function BillingScreen() {
  const { t } = useTranslation();
  const billing = useBilling();
  const [cancelTarget, setCancelTarget] = useState<BillingSubscription | null>(null);

  const closeCancelModal = useCallback(() => {
    if (billing.cancelingId !== null) {
      return;
    }

    setCancelTarget(null);
  }, [billing.cancelingId]);

  const confirmCancel = useCallback(async () => {
    if (!cancelTarget) {
      return;
    }

    const success = await billing.cancelSubscription(cancelTarget);

    if (success) {
      setCancelTarget(null);
    }
  }, [billing, cancelTarget]);

  const isSubscriptionTab = billing.activeTab === 'subscription';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={t('billing.title')}
          subtitle={t('billing.subtitle')}
          showBack
          backFallback="/(tabs)/settings"
        />
      </View>

      {billing.loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={billing.refreshing}
              onRefresh={billing.refresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <CreditCard color={colors.primaryLight} size={24} />
            </View>
            <Text style={styles.heroTitle}>{t('billing.title')}</Text>
            <Text style={styles.heroSubtitle}>{t('billing.subtitle')}</Text>
          </View>

          {billing.successMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{billing.successMessage}</Text>
            </View>
          ) : null}

          {billing.error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{billing.error}</Text>
            </View>
          ) : null}

          <BillingTabSwitcher activeTab={billing.activeTab} onChange={billing.setActiveTab} />

          {!isSubscriptionTab ? (
            billing.transactions.length === 0 ? (
              <Text style={styles.emptyText} testID="billing-empty-one-time">
                {t('billing.empty_one_time')}
              </Text>
            ) : (
              <View style={styles.list} testID="billing-one-time-list">
                {billing.transactions.map((transaction) => (
                  <BillingTransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </View>
            )
          ) : billing.subscriptions.length === 0 ? (
            <Text style={styles.emptyText} testID="billing-empty-subscriptions">
              {t('billing.empty_subscriptions')}
            </Text>
          ) : (
            <View style={styles.list} testID="billing-subscriptions-list">
              {billing.subscriptions.map((subscription) => (
                <BillingSubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  canceling={billing.cancelingId === subscription.id}
                  onCancel={setCancelTarget}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <CancelSubscriptionModal
        subscription={cancelTarget}
        canceling={billing.cancelingId === cancelTarget?.id}
        onClose={closeCancelModal}
        onConfirm={() => void confirmCancel()}
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
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    backgroundColor: colors.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 20,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  successBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  successText: {
    ...typography.caption,
    color: '#22C55E',
  },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.errorMuted,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
});
