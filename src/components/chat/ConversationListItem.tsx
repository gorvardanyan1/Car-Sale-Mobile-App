import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useChatSocket } from '@/contexts/ChatSocketContext';
import { getConversationDisplay, formatChatTime } from '@/lib/chat/conversationDisplay';
import { colors, radii, spacing, typography } from '@/theme';
import type { ChatConversation } from '@/types/chat';

type Props = {
  conversation: ChatConversation;
  currentUserId: number | null | undefined;
  onPress: () => void;
  onLongPress?: () => void;
};

export function ConversationListItem({ conversation, currentUserId, onPress, onLongPress }: Props) {
  const { t } = useTranslation();
  const { unreadByConversation } = useChatSocket();

  const display = getConversationDisplay(conversation, currentUserId, t);
  const unread = unreadByConversation[conversation._id] ?? conversation.unreadCount ?? 0;
  const lastText = conversation.lastMessage?.text ?? '';
  const lastTime = formatChatTime(
    conversation.lastMessage?.createdAt ?? conversation.updatedAt,
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatarWrap}>
        {display.imageUrl ? (
          <Image source={{ uri: display.imageUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{display.initials}</Text>
          </View>
        )}
        {unread > 0 ? (
          <View style={styles.unreadDot} />
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.title, unread > 0 && styles.titleUnread]} numberOfLines={1}>
            {display.title}
          </Text>
          <Text style={styles.time}>{lastTime}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {lastText || display.subtitle}
          </Text>
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
    borderWidth: 2,
    borderColor: colors.background,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
    color: colors.textSubtle,
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
