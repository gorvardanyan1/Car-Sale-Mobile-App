import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getBillingStatusColors } from '@/lib/billing/billingStatusStyle';
import { formatPaymentCents, formatPaymentDate } from '@/lib/billing/formatPayment';
import {
  getTransactionInfoLabel,
  getTransactionTypeLabel,
} from '@/lib/billing/transactionDisplay';
import type { BillingTransaction } from '@/types/billing';
import { colors, radii, spacing, typography } from '@/theme';

type BillingTransactionCardProps = {
  transaction: BillingTransaction;
};

export function BillingTransactionCard({ transaction }: BillingTransactionCardProps) {
  const { t } = useTranslation();
  const statusColors = getBillingStatusColors(transaction.status);

  return (
    <View style={styles.card} testID={`billing-transaction-${transaction.id}`}>
      <View style={styles.headerRow}>
        <Text style={styles.product}>{getTransactionTypeLabel(transaction.type, t)}</Text>
        <Text style={styles.amount}>
          {formatPaymentCents(transaction.amount_cents, transaction.currency)}
        </Text>
      </View>

      <Text style={styles.subtitle}>{getTransactionInfoLabel(transaction)}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.date}>{formatPaymentDate(transaction.created_at)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusColors.color }]}>
            {transaction.status}
          </Text>
        </View>
      </View>
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
  product: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  amount: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 15,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    ...typography.caption,
    color: colors.textSubtle,
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
});
