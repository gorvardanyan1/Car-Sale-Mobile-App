import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Check, CheckCircle, Flame, Lock } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientButton } from '@/components/ui/GradientButton';
import { getErrorMessage } from '@/lib/api/errors';
import {
  DEFAULT_URGENT_PRICE_CENTS,
  formatFeaturePriceLabel,
  isSubscriptionBilling,
} from '@/lib/payment/paymentFeatureDisplay';
import { completeUrgentListingCheckout } from '@/services/paymentService';
import type { FeatureAccessInfo } from '@/types/payment';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type MakeAsUrgentProps = {
  isHurry: string | null | undefined;
  announcementId: number;
  urgentPriceCents?: number;
  urgentFeatureAccess?: FeatureAccessInfo | null;
  onSuccess?: () => void;
};

const BENEFIT_KEYS = [
  'my_announcements.urgent_benefit_1',
  'my_announcements.urgent_benefit_2',
  'my_announcements.urgent_benefit_3',
  'my_announcements.urgent_benefit_4',
] as const;

export function MakeAsUrgent({
  isHurry,
  announcementId,
  urgentPriceCents = DEFAULT_URGENT_PRICE_CENTS,
  urgentFeatureAccess = null,
  onSuccess,
}: MakeAsUrgentProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = isHurry === 'yes';
  const isLocked = urgentFeatureAccess?.status === 'locked';
  const isFree = urgentFeatureAccess?.reason === 'free';
  const isSubscription = !isFree && isSubscriptionBilling(urgentFeatureAccess);
  const priceDisplay = formatFeaturePriceLabel(urgentFeatureAccess, urgentPriceCents);
  const modalBodyKey = isSubscription
    ? 'my_announcements.urgent_modal_body_subscription'
    : 'my_announcements.urgent_modal_body';

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowModal(false);
        setError(null);
        setIsSubmitting(false);
      };
    }, []),
  );

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    setShowModal(false);

    try {
      const outcome = await completeUrgentListingCheckout(announcementId);

      if (outcome === 'fulfilled' || outcome === 'success') {
        setShowModal(false);
        onSuccess?.();
        return;
      }

      if (outcome === 'cancel') {
        setError(t('payment.cancel_body'));
      }
    } catch (err) {
      setError(getErrorMessage(err, t('my_announcements.urgent_payment_error')));
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
  }

  if (isLocked) {
    return (
      <Pressable
        disabled
        style={[styles.button, styles.buttonLocked]}
        accessibilityRole="button"
        testID="my-announcement-urgent-button-locked"
      >
        <Lock color={colors.textDisabled} size={16} />
        <Text style={styles.buttonLockedText}>{t('my_announcements.mark_urgent')}</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => {
          if (!isActive) {
            setShowModal(true);
          }
        }}
        disabled={isActive}
        style={[styles.button, isActive ? styles.buttonActive : styles.buttonInactive]}
        accessibilityRole="button"
        testID="my-announcement-urgent-button"
      >
        {isActive ? (
          <LinearGradient colors={[...gradients.urgent]} style={styles.activeGradient}>
            <Flame color={colors.white} size={16} fill={colors.white} />
            <Text style={styles.buttonActiveText}>{t('my_announcements.urgent_active')}</Text>
          </LinearGradient>
        ) : (
          <>
            <Flame color="#FB923C" size={16} />
            <Text style={styles.buttonInactiveText}>{t('my_announcements.mark_urgent')}</Text>
          </>
        )}
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <LinearGradient colors={[...gradients.urgent]} style={styles.modalIcon}>
                <Flame color={colors.white} size={28} fill={colors.white} />
              </LinearGradient>
              <Text style={styles.modalTitle}>{t('my_announcements.urgent_modal_title')}</Text>
              <Text style={styles.modalBody}>{t(modalBodyKey)}</Text>
              <Text style={styles.modalPrice}>
                {isFree
                  ? t('payment_features.free')
                  : isSubscription
                    ? t('payment_features.price_per_month', { price: priceDisplay })
                    : priceDisplay}
              </Text>
            </View>

            <View style={styles.benefitsCard}>
              <View style={styles.benefitsTitleRow}>
                <CheckCircle color="#22C55E" size={18} />
                <Text style={styles.benefitsTitle}>{t('my_announcements.urgent_benefits_title')}</Text>
              </View>
              {BENEFIT_KEYS.map((key) => (
                <View key={key} style={styles.benefitRow}>
                  <Check color="#22C55E" size={14} />
                  <Text style={styles.benefitText}>{t(key)}</Text>
                </View>
              ))}
            </View>

            {error ? (
              <View style={styles.errorBanner} testID="my-announcement-urgent-error">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeModal}
                style={styles.cancelButton}
                testID="my-announcement-urgent-cancel"
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>

              <View style={styles.confirmWrap}>
                <GradientButton
                  label={
                    isSubmitting
                      ? t('my_announcements.urgent_redirecting')
                      : isFree
                        ? t('actions.confirm')
                        : isSubscription
                          ? `${t('actions.confirm')} — ${t('payment_features.confirm_subscription_price', { price: priceDisplay })}`
                          : `${t('actions.confirm')} — ${priceDisplay}`
                  }
                  onPress={() => void handleConfirm()}
                  disabled={isSubmitting}
                  compact
                />
                {isSubmitting ? (
                  <ActivityIndicator color={colors.primary} style={styles.confirmSpinner} />
                ) : null}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.md,
    overflow: 'hidden',
    minHeight: 40,
    justifyContent: 'center',
  },
  buttonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  buttonInactiveText: {
    ...typography.caption,
    color: '#FB923C',
    fontWeight: '700',
    fontSize: 12,
  },
  buttonActive: {
    flex: 0,
  },
  activeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  buttonActiveText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  buttonLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.7,
  },
  buttonLockedText: {
    ...typography.caption,
    color: colors.textDisabled,
    fontWeight: '700',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 22,
    textAlign: 'center',
  },
  modalBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F97316',
    textAlign: 'center',
  },
  benefitsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  benefitsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitsTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  benefitText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: colors.errorMuted,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  cancelButton: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    fontSize: 14,
  },
  confirmWrap: {
    flex: 1,
    position: 'relative',
  },
  confirmSpinner: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -10,
  },
});
