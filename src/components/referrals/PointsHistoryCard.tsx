import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatPaymentDate } from '@/lib/billing/formatPayment';
import { formatPointsAmount, getPointTransactionReasonLabel } from '@/lib/referrals/pointTransactionDisplay';
import type { PointTransaction } from '@/types/referral';
import { colors, radii, spacing, typography } from '@/theme';

type PointsHistoryCardProps = {
  transaction: PointTransaction;
};

export function PointsHistoryCard({ transaction }: PointsHistoryCardProps) {
  const { t } = useTranslation();
  const isCredit = transaction.amount > 0;

  return (
    <View style={styles.card} testID={`referral-history-item-${transaction.id}`}>
      <View style={styles.headerRow}>
        <Text style={styles.reason} numberOfLines={2}>
          {getPointTransactionReasonLabel(transaction, t)}
        </Text>
        <Text style={[styles.amount, isCredit ? styles.amountCredit : styles.amountDebit]}>
          {formatPointsAmount(transaction.amount)}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.date}>{formatPaymentDate(transaction.created_at)}</Text>
        <Text style={styles.balance}>
          {t('referral.col_balance')}: {transaction.balance_after}
        </Text>
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
  reason: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  amount: {
    ...typography.sectionTitle,
    fontSize: 15,
  },
  amountCredit: {
    color: '#4ADE80',
  },
  amountDebit: {
    color: colors.error,
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
  },
  balance: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
