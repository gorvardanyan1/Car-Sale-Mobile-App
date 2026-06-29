import { LinearGradient } from 'expo-linear-gradient';
import { Car, CheckCircle, Clock, Eye, Flame, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MyAnnouncementsStats } from '@/types/announcement';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type MyAnnouncementsStatsGridProps = {
  stats: MyAnnouncementsStats;
};

export function MyAnnouncementsStatsGrid({ stats }: MyAnnouncementsStatsGridProps) {
  const { t } = useTranslation();

  const cards = [
    {
      key: 'total',
      label: t('my_announcements.total'),
      value: stats.total,
      hint: t('my_announcements.total_hint'),
      icon: <Car color={colors.white} size={18} />,
      colors: gradients.primary,
      valueColor: colors.primaryLight,
    },
    {
      key: 'active',
      label: t('status.active'),
      value: stats.active,
      hint: t('my_announcements.live'),
      icon: <CheckCircle color={colors.white} size={18} />,
      colors: gradients.success,
      valueColor: '#4ADE80',
    },
    {
      key: 'pending',
      label: t('status.pending'),
      value: stats.pending,
      hint: t('my_announcements.review'),
      icon: <Clock color={colors.white} size={18} />,
      colors: gradients.urgent,
      valueColor: '#FBBF24',
    },
    {
      key: 'urgent',
      label: t('my_announcements.urgent'),
      value: stats.urgent,
      hint: t('my_announcements.hot'),
      icon: <Flame color={colors.white} size={18} />,
      colors: ['#F97316', '#DC2626'] as const,
      valueColor: '#FB923C',
    },
    {
      key: 'views',
      label: t('my_announcements.views'),
      value: stats.views,
      hint: t('my_announcements.views_hint'),
      icon: <Eye color={colors.white} size={18} />,
      colors: ['#6366F1', '#2563EB'] as const,
      valueColor: '#818CF8',
    },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View key={card.key} style={styles.card}>
          <LinearGradient colors={[...card.colors]} style={styles.iconWrap}>
            {card.icon}
          </LinearGradient>
          <Text style={styles.label}>{card.label}</Text>
          <Text style={[styles.value, { color: card.valueColor }]}>{card.value}</Text>
          <View style={styles.hintRow}>
            <TrendingUp color={card.valueColor} size={10} />
            <Text style={[styles.hint, { color: card.valueColor }]}>{card.hint}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  hint: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
});
