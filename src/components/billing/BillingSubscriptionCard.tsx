import { Ban } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getBillingStatusColors } from '@/lib/billing/billingStatusStyle';
import { formatPaymentCents, formatPaymentDate } from '@/lib/billing/formatPayment';
import { getSubscriptionTypeLabel } from '@/lib/billing/transactionDisplay';
import type { BillingSubscription } from '@/types/billing';
import { colors, radii, spacing, typography } from '@/theme';

type BillingSubscriptionCardProps = {
  subscription: BillingSubscription;
  canceling: boolean;
  onCancel: (subscription: BillingSubscription) => void;
};

export function BillingSubscriptionCard({
  subscription,
  canceling,
  onCancel,
}: BillingSubscriptionCardProps) {
  const { t } = useTranslation();
  const statusColors = getBillingStatusColors(subscription.status);

  return (
    <View style={styles.card} testID={`billing-subscription-${subscription.id}`}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{getSubscriptionTypeLabel(subscription, t)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusColors.color }]}>
            {subscription.status}
          </Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        {subscription.cancel_at_period_end ? (
          <View style={styles.warningBadge}>
            <Text style={styles.warningBadgeText}>{t('billing.cancel_scheduled')}</Text>
          </View>
        ) : null}
        {subscription.refunded_at ? (
          <View style={styles.refundedBadge}>
            <Text style={styles.refundedBadgeText}>{t('billing.refunded')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{t('billing.started')}</Text>
          <Text style={styles.metaValue}>{formatPaymentDate(subscription.created_at)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{t('billing.amount')}</Text>
          <Text style={styles.metaValue}>
            {formatPaymentCents(subscription.amount_cents, subscription.currency)}
          </Text>
        </View>
        {subscription.current_period_end ? (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              {subscription.cancel_at_period_end
                ? t('billing.access_until')
                : t('billing.next_billing')}
            </Text>
            <Text style={styles.metaValue}>
              {formatPaymentDate(subscription.current_period_end)}
            </Text>
          </View>
        ) : null}
      </View>

      {subscription.can_cancel ? (
        <>
          <Pressable
            onPress={() => onCancel(subscription)}
            disabled={canceling}
            style={[styles.cancelButton, canceling && styles.cancelButtonDisabled]}
            testID={`billing-cancel-${subscription.id}`}
          >
            {canceling ? (
              <ActivityIndicator color={colors.textSecondary} size="small" />
            ) : (
              <>
                <Ban color={colors.textSecondary} size={16} />
                <Text style={styles.cancelText}>{t('billing.cancel_subscription')}</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.cancelHint}>{t('billing.cancel_hint')}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  warningBadge: {
    borderRadius: radii.pill,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  warningBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  refundedBadge: {
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  refundedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A855F7',
  },
  metaGrid: {
    gap: spacing.sm,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  cancelHint: {
    ...typography.caption,
    color: colors.textSubtle,
  },
});
