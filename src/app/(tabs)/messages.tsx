import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { colors, radii, spacing, typography } from '@/theme';

const PLACEHOLDER_MESSAGES = [
  {
    id: 1,
    name: 'Ahmed Al-Rashid',
    car: 'Mercedes-Benz C300',
    time: '2m ago',
    lastMsg: 'Is the price negotiable?',
    unread: 2,
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    car: 'BMW 428i Coupe',
    time: '1h ago',
    lastMsg: 'Can I schedule a test drive?',
    unread: 0,
  },
];

export default function MessagesScreen() {
  const { t } = useTranslation();
  const unreadTotal = PLACEHOLDER_MESSAGES.reduce((sum, item) => sum + item.unread, 0);

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader
        title={t('mobile.messages.title')}
        subtitle={t('mobile.messages.unread', { count: unreadTotal })}
      />

      <View style={styles.list}>
        {PLACEHOLDER_MESSAGES.map((message) => (
          <View key={message.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{message.name.charAt(0)}</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={styles.name}>{message.name}</Text>
                <Text style={styles.time}>{message.time}</Text>
              </View>
              <Text style={styles.car}>{message.car}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {message.lastMsg}
              </Text>
            </View>
            {message.unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{message.unread}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.footerNote}>
        <MessageCircle color={colors.textDisabled} size={16} />
        <Text style={styles.footerText}>{t('mobile.messages.integration_note')}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.button,
    padding: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 14,
  },
  time: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  car: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSubtle,
    flex: 1,
  },
});
