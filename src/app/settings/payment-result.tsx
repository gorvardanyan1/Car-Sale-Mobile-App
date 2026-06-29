import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, CircleX } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import {
  navigateToMyAnnouncementsAfterPayment,
  navigateToWantedSearchesAfterPayment,
} from '@/lib/navigation/paymentReturn';
import { colors, spacing, typography } from '@/theme';

export default function PaymentResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ outcome?: string; feature?: string }>();

  const isSuccess = params.outcome === 'success';
  const isUrgent = params.feature === 'urgent';
  const isWantedSearches = params.feature === 'wanted_searches';

  const title = isSuccess ? t('payment.success_title') : t('payment.cancel_title');

  const body = useMemo(() => {
    if (!isSuccess) {
      return isWantedSearches
        ? t('payment.cancel_wanted_searches')
        : t('payment.cancel_body');
    }

    if (isUrgent) {
      return t('payment.success_urgent_active');
    }

    if (isWantedSearches) {
      return t('payment.success_wanted_searches');
    }

    return t('payment.success_processing');
  }, [isSuccess, isUrgent, isWantedSearches, t]);

  const ctaLabel = isWantedSearches
    ? t('payment.success_cta_wanted_searches')
    : t('payment.success_cta');

  const goBack = useCallback(() => {
    if (isWantedSearches) {
      navigateToWantedSearchesAfterPayment(router);
      return;
    }

    navigateToMyAnnouncementsAfterPayment(router);
  }, [isWantedSearches, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={title} showBack onBackPress={goBack} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, isSuccess ? styles.iconSuccess : styles.iconCancel]}>
          {isSuccess ? (
            <CheckCircle color={colors.white} size={48} />
          ) : (
            <CircleX color={colors.white} size={48} />
          )}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <GradientButton label={ctaLabel} onPress={goBack} />
      </View>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconSuccess: {
    backgroundColor: '#22C55E',
  },
  iconCancel: {
    backgroundColor: '#F59E0B',
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 22,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
