import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientButton } from '@/components/ui/GradientButton';
import { formatPaymentDate } from '@/lib/billing/formatPayment';
import { getSubscriptionTypeLabel } from '@/lib/billing/transactionDisplay';
import type { BillingSubscription } from '@/types/billing';
import { colors, radii, spacing, typography } from '@/theme';

type CancelSubscriptionModalProps = {
  subscription: BillingSubscription | null;
  canceling: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelSubscriptionModal({
  subscription,
  canceling,
  onClose,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={subscription != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={canceling ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{t('billing.cancel_modal_title')}</Text>
          <Text style={styles.body}>{t('billing.cancel_confirm')}</Text>

          {subscription ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('billing.col_product')}</Text>
                <Text style={styles.summaryValue}>
                  {getSubscriptionTypeLabel(subscription, t)}
                </Text>
              </View>
              {subscription.current_period_end ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('billing.access_until')}</Text>
                  <Text style={styles.summaryValue}>
                    {formatPaymentDate(subscription.current_period_end)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.hint}>{t('billing.cancel_hint')}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={canceling}
              style={styles.cancelAction}
              testID="billing-cancel-dismiss"
            >
              <Text style={styles.cancelActionText}>{t('common.cancel')}</Text>
            </Pressable>
            <View style={styles.confirmWrap}>
              <GradientButton
                label={
                  canceling ? t('billing.canceling') : t('billing.cancel_subscription')
                }
                onPress={onConfirm}
                disabled={canceling}
                compact
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 20,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  summaryValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  hint: {
    ...typography.caption,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelAction: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelActionText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    fontSize: 14,
  },
  confirmWrap: {
    flex: 1,
  },
});
