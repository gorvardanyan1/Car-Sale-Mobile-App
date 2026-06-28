import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { openExternalUrl } from '@/lib/security/openExternalUrl';
import type { SponsoredAd } from '@/types/announcement';
import { colors, gradients, radii, spacing, typography } from '@/theme';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80';

type SponsoredAdCardProps = {
  ad: SponsoredAd;
};

export function SponsoredAdCard({ ad }: SponsoredAdCardProps) {
  const { t } = useTranslation();

  if (!ad) {
    return null;
  }

  async function openAdLink() {
    if (!ad.link_url) return;
    await openExternalUrl(ad.link_url);
  }

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: ad.image_url || FALLBACK_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.15)', 'rgba(30, 64, 175, 0.25)']}
          style={styles.imageTint}
        />
        <View style={styles.sponsoredBadge}>
          <Sparkles color={colors.textMuted} size={12} />
          <Text style={styles.sponsoredText}>{t('archive.sponsored')}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{ad.title}</Text>
        {ad.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {ad.description}
          </Text>
        ) : null}

        <Pressable onPress={openAdLink} style={({ pressed }) => [pressed && styles.ctaPressed]}>
          <LinearGradient
            colors={[...gradients.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{ad.cta_text || t('archive.ad_cta_default')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 58, 138, 0.15)',
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  imageWrap: {
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  imageTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  sponsoredText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 17,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: spacing.xs,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
});
