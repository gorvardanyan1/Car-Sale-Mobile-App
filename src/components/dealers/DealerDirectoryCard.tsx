import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatDealerLocationLine,
  getDealerCoverUrl,
  getDealerInitial,
  getDealerLogoUrl,
  isTopPerformerDealer,
} from '@/lib/dealers/dealerDisplay';
import type { DealerCard } from '@/types/dealer';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type DealerCardProps = {
  dealer: DealerCard;
};

export function DealerDirectoryCard({ dealer }: DealerCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isTopPerformer = isTopPerformerDealer(dealer);
  const locationLine = formatDealerLocationLine(dealer.location, dealer.specialty);
  const coverUrl = getDealerCoverUrl(dealer.cover_image);
  const logoUrl = getDealerLogoUrl(dealer.logo);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/dealers/[id]', params: { id: String(dealer.id) } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      testID={`dealer-card-${dealer.id}`}
    >
      <View style={styles.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradients.primary} style={styles.cover} />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={styles.coverOverlay} />
        {isTopPerformer ? (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>{t('dealer.top_performer')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.logoRow}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logo} />
          ) : (
            <LinearGradient colors={gradients.primary} style={styles.logoFallback}>
              <Text style={styles.logoInitial}>{getDealerInitial(dealer.name)}</Text>
            </LinearGradient>
          )}
          {dealer.verified ? (
            <View style={styles.verifiedBadge}>
              <BadgeCheck color="#60A5FA" size={14} />
              <Text style={styles.verifiedText}>{t('dealer.verified')}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {dealer.name}
        </Text>

        {locationLine ? (
          <View style={styles.locationRow}>
            <MapPin color={colors.primaryLight} size={14} />
            <Text style={styles.locationText} numberOfLines={2}>
              {locationLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValueBlue}>{dealer.active_listings ?? 0}</Text>
            <Text style={styles.statLabel}>{t('dealer.listed')}</Text>
          </View>
          <View style={styles.statBoxGreen}>
            <Text style={styles.statValueGreen}>{dealer.sold_listings ?? 0}</Text>
            <Text style={styles.statLabel}>{t('dealer.sold')}</Text>
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>{t('dealer.view_profile')}</Text>
          <ArrowRight color={colors.white} size={16} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  cardPressed: {
    opacity: 0.92,
  },
  coverWrap: {
    height: 120,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
  },
  topBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topBadgeText: {
    ...typography.caption,
    color: '#78350F',
    fontWeight: '700',
    fontSize: 11,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: -36,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: colors.card,
  },
  logoFallback: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    ...typography.sectionTitle,
    color: colors.white,
    fontSize: 22,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  verifiedText: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '700',
    fontSize: 11,
  },
  name: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValueBlue: {
    ...typography.sectionTitle,
    color: colors.primaryLight,
    fontSize: 18,
  },
  statValueGreen: {
    ...typography.sectionTitle,
    color: '#4ADE80',
    fontSize: 18,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  cta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 12,
  },
  ctaText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
