import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { toSuggestionLanguage } from '@/lib/chat/replySuggestion';
import {
  describeChatReplySuggestionError,
  suggestChatReply,
} from '@/services/chatReplySuggestionService';
import { colors, radii, spacing, typography } from '@/theme';

type Props = {
  conversationId: string;
  /** Receives the draft — the composer fills, nothing is sent. */
  onSuggestion: (suggestion: string) => void;
};

/**
 * "Suggest a reply" chip, pinned under the newest message.
 *
 * The draft only ever lands in the composer: the user reads it, edits it and
 * presses send themselves.
 */
export function ChatReplySuggestion({ conversationId, onSuggestion }: Props) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePress() {
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const suggestion = await suggestChatReply(
        conversationId,
        toSuggestionLanguage(i18n.language),
      );
      onSuggestion(suggestion);
    } catch (err) {
      // The server explains a disabled feature or a rate limit; anything else
      // is internal detail the user cannot act on.
      setError(describeChatReplySuggestionError(err, t('mobile.chat.suggest_reply_failed')));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.wrapper} testID="chat-reply-suggestion">
      <Pressable
        onPress={handlePress}
        disabled={isLoading}
        style={[styles.chip, isLoading && styles.chipDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading, busy: isLoading }}
        accessibilityLabel={t('mobile.chat.suggest_reply')}
        accessibilityHint={t('mobile.chat.suggest_reply_hint')}
        testID="chat-reply-suggestion-button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primaryLight} />
        ) : (
          <Sparkles size={14} color={colors.primaryLight} />
        )}
        <Text style={styles.label}>
          {isLoading ? t('mobile.chat.suggesting_reply') : t('mobile.chat.suggest_reply')}
        </Text>
      </Pressable>

      {error ? (
        <Text style={styles.error} testID="chat-reply-suggestion-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs / 2,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  chipDisabled: {
    opacity: 0.6,
  },
  label: {
    ...typography.caption,
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    ...typography.caption,
    color: colors.error,
    fontSize: 11,
  },
});
