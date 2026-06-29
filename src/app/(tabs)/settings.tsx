import {
  Bell,
  Car,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  MessageCircle,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ReactNode, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { LanguagePickerModal } from '@/components/settings/LanguagePickerModal';
import { ExpoGoPushBanner } from '@/components/notifications/ExpoGoPushBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useWantedSearchUnread } from '@/contexts/WantedSearchUnreadContext';
import type { SupportedLanguage } from '@/i18n';
import { getUserDisplayName, getUserInitials } from '@/lib/auth/userDisplay';
import { getErrorMessage } from '@/lib/api/errors';
import { colors, radii, spacing, typography } from '@/theme';

type SettingsItem = {
  id: string;
  labelKey: string;
  icon: ReactNode;
  badge?: string;
  valueKey?: string;
  onPress?: () => void;
};

type SettingsSection = {
  titleKey: string;
  items: SettingsItem[];
};

const LANGUAGE_LABEL_KEYS: Record<SupportedLanguage, string> = {
  en: 'mobile.settings.language_en',
  am: 'mobile.settings.language_am',
  ru: 'mobile.settings.language_ru',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { totalUnread: wantedSearchUnread } = useWantedSearchUnread();
  const { t, i18n } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);

  const currentLanguage = (i18n.language as SupportedLanguage) || 'en';
  const languageLabel = t(LANGUAGE_LABEL_KEYS[currentLanguage] ?? LANGUAGE_LABEL_KEYS.en);

  const isIndividualUser = user.roles.includes('user');

  const sections = useMemo<SettingsSection[]>(
    () => [
      {
        titleKey: 'mobile.settings.account_section',
        items: [
          {
            id: 'my-announcements',
            labelKey: 'user.my_announcements',
            icon: <Car color="#60A5FA" size={16} />,
            onPress: () => router.push('/settings/my-announcements'),
          },
          ...(isIndividualUser
            ? [
                {
                  id: 'wanted-searches',
                  labelKey: 'user.wanted_searches',
                  icon: <Bell color="#FACC15" size={16} />,
                  badge: wantedSearchUnread > 0 ? String(wantedSearchUnread) : undefined,
                  onPress: () => router.push('/settings/wanted-searches'),
                },
              ]
            : []),
          {
            id: 'edit',
            labelKey: 'mobile.settings.edit_profile',
            icon: <User color="#60A5FA" size={16} />,
            onPress: () => router.push('/settings/edit-profile'),
          },
          {
            id: 'password',
            labelKey: 'mobile.settings.change_password',
            icon: <Lock color="#C084FC" size={16} />,
            onPress: () => router.push('/settings/change-password'),
          },
          {
            id: 'billing',
            labelKey: 'user.billing',
            icon: <CreditCard color="#4ADE80" size={16} />,
            onPress: () => router.push('/settings/billing'),
          },
          {
            id: 'notifications',
            labelKey: 'mobile.settings.notifications',
            icon: <Bell color="#FACC15" size={16} />,
          },
          {
            id: 'privacy',
            labelKey: 'mobile.settings.privacy',
            icon: <Shield color="#4ADE80" size={16} />,
          },
        ],
      },
      {
        titleKey: 'mobile.settings.preferences_section',
        items: [
          {
            id: 'language',
            labelKey: 'mobile.settings.language',
            icon: <Globe color="#22D3EE" size={16} />,
            valueKey: languageLabel,
            onPress: () => setLanguageOpen(true),
          },
          {
            id: 'currency',
            labelKey: 'mobile.settings.currency',
            icon: <CreditCard color="#4ADE80" size={16} />,
            valueKey: 'USD',
          },
          {
            id: 'app',
            labelKey: 'mobile.settings.app_settings',
            icon: <SettingsIcon color="#9CA3AF" size={16} />,
          },
        ],
      },
      {
        titleKey: 'mobile.settings.support_section',
        items: [
          { id: 'help', labelKey: 'mobile.settings.help', icon: <HelpCircle color="#60A5FA" size={16} /> },
          {
            id: 'contact',
            labelKey: 'mobile.settings.contact',
            icon: <MessageCircle color="#4ADE80" size={16} />,
          },
        ],
      },
    ],
    [isIndividualUser, languageLabel, router, wantedSearchUnread],
  );

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      setSignOutError(getErrorMessage(error, t('mobile.errors.sign_out_failed')));
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return null;
  }

  const roleLabel = user.roles.includes('dealer')
    ? t('mobile.settings.dealer_account')
    : t('mobile.settings.individual_account');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{getUserDisplayName(user)}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <Text style={styles.profileRole}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { labelKey: 'mobile.settings.listings', value: '0' },
              { labelKey: 'mobile.settings.sold', value: '0' },
              { labelKey: 'mobile.settings.rating', value: '—' },
            ].map((stat) => (
              <View key={stat.labelKey} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{t(stat.labelKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        <ExpoGoPushBanner />

        {sections.map((section) => (
          <View key={section.titleKey} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={item.onPress}
                  style={[styles.settingsRow, index > 0 && styles.settingsRowBorder]}
                >
                  <View style={styles.settingsIconWrap}>{item.icon}</View>
                  <Text style={styles.settingsLabel}>{t(item.labelKey)}</Text>
                  {item.badge ? (
                    <View style={styles.settingsBadge}>
                      <Text style={styles.settingsBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  {item.valueKey ? <Text style={styles.settingsValue}>{item.valueKey}</Text> : null}
                  <ChevronRight color={colors.textDisabled} size={16} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
          onPress={() => void handleSignOut()}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#F87171" size="small" />
          ) : (
            <LogOut color="#F87171" size={16} />
          )}
          <Text style={styles.signOutText}>
            {isSigningOut ? t('mobile.settings.signing_out') : t('mobile.settings.sign_out')}
          </Text>
        </Pressable>

        {signOutError ? <Text style={styles.signOutError}>{signOutError}</Text> : null}
      </ScrollView>

      <LanguagePickerModal visible={languageOpen} onClose={() => setLanguageOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.backgroundElevated,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.screenTitle,
    color: colors.text,
  },
  profileEmail: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileRole: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textDisabled,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.button,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  settingsRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  settingsBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  settingsBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  settingsValue: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.errorMuted,
    backgroundColor: 'rgba(69, 10, 10, 0.2)',
  },
  signOutText: {
    ...typography.sectionTitle,
    color: '#F87171',
    fontSize: 14,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutError: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
});
