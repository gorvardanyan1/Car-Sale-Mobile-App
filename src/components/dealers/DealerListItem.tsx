import { useRouter } from 'expo-router';
import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import {
  formatDealerLocationLine,
  getDealerInitial,
  getDealerLogoUrl,
  isTopPerformerDealer,
} from '@/lib/dealers/dealerDisplay';
import type { DealerCard } from '@/types/dealer';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type DealerListItemProps = {
  dealer: DealerCard;
};

export function DealerListItem({ dealer }: DealerListItemProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const locationLine = formatDealerLocationLine(dealer.location, dealer.specialty) || '—';
  const isTopPerformer = isTopPerformerDealer(dealer);
  const logoUrl = getDealerLogoUrl(dealer.logo);

  return (
    <View style={styles.card} testID={`dealer-list-item-${dealer.id}`}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.logo} />
      ) : (
        <LinearGradient colors={gradients.primary} style={styles.logoFallback}>
          <Text style={styles.logoInitial}>{getDealerInitial(dealer.name)}</Text>
        </LinearGradient>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {dealer.name}
          </Text>
          {dealer.verified ? <BadgeCheck color="#60A5FA" size={16} /> : null}
          {isTopPerformer ? (
            <View style={styles.topBadge}>
              <Text style={styles.topBadgeText}>{t('dealer.top_performer')}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.locationRow}>
          <MapPin color={colors.textMuted} size={13} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLine}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statValue}>{dealer.active_listings ?? 0}</Text>
        <Text style={styles.statLabel}>{t('dealer.listed')}</Text>
      </View>
      <View style={styles.stats}>
        <Text style={[styles.statValue, styles.statValueGreen]}>{dealer.sold_listings ?? 0}</Text>
        <Text style={styles.statLabel}>{t('dealer.sold')}</Text>
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/dealers/[id]', params: { id: String(dealer.id) } })}
        style={styles.cta}
      >
        <Text style={styles.ctaText}>{t('dealer.view')}</Text>
        <ArrowRight color={colors.white} size={14} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
  },
  logoFallback: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    ...typography.sectionTitle,
    color: colors.white,
    fontSize: 18,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    flexShrink: 1,
  },
  topBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    fontSize: 12,
  },
  stats: {
    alignItems: 'center',
    minWidth: 44,
  },
  statValue: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 14,
  },
  statValueGreen: {
    color: '#4ADE80',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ctaText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
