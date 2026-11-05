import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneMissed, Video } from 'lucide-react-native';

import { describeCallHistory } from '@/lib/calls/callHistory';
import { formatChatTime } from '@/lib/chat/conversationDisplay';
import { colors, spacing, typography } from '@/theme';
import type { ChatMessageShape } from '@/types/chat';

/** A finished call, shown as a centered system row between the bubbles. */
function ChatCallHistoryRowImpl({ message, isCaller }: { message: ChatMessageShape; isCaller: boolean }) {
  const { t } = useTranslation();
  const { label, missed, video } = describeCallHistory(message, isCaller, t);
  const Icon = missed ? PhoneMissed : video ? Video : Phone;
  const tint = missed ? '#FCA5A5' : colors.textSecondary;

  return (
    <View style={styles.row} testID={`chat-call-history-${message._id}`}>
      <View style={[styles.pill, missed && styles.pillMissed]}>
        <Icon size={14} color={tint} />
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
        <Text style={styles.time}>{formatChatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

export const ChatCallHistoryRow = memo(ChatCallHistoryRowImpl);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pillMissed: {
    backgroundColor: colors.errorMuted,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  label: {
    ...typography.caption,
  },
  time: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSubtle,
  },
});
