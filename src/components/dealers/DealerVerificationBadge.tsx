import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { BadgeCheck, Check, CheckCircle, Lock } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientButton } from '@/components/ui/GradientButton';
import { getErrorMessage } from '@/lib/api/errors';
import { formatFeaturePriceLabel, isSubscriptionBilling } from '@/lib/payment/paymentFeatureDisplay';
import { completeDealerVerificationCheckout } from '@/services/dealerAccountService';
import type { DealerBadgeFeatureAccess } from '@/types/dealer';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type DealerVerificationBadgeProps = {
  isVerified: boolean;
  priceCents: number;
  featureAccess: DealerBadgeFeatureAccess | null;
  onVerified?: () => void;
};

const BENEFIT_KEYS = [
  'dealer.verification_benefit_1',
  'dealer.verification_benefit_2',
  'dealer.verification_benefit_3',
  'dealer.verification_benefit_4',
] as const;

export function DealerVerificationBadge({
  isVerified,
  priceCents,
  featureAccess,
  onVerified,
}: DealerVerificationBadgeProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = featureAccess?.status === 'locked';
  const isFree = featureAccess?.status === 'granted' && featureAccess?.reason === 'free';
  const isSubscription = !isFree && isSubscriptionBilling(featureAccess);
  const priceDisplay = formatFeaturePriceLabel(featureAccess, priceCents);
  const modalBodyKey = isSubscription
    ? 'dealer.verification_modal_body_subscription'
    : 'dealer.verification_modal_body';

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

    try {
      const outcome = await completeDealerVerificationCheckout();

      if (outcome === 'fulfilled' || outcome === 'success') {
        setShowModal(false);
        onVerified?.();
        return;
      }

      if (outcome === 'cancel') {
        setError(t('payment.cancel_body'));
      }
    } catch (err) {
      setError(getErrorMessage(err, t('dealer.verification_payment_error')));
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }
    setShowModal(false);
    setError(null);
  }

  if (isVerified) {
    return (
      <View style={styles.verifiedBadge} testID="dealer-verified-badge">
        <BadgeCheck color={colors.primaryLight} size={16} />
        <Text style={styles.verifiedBadgeText}>{t('dealer.verified')}</Text>
      </View>
    );
  }

  if (isLocked) {
    return (
      <View style={styles.lockedBadge} testID="dealer-verification-locked">
        <Lock color={colors.textDisabled} size={16} />
        <Text style={styles.lockedBadgeText}>{t('dealer.verification_unavailable')}</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        testID="dealer-verification-button"
        style={({ pressed }) => [styles.ctaWrapper, pressed && styles.ctaPressed]}
      >
        <LinearGradient colors={[...gradients.primary]} style={styles.cta}>
          <BadgeCheck color={colors.white} size={18} />
          <Text style={styles.ctaText}>{t('dealer.get_verified_badge')}</Text>
        </LinearGradient>
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <LinearGradient colors={[...gradients.primary]} style={styles.modalIcon}>
                <BadgeCheck color={colors.white} size={32} />
              </LinearGradient>
              <Text style={styles.modalTitle}>{t('dealer.verification_modal_title')}</Text>
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
                <Text style={styles.benefitsTitle}>{t('dealer.verification_benefits_title')}</Text>
              </View>
              {BENEFIT_KEYS.map((key) => (
                <View key={key} style={styles.benefitRow}>
                  <Check color="#22C55E" size={14} />
                  <Text style={styles.benefitText}>{t(key)}</Text>
                </View>
              ))}
            </View>

            {error ? (
              <View style={styles.errorBanner} testID="dealer-verification-error">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeModal}
                style={styles.cancelButton}
                disabled={isSubmitting}
                testID="dealer-verification-cancel"
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>

              <View style={styles.confirmWrap}>
                <GradientButton
                  label={
                    isSubmitting
                      ? t('dealer.verification_redirecting')
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  verifiedBadgeText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  lockedBadgeText: {
    ...typography.caption,
    color: colors.textDisabled,
    fontWeight: '600',
  },
  ctaWrapper: {
    borderRadius: radii.button,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ctaText: {
    ...typography.sectionTitle,
    color: colors.white,
    fontSize: 14,
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
    color: colors.primaryLight,
    textAlign: 'center',
  },
  benefitsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
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
