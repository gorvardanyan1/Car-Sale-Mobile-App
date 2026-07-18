import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useFavorites } from '@/contexts/FavoritesContext';
import { SimilarAnnouncementCard, SIMILAR_CARD_WIDTH } from './SimilarAnnouncementCard';
import type { Announcement } from '@/types/announcement';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type SimilarAnnouncementsSectionProps = {
  announcements: Announcement[];
  onPressAnnouncement: (announcement: Announcement) => void;
};

const CARD_GAP = spacing.sm;

/**
 * Horizontal "Similar Announcements" carousel shown on the detail screen —
 * the mobile counterpart of the web app's similar-announcements section.
 * Renders nothing when there are no recommendations for this listing.
 */
export function SimilarAnnouncementsSection({
  announcements,
  onPressAnnouncement,
}: SimilarAnnouncementsSectionProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (announcements.length === 0) {
    return null;
  }

  async function handleToggleFavorite(announcement: Announcement) {
    const succeeded = await toggleFavorite(announcement);
    if (!succeeded) {
      Alert.alert(t('mobile.errors.favorite_toggle_failed'));
    }
  }

  return (
    <View style={styles.wrap} testID="similar-announcements-section">
      <View style={styles.header}>
        <LinearGradient colors={[...gradients.primary]} style={styles.headerIcon}>
          <Sparkles color={colors.white} size={16} />
        </LinearGradient>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>{t('announcement.similar.title')}</Text>
          <Text style={styles.subtitle}>{t('announcement.similar.subtitle')}</Text>
        </View>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SIMILAR_CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <SimilarAnnouncementCard
            announcement={item}
            isFavorite={isFavorite(item)}
            onPress={onPressAnnouncement}
            onToggleFavorite={(announcement) => void handleToggleFavorite(announcement)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: { flex: 1 },
  title: { ...typography.sectionTitle, color: colors.text, fontSize: 16 },
  subtitle: { ...typography.caption, color: colors.textSubtle, marginTop: 2 },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  separator: {
    width: CARD_GAP,
  },
});
