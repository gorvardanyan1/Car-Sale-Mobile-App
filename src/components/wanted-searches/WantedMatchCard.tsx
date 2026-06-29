import { useRouter } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatAnnouncementPrice,
  getAnnouncementImageUrl,
  getAnnouncementTitle,
  getMileageDisplay,
} from '@/lib/announcements/formatAnnouncement';
import type { Announcement } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

type WantedMatchCardProps = {
  announcement: Announcement;
};

export function WantedMatchCard({ announcement }: WantedMatchCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const imageUrl = getAnnouncementImageUrl(announcement);
  const title = getAnnouncementTitle(announcement);

  return (
    <View style={styles.card} testID={`wanted-match-${announcement.id}`}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/announcement/[id]',
            params: { id: String(announcement.id) },
          })
        }
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[announcement.year, formatAnnouncementPrice(announcement), getMileageDisplay(announcement)]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <Pressable
          style={styles.viewButton}
          onPress={() =>
            router.push({
              pathname: '/announcement/[id]',
              params: { id: String(announcement.id) },
            })
          }
        >
          <ExternalLink color={colors.primaryLight} size={14} />
          <Text style={styles.viewButtonText}>{t('wanted_searches.view')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    overflow: 'hidden',
    flex: 1,
    minWidth: '48%',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    backgroundColor: colors.border,
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 14,
  },
  meta: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  viewButton: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewButtonText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
