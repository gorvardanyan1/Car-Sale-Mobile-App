import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnnouncementDetailView } from '@/components/announcements/AnnouncementDetailView';
import { getErrorMessage } from '@/lib/api/errors';
import { fetchAnnouncementDetail } from '@/services/announcementService';
import type { Announcement, CarFeatureDefinition } from '@/types/announcement';
import { colors, spacing, typography } from '@/theme';

export default function AnnouncementDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [carFeatures, setCarFeatures] = useState<CarFeatureDefinition[]>([]);
  const [similarAnnouncements, setSimilarAnnouncements] = useState<Announcement[]>([]);
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
          setAnnouncement(data.announcement);
          setCarFeatures(data.carFeatures ?? []);
          setSimilarAnnouncements(data.similarAnnouncements ?? []);
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

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <AnnouncementDetailView
      announcement={announcement}
      carFeatures={carFeatures}
      similarAnnouncements={similarAnnouncements}
      backFallback={from === 'create' ? '/settings/my-announcements' : '/(tabs)'}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});
