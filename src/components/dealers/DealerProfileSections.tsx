import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isSafeHttpUrl } from '@/lib/security/isSafeHttpUrl';
import type { DealerProfile } from '@/types/dealer';
import { colors, radii, spacing, typography } from '@/theme';

type DealerAboutSectionProps = {
  dealer: DealerProfile;
};

export function DealerAboutSection({ dealer }: DealerAboutSectionProps) {
  const { t } = useTranslation();

  const socialLinks = [
    { key: 'facebook', label: 'Facebook', url: dealer.facebook_url },
    { key: 'twitter', label: 'Twitter', url: dealer.twitter_url },
    { key: 'instagram', label: 'Instagram', url: dealer.instagram_url },
  ].filter((item) => item.url);

  const openUrl = (url: string) => {
    if (!isSafeHttpUrl(url)) {
      return;
    }

    void Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {dealer.about_us ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dealer.about_us')}</Text>
          <Text style={styles.bodyText}>{dealer.about_us}</Text>
        </View>
      ) : null}

      {dealer.specializations.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dealer.specializations')}</Text>
          <View style={styles.tags}>
            {dealer.specializations.map((item) => (
              <View key={item} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {dealer.phone || dealer.website || dealer.location ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dealer.contact')}</Text>
          {dealer.phone ? <Text style={styles.bodyText}>{dealer.phone}</Text> : null}
          {dealer.location ? <Text style={styles.bodyText}>{dealer.location}</Text> : null}
          {dealer.website && isSafeHttpUrl(dealer.website) ? (
            <Pressable onPress={() => openUrl(dealer.website!)}>
              <Text style={styles.linkText}>{dealer.website}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {socialLinks.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dealer.social')}</Text>
          {socialLinks.map((item) => (
            <Pressable key={item.key} onPress={() => openUrl(item.url!)}>
              <Text style={styles.linkText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {dealer.business_hours.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dealer.business_hours')}</Text>
          {dealer.business_hours.map((row) => (
            <View key={`${row.day}-${row.hours}`} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{row.day}</Text>
              <Text style={styles.hoursValue}>{row.hours}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function DealerReviewsPlaceholder() {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{t('dealer.no_reviews')}</Text>
    </View>
  );
}

export function DealerProfileTabs({
  activeTab,
  listingsCount,
  onChange,
}: {
  activeTab: 'listings' | 'reviews' | 'about';
  listingsCount: number;
  onChange: (tab: 'listings' | 'reviews' | 'about') => void;
}) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'listings' as const, label: `${t('dealer.listings')} (${listingsCount})` },
    { id: 'reviews' as const, label: t('dealer.reviews') },
    { id: 'about' as const, label: t('dealer.about') },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, active && styles.tabActive]}
            testID={`dealer-tab-${tab.id}`}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  bodyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  linkText: {
    ...typography.body,
    color: colors.primaryLight,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  hoursDay: {
    ...typography.caption,
    color: colors.textMuted,
  },
  hoursValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabs: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tab: {
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.white,
  },
});
