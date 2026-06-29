import { Lock } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatFeaturePriceLabel,
  isSubscriptionBilling,
} from '@/lib/payment/paymentFeatureDisplay';
import type { FeatureAccessInfo } from '@/types/wantedSearch';
import { colors, radii, spacing, typography } from '@/theme';
import {
  isFeatureAccessBannerVisible,
  shouldShowFeatureAccessPayButton,
} from '@/lib/wanted-searches/featureAccessBanner';

type FeatureAccessBannerProps = {
  featureAccess: FeatureAccessInfo | null | undefined;
  onPay?: () => void;
  isPaying?: boolean;
};

export function FeatureAccessBanner({
  featureAccess,
  onPay,
  isPaying = false,
}: FeatureAccessBannerProps) {
  const { t } = useTranslation();

  if (!isFeatureAccessBannerVisible(featureAccess)) {
    return null;
  }

  const isLocked = featureAccess.status === 'locked';
  const isSubscription = isSubscriptionBilling(featureAccess);
  const priceLabel = featureAccess.price_cents
    ? formatFeaturePriceLabel(featureAccess, featureAccess.price_cents)
    : null;

  return (
    <View style={styles.banner} testID="wanted-search-feature-access">
      <Lock color="#FBBF24" size={18} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLocked
            ? t('payment_features.locked_title')
            : isSubscription
              ? t('payment_features.subscription_required_title')
              : t('payment_features.payment_required_title')}
        </Text>
        <Text style={styles.message}>
          {isLocked
            ? t('payment_features.locked_message')
            : isSubscription
              ? t('payment_features.payment_required_message_subscription', {
                  price: priceLabel ?? '',
                })
              : t('payment_features.payment_required_message', { price: priceLabel ?? '' })}
        </Text>
        {shouldShowFeatureAccessPayButton(featureAccess, Boolean(onPay)) ? (
          <Pressable
            onPress={onPay}
            disabled={isPaying}
            style={[styles.payButton, isPaying && styles.payButtonDisabled]}
            testID="wanted-search-feature-pay-button"
          >
            {isPaying ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.payButtonText}>
                {isSubscription
                  ? t('payment_features.subscribe_now')
                  : t('payment_features.pay_now')}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: '#FBBF24',
    fontSize: 14,
  },
  message: {
    ...typography.caption,
    color: colors.textMuted,
  },
  payButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    minWidth: 120,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
