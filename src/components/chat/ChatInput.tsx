import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Send, X } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';
import type { ChatMessageShape } from '@/types/chat';

/**
 * Lets the screen drop a draft into the composer (the AI reply suggestion)
 * without lifting the whole value up: a controlled composer would re-render the
 * message list on every keystroke.
 */
export type ChatInputHandle = {
  setText: (text: string) => void;
};

type Props = {
  onSend: (text: string) => void;
  isSending?: boolean;
  disabled?: boolean;
  /** Fires on every keystroke — drives the typing indicator. */
  onTextChange?: (text: string) => void;
  /** Fires when the composer loses focus or a message is sent. */
  onStoppedTyping?: () => void;
  maxLength?: number;
  /** The message being replied to, shown above the composer. */
  replyTo?: ChatMessageShape | null;
  /** True when `replyTo` was written by the signed-in user. */
  replyToIsMine?: boolean;
  onCancelReply?: () => void;
};

export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput({
  onSend,
  isSending = false,
  disabled = false,
  onTextChange,
  onStoppedTyping,
  maxLength = 4000,
  replyTo = null,
  replyToIsMine = false,
  onCancelReply,
}: Props, ref) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useImperativeHandle(ref, () => ({ setText }), []);

  const handleChangeText = (value: string) => {
    setText(value);
    onTextChange?.(value);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;
    onSend(trimmed);
    setText('');
    // Sending ends the burst — the recipient should never see "typing…"
    // hanging under a message that has already arrived.
    onStoppedTyping?.();
  };

  const canSend = text.trim().length > 0 && !isSending && !disabled;

  return (
    <View style={styles.wrapper}>
      {replyTo ? (
        <View style={styles.replyBar} testID="chat-reply-preview">
          <View style={styles.replyBody}>
            <Text style={styles.replyLabel}>
              {t('mobile.chat.replying_to')}
              {replyToIsMine ? ` · ${t('chat.you')}` : ''}
            </Text>
            <Text numberOfLines={1} style={styles.replyText}>
              {replyTo.text}
            </Text>
          </View>
          <Pressable
            onPress={onCancelReply}
            hitSlop={8}
            testID="chat-cancel-reply"
            accessibilityRole="button"
            accessibilityLabel={t('mobile.chat.cancel_reply')}
          >
            <X size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        onBlur={onStoppedTyping}
        placeholder={t('mobile.chat.type_message')}
        placeholderTextColor={colors.inputPlaceholder}
        multiline
        maxLength={maxLength}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        editable={!disabled}
        testID="chat-input"
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        testID="chat-send-button"
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Send size={18} color={canSend ? colors.white : colors.textDisabled} />
        )}
      </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    borderRadius: radii.sm,
    backgroundColor: colors.inputBackground,
  },
  replyBody: {
    flex: 1,
    minWidth: 0,
  },
  replyLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  replyText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface,
  },
});
