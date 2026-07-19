import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Calculator,
  Calendar,
  Car,
  CheckCircle,
  Eye,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Shield,
  Star,
  Zap,
} from 'lucide-react-native';
import { ReactNode, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { ImageLightbox } from './ImageLightbox';
import { SimilarAnnouncementsSection } from './SimilarAnnouncementsSection';
import {
  formatAnnouncementPrice,
  formatDriveType,
  formatEngineCapacity,
  formatHorsepower,
  formatTransmission,
  getAnnouncementDescription,
  getAnnouncementFeatureLabels,
  getAnnouncementGalleryUrls,
  getAnnouncementLikesCount,
  getAnnouncementLocation,
  getAnnouncementTitle,
  getAnnouncementViewsCount,
  getDealerName,
  isVerifiedDealerListing,
} from '@/lib/announcements/formatAnnouncement';
import { formatEngineTypeLabel, shouldHideEngineCapacity } from '@/lib/announcements/engineType';
import { useAnnouncementViewTracking } from '@/hooks/useLocalViews';
import { useSafeBack } from '@/lib/navigation/useSafeBack';
import type { Announcement, CarFeatureDefinition } from '@/types/announcement';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type AnnouncementDetailViewProps = {
  announcement: Announcement;
  carFeatures?: CarFeatureDefinition[];
  similarAnnouncements?: Announcement[];
  backFallback?: Href;
};

type StatTone = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan' | 'amber';

const statToneStyles: Record<
  StatTone,
  { backgroundColor: string; borderColor: string; iconColor: string }
> = {
  blue: {
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    iconColor: '#60A5FA',
  },
  green: {
    backgroundColor: 'rgba(20, 83, 45, 0.45)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    iconColor: '#4ADE80',
  },
  purple: {
    backgroundColor: 'rgba(88, 28, 135, 0.45)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    iconColor: '#C084FC',
  },
  orange: {
    backgroundColor: 'rgba(124, 45, 18, 0.45)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
    iconColor: '#FB923C',
  },
  pink: {
    backgroundColor: 'rgba(131, 24, 67, 0.45)',
    borderColor: 'rgba(236, 72, 153, 0.35)',
    iconColor: '#F472B6',
  },
  cyan: {
    backgroundColor: 'rgba(22, 78, 99, 0.45)',
    borderColor: 'rgba(34, 211, 238, 0.35)',
    iconColor: '#22D3EE',
  },
  amber: {
    backgroundColor: 'rgba(120, 53, 15, 0.45)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    iconColor: '#FBBF24',
  },
};

export function AnnouncementDetailView({
  announcement,
  carFeatures = [],
  similarAnnouncements = [],
  backFallback,
}: AnnouncementDetailViewProps) {
  const router = useRouter();
  const handleBack = useSafeBack(backFallback);
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxVisible, setIsLightboxVisible] = useState(false);

  const galleryUrls = useMemo(() => getAnnouncementGalleryUrls(announcement), [announcement]);
  const activeImageUrl = galleryUrls[activeImageIndex] ?? null;
  const title = getAnnouncementTitle(announcement);
  const location = getAnnouncementLocation(announcement);
  const description = getAnnouncementDescription(announcement);
  const featureLabels = useMemo(
    () => getAnnouncementFeatureLabels(announcement, carFeatures, i18n.language),
    [announcement, carFeatures, i18n.language],
  );
  const dealerName = getDealerName(announcement);
  const showDealer = isVerifiedDealerListing(announcement) && dealerName;
  const favorite = isFavorite(announcement);
  const isUrgent = announcement.is_hurry === 'yes';
  const isOwner = user?.id != null && Number(announcement.user_id) === Number(user.id);
  const hideEngineCapacity = shouldHideEngineCapacity(
    announcement.engine_type,
    announcement.hidden_fields,
  );

  useAnnouncementViewTracking(announcement.id);

  async function handleToggleFavorite() {
    const succeeded = await toggleFavorite(announcement);
    if (!succeeded) {
      Alert.alert(t('mobile.errors.favorite_toggle_failed'));
    }
  }

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      Alert.alert(t('mobile.listing.sign_in_to_contact'));
      return;
    }

    action();
  }

  function handleContactSeller() {
    requireAuth(() => {
      const phone = announcement.phone?.trim();
      if (!phone) {
        Alert.alert(t('mobile.listing.phone_unavailable'));
        return;
      }

      void Linking.openURL(`tel:${phone}`);
    });
  }

  function handleSendMessage() {
    requireAuth(() => {
      router.push('/(tabs)/messages');
    });
  }

  function handleOpenSimilarAnnouncement(target: Announcement) {
    router.push({ pathname: '/announcement/[id]', params: { id: String(target.id) } });
  }

  const resolvedStatCards = [
    {
      label: t('announcement.year'),
      value: announcement.year ? String(announcement.year) : '—',
      icon: <Calendar color={statToneStyles.blue.iconColor} size={18} />,
      tone: 'blue' as StatTone,
    },
    {
      label: t('announcement.mileage'),
      value: (() => {
        const mileage = announcement.mileage;
        if (!mileage) return '—';
        if (typeof mileage === 'object' && mileage.value) {
          return `${Number(mileage.value).toLocaleString()} ${mileage.unit ?? 'km'}`;
        }
        return String(mileage);
      })(),
      icon: <Gauge color={statToneStyles.green.iconColor} size={18} />,
      tone: 'green' as StatTone,
    },
    {
      label: t('list.hp'),
      value: formatHorsepower(announcement.horsepower),
      icon: <Zap color={statToneStyles.purple.iconColor} size={18} />,
      tone: 'purple' as StatTone,
    },
    {
      label: t('announcement.transmission'),
      value: formatTransmission(announcement.transmission),
      icon: <Car color={statToneStyles.orange.iconColor} size={18} />,
      tone: 'orange' as StatTone,
    },
    {
      label: t('announcement.engine_type'),
      value: formatEngineTypeLabel(t, announcement.engine_type),
      icon: <Fuel color={statToneStyles.amber.iconColor} size={18} />,
      tone: 'amber' as StatTone,
    },
    ...(hideEngineCapacity
      ? []
      : [
          {
            label: t('announcement.engine_capacity'),
            value: formatEngineCapacity(announcement.engine_capacity),
            icon: <Fuel color={statToneStyles.pink.iconColor} size={18} />,
            tone: 'pink' as StatTone,
          },
        ]),
    {
      label: t('filters.drive_type'),
      value: formatDriveType(announcement.drive_type),
      icon: <Car color={statToneStyles.cyan.iconColor} size={18} />,
      tone: 'cyan' as StatTone,
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          {activeImageUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('gallery.fullscreen_view')}
              onPress={() => setIsLightboxVisible(true)}
              style={styles.heroImagePressable}
              testID="announcement-detail-open-lightbox"
            >
              <Image source={{ uri: activeImageUrl }} style={styles.heroImage} resizeMode="cover" />
            </Pressable>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Car color={colors.textDisabled} size={40} strokeWidth={1.5} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={styles.heroGradient}
            pointerEvents="none"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={handleBack}
            style={[styles.heroIconButton, { top: Math.max(insets.top, spacing.sm) + 4 }]}
          >
            <ArrowLeft color={colors.white} size={20} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('actions.favorite')}
            onPress={() => void handleToggleFavorite()}
            style={[
              styles.heroIconButton,
              styles.heroIconButtonRight,
              { top: Math.max(insets.top, spacing.sm) + 4 },
              favorite && styles.heroFavActive,
            ]}
          >
            <Heart
              color={colors.white}
              size={20}
              fill={favorite ? colors.white : 'transparent'}
            />
          </Pressable>

          {isUrgent ? (
            <LinearGradient colors={[...gradients.urgent]} style={styles.urgentBadge}>
              <Zap color={colors.white} size={14} fill={colors.white} />
              <Text style={styles.urgentText}>{t('announcement.urgent_sale')}</Text>
            </LinearGradient>
          ) : null}

          <LinearGradient colors={[...gradients.primary]} style={styles.heroPriceBadge}>
            <Text style={styles.heroPriceText}>{formatAnnouncementPrice(announcement)}</Text>
          </LinearGradient>
        </View>

        {galleryUrls.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {galleryUrls.map((url, index) => (
              <Pressable
                key={`${url}-${index}`}
                onPress={() => setActiveImageIndex(index)}
                style={[
                  styles.thumbnail,
                  index === activeImageIndex && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri: url }} style={styles.thumbnailImage} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Eye color={colors.textSubtle} size={14} />
              <Text style={styles.metaText}>
                {getAnnouncementViewsCount(announcement)} {t('announcement.views')}
              </Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <View style={styles.metaItem}>
              <Heart color={colors.textSubtle} size={14} />
              <Text style={styles.metaText}>
                {getAnnouncementLikesCount(announcement)} {t('announcement.saves')}
              </Text>
            </View>
            {location ? (
              <>
                <Text style={styles.metaDot}>•</Text>
                <View style={styles.metaItem}>
                  <MapPin color={colors.textSubtle} size={14} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {showDealer ? (
            <View style={styles.dealerRow}>
              <BadgeCheck color={colors.primaryLight} size={14} />
              <Text style={styles.dealerText}>{dealerName}</Text>
            </View>
          ) : null}

          <Text style={styles.priceLarge}>{formatAnnouncementPrice(announcement)}</Text>

          <View style={styles.statsGrid}>
            {resolvedStatCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </View>

          {description ? (
            <SectionCard
              title={t('announcement.description')}
              icon={<MessageCircle color={colors.primaryLight} size={16} />}
            >
              <Text style={styles.descriptionText}>{description}</Text>
            </SectionCard>
          ) : null}

          <SectionCard
            title={t('announcement.features')}
            icon={<Star color={colors.primaryLight} size={16} />}
          >
            {featureLabels.length > 0 ? (
              <View style={styles.featureRow}>
                {featureLabels.map((feature) => (
                  <View key={feature} style={styles.featureChip}>
                    <CheckCircle color="#4ADE80" size={14} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyFeatures}>{t('announcement.no_features')}</Text>
            )}
          </SectionCard>

          <View style={styles.trustCard}>
            <View style={styles.trustItem}>
              <BadgeCheck color="#4ADE80" size={28} />
              <Text style={styles.trustLabel}>{t('announcement.verified_seller')}</Text>
            </View>
            <View style={styles.trustItem}>
              <Shield color={colors.primaryLight} size={28} />
              <Text style={styles.trustLabel}>{t('announcement.protected')}</Text>
            </View>
            <View style={styles.trustItem}>
              <Star color="#C084FC" size={28} />
              <Text style={styles.trustLabel}>{t('announcement.top_rated')}</Text>
            </View>
          </View>

          <View style={styles.ctaBlock}>
            <GradientButton
              label={t('actions.contact_seller')}
              icon={<Phone color={colors.white} size={18} />}
              onPress={handleContactSeller}
              disabled={isOwner}
            />
            <GradientButton
              label={t('actions.send_message')}
              icon={<Send color={colors.white} size={18} />}
              colors={['#22C55E', '#059669']}
              onPress={handleSendMessage}
              disabled={isOwner}
            />
            <Pressable
              onPress={() => Alert.alert(t('credit.calculator'), t('mobile.listing.credit_coming_soon'))}
              style={({ pressed }) => [styles.creditButton, pressed && styles.creditButtonPressed]}
            >
              <Calculator color="#C084FC" size={18} />
              <Text style={styles.creditButtonText}>{t('credit.calculator')}</Text>
            </Pressable>
          </View>

          <SimilarAnnouncementsSection
            announcements={similarAnnouncements}
            onPressAnnouncement={handleOpenSimilarAnnouncement}
          />
        </View>
      </ScrollView>

      {isLightboxVisible ? (
        <ImageLightbox
          images={galleryUrls}
          initialIndex={activeImageIndex}
          onClose={() => setIsLightboxVisible(false)}
          altText={title}
        />
      ) : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: StatTone;
}) {
  const toneStyle = statToneStyles[tone];

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor },
      ]}
    >
      {icon}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function GradientButton({
  label,
  icon,
  onPress,
  disabled = false,
  colors: gradientColors = [...gradients.primary],
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  colors?: readonly [string, string, ...string[]];
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.gradientButtonWrap,
        disabled && styles.ctaDisabled,
        pressed && !disabled && styles.ctaPressed,
      ]}
    >
      <LinearGradient colors={gradientColors} style={styles.gradientButton}>
        {icon}
        <Text style={styles.gradientButtonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  heroWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  heroImagePressable: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroIconButton: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconButtonRight: {
    left: undefined,
    right: spacing.md,
  },
  heroFavActive: {
    backgroundColor: colors.favorite,
  },
  urgentBadge: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  urgentText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  heroPriceBadge: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  heroPriceText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  thumbnailRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 72,
    height: 54,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.primaryLight,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  metaText: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  metaDot: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealerText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  priceLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primaryLight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
  },
  statValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  sectionCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.65)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  featureText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyFeatures: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  trustCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 83, 45, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trustLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  ctaBlock: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  gradientButtonWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
  },
  gradientButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  creditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    backgroundColor: 'rgba(88, 28, 135, 0.25)',
  },
  creditButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  creditButtonText: {
    ...typography.body,
    color: '#C084FC',
    fontWeight: '800',
    fontSize: 16,
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
