import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme';
import { formatChatTime } from '@/lib/chat/conversationDisplay';
import type { ChatMessageShape } from '@/types/chat';

type Props = {
  message: ChatMessageShape;
  isMine: boolean;
};

export function ChatMessageBubble({ message, isMine }: Props) {
  const time = formatChatTime(message.createdAt);

  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs / 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    gap: 2,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  text: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: {
    color: colors.white,
  },
  textTheirs: {
    color: colors.text,
  },
  time: {
    ...typography.caption,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  timeMine: {
    color: 'rgba(255,255,255,0.65)',
  },
  timeTheirs: {
    color: colors.textSubtle,
  },
});
