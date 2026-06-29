import { CreditCard, Repeat } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { BillingTab } from '@/types/billing';
import { colors, radii, spacing, typography } from '@/theme';

type BillingTabSwitcherProps = {
  activeTab: BillingTab;
  onChange: (tab: BillingTab) => void;
};

export function BillingTabSwitcher({ activeTab, onChange }: BillingTabSwitcherProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange('one_time')}
        style={[styles.tab, activeTab === 'one_time' && styles.tabActive]}
        testID="billing-tab-one-time"
      >
        <CreditCard color={activeTab === 'one_time' ? colors.primaryLight : colors.textMuted} size={16} />
        <Text style={[styles.tabText, activeTab === 'one_time' && styles.tabTextActive]}>
          {t('billing.tab_one_time')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('subscription')}
        style={[styles.tab, activeTab === 'subscription' && styles.tabActive]}
        testID="billing-tab-subscriptions"
      >
        <Repeat color={activeTab === 'subscription' ? colors.primaryLight : colors.textMuted} size={16} />
        <Text style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}>
          {t('billing.tab_subscriptions')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryLight,
  },
});
