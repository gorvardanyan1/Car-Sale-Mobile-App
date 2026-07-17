import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, ChevronLeft, Clock, MapPin, MessageCircle } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  getDealerCoverUrl,
  getDealerInitial,
  getDealerLogoUrl,
} from '@/lib/dealers/dealerDisplay';
import type { DealerProfile } from '@/types/dealer';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type DealerProfileHeaderProps = {
  dealer: DealerProfile;
  canMessage: boolean;
  messaging?: boolean;
  onBack?: () => void;
  onMessage?: () => void;
};

export function DealerProfileHeader({
  dealer,
  canMessage,
  messaging = false,
  onBack,
  onMessage,
}: DealerProfileHeaderProps) {
  const { t } = useTranslation();
  const coverUrl = getDealerCoverUrl(dealer.feature_image);
  const logoUrl = getDealerLogoUrl(dealer.logo);

  return (
    <View style={styles.root}>
      <View style={styles.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradients.primary} style={styles.cover} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']} style={styles.coverOverlay} />

        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} testID="dealer-profile-back">
            <ChevronLeft color={colors.white} size={22} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.logoWrap}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logo} />
          ) : (
            <LinearGradient colors={gradients.primary} style={styles.logoFallback}>
              <Text style={styles.logoInitial}>{getDealerInitial(dealer.name)}</Text>
            </LinearGradient>
          )}
          {dealer.verified ? (
            <View style={styles.verifiedIcon}>
              <BadgeCheck color={colors.white} size={18} />
            </View>
          ) : null}
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{dealer.name}</Text>
            {dealer.verified ? (
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>{t('dealer.verified')}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {dealer.location ? (
              <View style={styles.metaItem}>
                <MapPin color={colors.primaryLight} size={14} />
                <Text style={styles.metaText}>{dealer.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Clock color={colors.primaryLight} size={14} />
              <Text style={styles.metaText}>
                {t('dealer.joined')} {dealer.joined_date}
              </Text>
            </View>
          </View>

          {canMessage ? (
            <Pressable
              onPress={onMessage}
              disabled={messaging}
              style={[styles.messageButton, messaging && styles.messageButtonDisabled]}
              testID="dealer-message-button"
            >
              <MessageCircle color={colors.white} size={18} />
              <Text style={styles.messageButtonText}>
                {messaging ? t('common.loading') : t('dealer.message')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dealer.stats.total_listings}</Text>
            <Text style={styles.statLabel}>{t('dealer.total_listings')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueBlue]}>{dealer.stats.active_listings}</Text>
            <Text style={styles.statLabel}>{t('dealer.active_listings')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueGreen]}>{dealer.stats.sold_vehicles}</Text>
            <Text style={styles.statLabel}>{t('dealer.sold_vehicles')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.sm,
  },
  coverWrap: {
    height: 200,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
  },
  backText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  card: {
    marginTop: -56,
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  logoWrap: {
    alignSelf: 'flex-start',
    position: 'relative',
    marginTop: -52,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.card,
    backgroundColor: colors.surfaceMuted,
  },
  logoFallback: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    ...typography.sectionTitle,
    color: colors.white,
    fontSize: 32,
  },
  verifiedIcon: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 4,
  },
  info: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 24,
  },
  verifiedPill: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedPillText: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '700',
  },
  metaRow: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  messageButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 12,
  },
  messageButtonDisabled: {
    opacity: 0.7,
  },
  messageButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 20,
  },
  statValueBlue: {
    color: colors.primaryLight,
  },
  statValueGreen: {
    color: '#4ADE80',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
