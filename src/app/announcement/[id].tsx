import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  formatAnnouncementPrice,
  getAnnouncementImageUrl,
  getAnnouncementTitle,
  getMileageDisplay,
} from '@/lib/announcements/formatAnnouncement';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchAnnouncementDetail } from '@/services/announcementService';
import type { Announcement } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchAnnouncementDetail(Number(id));
        if (!cancelled) {
          const payload = (data.announcement as Announcement | undefined) ?? (data as unknown as Announcement);
          setAnnouncement(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const imageUrl = announcement ? getAnnouncementImageUrl(announcement) : null;

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader title={t('mobile.listing.details_title')} showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : announcement ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>{t('mobile.listing.no_image')}</Text>
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{getAnnouncementTitle(announcement)}</Text>
            <Text style={styles.price}>{formatAnnouncementPrice(announcement)}</Text>

            <View style={styles.specGrid}>
              {announcement.year ? (
                <Spec label={t('announcement.year')} value={String(announcement.year)} />
              ) : null}
              {getMileageDisplay(announcement) ? (
                <Spec label={t('announcement.mileage')} value={getMileageDisplay(announcement)} />
              ) : null}
              {announcement.transmission ? (
                <Spec label={t('announcement.transmission')} value={announcement.transmission} />
              ) : null}
              {announcement.drive_type ? (
                <Spec label={t('filters.drive_type')} value={announcement.drive_type.toUpperCase()} />
              ) : null}
            </View>

            {announcement.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('announcement.description')}</Text>
                <Text style={styles.description}>{String(announcement.description)}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </ScreenContainer>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  content: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  price: {
    ...typography.sectionTitle,
    color: colors.primaryLight,
    fontSize: 20,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specItem: {
    minWidth: '45%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 2,
  },
  specLabel: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  specValue: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
