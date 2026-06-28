import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Car, Eye, Fuel, Gauge, Heart, Zap } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatAnnouncementPrice,
  formatDriveType,
  formatEngineCapacity,
  formatHorsepower,
  formatTransmission,
  getAnnouncementImageUrl,
  getAnnouncementTitle,
  getDealerName,
  getListingSubtitle,
  isVerifiedDealerListing,
} from '@/lib/announcements/formatAnnouncement';
import type { Announcement } from '@/types/announcement';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type ListingCardProps = {
  announcement: Announcement;
  location?: string | null;
  viewed?: boolean;
  isFavorite?: boolean;
  onPress?: (announcement: Announcement) => void;
  onToggleFavorite?: (announcement: Announcement) => void;
};

export function ListingCard({
  announcement,
  location,
  viewed = false,
  isFavorite = false,
  onPress,
  onToggleFavorite,
}: ListingCardProps) {
  const { t } = useTranslation();
  const imageUrl = getAnnouncementImageUrl(announcement);
  const title = getAnnouncementTitle(announcement);
  const isUrgent = announcement.is_hurry === 'yes';
  const dealerName = getDealerName(announcement);
  const showDealer = isVerifiedDealerListing(announcement) && dealerName;
  const subtitle = getListingSubtitle(announcement, location);

  const specs = [
    {
      icon: <Fuel color={colors.primaryLight} size={14} />,
      label: formatEngineCapacity(announcement.engine_capacity),
    },
    {
      icon: <Car color={colors.primaryLight} size={14} />,
      label: formatTransmission(announcement.transmission),
    },
    {
      icon: <Gauge color={colors.primaryLight} size={14} />,
      label: formatHorsepower(announcement.horsepower),
    },
    {
      icon: <Car color={colors.primaryLight} size={14} />,
      label: formatDriveType(announcement.drive_type),
    },
  ];

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
            <Car color={colors.textDisabled} size={32} strokeWidth={1.5} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.imageGradient}
        />

        <View style={styles.topLeftBadges}>
          {viewed ? (
            <View style={styles.viewedBadge}>
              <Eye color={colors.white} size={12} />
              <Text style={styles.badgeText}>{t('archive.viewed')}</Text>
            </View>
          ) : null}
          {isUrgent ? (
            <LinearGradient colors={[...gradients.urgent]} style={styles.urgentBadge}>
              <Zap color={colors.white} size={14} fill={colors.white} />
              <Text style={styles.urgentText}>{t('archive.urgent')}</Text>
            </LinearGradient>
          ) : null}
        </View>

        <LinearGradient colors={[...gradients.primary]} style={styles.priceBadge}>
          <Text style={styles.priceText}>{formatAnnouncementPrice(announcement)}</Text>
        </LinearGradient>

        <View style={styles.bottomStats}>
          <View style={styles.statChip}>
            <Eye color={colors.white} size={12} />
            <Text style={styles.statText}>{announcement.views_count ?? 0}</Text>
          </View>
          <View style={styles.statChip}>
            <Heart color={colors.white} size={12} />
            <Text style={styles.statText}>{announcement.likes_count ?? 0}</Text>
          </View>
        </View>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite?.(announcement);
          }}
          style={[styles.favButton, isFavorite && styles.favButtonActive]}
          hitSlop={8}
        >
          <Heart
            color={isFavorite ? colors.white : colors.border}
            size={16}
            fill={isFavorite ? colors.white : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {showDealer ? (
            <View style={styles.dealerRow}>
              <BadgeCheck color={colors.primaryLight} size={12} />
              <Text style={styles.dealerText}>{dealerName}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.specsGrid}>
          {specs.map((spec, index) => (
            <View key={index} style={styles.specItem}>
              {spec.icon}
              <Text style={styles.specLabel} numberOfLines={1}>
                {spec.label}
              </Text>
            </View>
          ))}
        </View>

        <Pressable onPress={() => onPress?.(announcement)} style={({ pressed }) => [pressed && styles.detailsPressed]}>
          <LinearGradient
            colors={[...gradients.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.detailsButton}
          >
            <Text style={styles.detailsText}>{t('mobile.listing.view_details')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.6)',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  topLeftBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 6,
  },
  viewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  urgentText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  priceText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  bottomStats: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  favButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  favButtonActive: {
    backgroundColor: colors.favorite,
  },
  body: {
    padding: spacing.md,
  },
  titleBlock: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: 2,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dealerText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    rowGap: 6,
  },
  specItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: spacing.sm,
  },
  specLabel: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  detailsButton: {
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  detailsText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
