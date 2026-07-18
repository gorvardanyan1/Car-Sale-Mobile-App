import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Car, Fuel, Heart, Sparkles } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatAnnouncementPrice,
  formatTransmission,
  getAnnouncementImageUrl,
  getAnnouncementTitle,
  getDealerName,
  getMileageDisplay,
  isVerifiedDealerListing,
} from '@/lib/announcements/formatAnnouncement';
import { formatEngineTypeLabel } from '@/lib/announcements/engineType';
import { formatMatchReasonLabel } from '@/lib/announcements/matchReason';
import type { Announcement } from '@/types/announcement';
import { colors, gradients, radii, spacing, typography } from '@/theme';

export const SIMILAR_CARD_WIDTH = 236;

type SimilarAnnouncementCardProps = {
  announcement: Announcement;
  isFavorite?: boolean;
  onPress?: (announcement: Announcement) => void;
  onToggleFavorite?: (announcement: Announcement) => void;
};

/**
 * Compact recommendation card for the "Similar Announcements" horizontal
 * carousel on the detail screen. A condensed sibling of ListingCard — same
 * visual language (dark card, primary gradient price/details), but every
 * block is unconditionally rendered (dealer row always reserves its slot)
 * so every card in the row lands at the same height regardless of content.
 */
export function SimilarAnnouncementCard({
  announcement,
  isFavorite = false,
  onPress,
  onToggleFavorite,
}: SimilarAnnouncementCardProps) {
  const { t } = useTranslation();
  const imageUrl = getAnnouncementImageUrl(announcement);
  const title = getAnnouncementTitle(announcement);
  const dealerName = getDealerName(announcement);
  const showDealer = isVerifiedDealerListing(announcement) && Boolean(dealerName);
  const subtitle = [announcement.year ? String(announcement.year) : null, getMileageDisplay(announcement) || null]
    .filter(Boolean)
    .join(' • ');
  const matchScore = typeof announcement.match_score === 'number' ? announcement.match_score : null;
  const primaryReason = announcement.match_reasons?.[0] ?? null;

  return (
    <Pressable
      onPress={() => onPress?.(announcement)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Car color={colors.textDisabled} size={26} strokeWidth={1.5} />
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.45)']} style={styles.imageGradient} />

        <LinearGradient colors={[...gradients.primary]} style={styles.priceBadge}>
          <Text style={styles.priceText} numberOfLines={1}>
            {formatAnnouncementPrice(announcement)}
          </Text>
        </LinearGradient>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite?.(announcement);
          }}
          style={[styles.favButton, isFavorite && styles.favButtonActive]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('actions.favorite')}
        >
          <Heart
            color={isFavorite ? colors.white : colors.border}
            size={13}
            fill={isFavorite ? colors.white : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <View style={styles.dealerRow}>
            {showDealer ? (
              <>
                <BadgeCheck color={colors.primaryLight} size={11} />
                <Text style={styles.dealerText} numberOfLines={1}>
                  {dealerName}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {matchScore !== null ? (
          <View style={styles.matchRow}>
            <LinearGradient colors={[...gradients.match]} style={styles.matchBadge}>
              <Sparkles color={colors.white} size={11} />
              <Text style={styles.matchText}>
                {t('announcement.similar.match_score', { score: matchScore })}
              </Text>
            </LinearGradient>
            {primaryReason ? (
              <View style={styles.reasonChip}>
                <Text style={styles.reasonText} numberOfLines={1}>
                  {formatMatchReasonLabel(t, primaryReason)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <Fuel color={colors.primaryLight} size={12} />
            <Text style={styles.specText} numberOfLines={1}>
              {formatEngineTypeLabel(t, announcement.engine_type)}
            </Text>
          </View>
          <View style={styles.specItem}>
            <Car color={colors.primaryLight} size={12} />
            <Text style={styles.specText} numberOfLines={1}>
              {formatTransmission(announcement.transmission)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => onPress?.(announcement)}
          style={({ pressed }) => [pressed && styles.detailsPressed]}
        >
          <LinearGradient colors={[...gradients.primary]} style={styles.detailsButton}>
            <Text style={styles.detailsText}>{t('mobile.listing.view_details')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SIMILAR_CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageGradient: { ...StyleSheet.absoluteFill },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  priceText: { ...typography.caption, color: colors.white, fontWeight: '700', fontSize: 12 },
  favButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButtonActive: { backgroundColor: colors.favorite },
  body: { padding: spacing.sm, gap: 6 },
  textBlock: { gap: 2 },
  title: { ...typography.sectionTitle, color: colors.text, fontSize: 14, fontWeight: '700' },
  subtitle: { ...typography.caption, color: colors.textSubtle, fontSize: 11 },
  dealerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 14 },
  dealerText: { ...typography.caption, color: colors.primaryLight, fontWeight: '600', fontSize: 11 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  matchText: { ...typography.caption, color: colors.white, fontWeight: '700', fontSize: 10 },
  reasonChip: {
    flexShrink: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  reasonText: { ...typography.caption, color: colors.primaryLight, fontSize: 10, fontWeight: '600' },
  specsRow: { flexDirection: 'row', gap: 12 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  specText: { ...typography.caption, color: colors.textMuted, fontSize: 11, flexShrink: 1 },
  detailsButton: {
    paddingVertical: 8,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailsPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  detailsText: { ...typography.body, color: colors.white, fontWeight: '700', fontSize: 13 },
});
