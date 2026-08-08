import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';
import type { ChatReplySnapshot } from '@/types/chat';

type Props = {
  replyTo: ChatReplySnapshot;
  /** True when the *quoted* message was written by the signed-in user. */
  quotedIsMine: boolean;
  /** True when the message carrying the quote is the signed-in user's. */
  isMine: boolean;
  onJump?: (messageId: string) => void;
};

/**
 * The quoted snippet shown above a reply's own text.
 *
 * Renders only what the server snapshotted — it never reaches back into the
 * thread for the original, which may be outside the loaded page.
 */
export function ChatQuotedMessage({ replyTo, quotedIsMine, isMine, onJump }: Props) {
  const { t } = useTranslation();

  if (!replyTo?.text) {
    return null;
  }

  const content = (
    <View style={[styles.quote, isMine ? styles.quoteMine : styles.quoteTheirs]}>
      {quotedIsMine ? (
        <Text style={[styles.author, isMine ? styles.authorMine : styles.authorTheirs]}>
          {t('chat.you')}
        </Text>
      ) : null}
      <Text
        numberOfLines={2}
        style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}
      >
        {replyTo.text}
      </Text>
    </View>
  );

  if (!onJump) {
    return <View testID="chat-quoted-message">{content}</View>;
  }

  return (
    <Pressable
      onPress={() => onJump(replyTo.messageId)}
      testID="chat-quoted-message"
      accessibilityRole="button"
      accessibilityLabel={`${t('mobile.chat.replying_to')}: ${replyTo.text}`}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  quote: {
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
    borderRadius: radii.sm,
    gap: 1,
  },
  quoteMine: {
    borderLeftColor: colors.white,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  quoteTheirs: {
    borderLeftColor: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  author: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  authorMine: {
    color: colors.white,
  },
  authorTheirs: {
    color: colors.primary,
  },
  text: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  textMine: {
    color: 'rgba(255,255,255,0.85)',
  },
  textTheirs: {
    color: colors.textMuted,
  },
});
