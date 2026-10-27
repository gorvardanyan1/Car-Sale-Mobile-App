import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Mic, Send, Trash2, X } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';
import { useVoiceRecorder, type VoiceRecording } from '@/hooks/useVoiceRecorder';
import {
  formatVoiceDuration,
  isSendableRecording,
  MAX_VOICE_DURATION_MS,
} from '@/lib/chat/voiceMessage';
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
  /** Called with a finished recording. Omit to hide the microphone button. */
  onSendVoice?: (recording: VoiceRecording) => void;
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
  onSendVoice,
}: Props, ref) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useImperativeHandle(ref, () => ({ setText }), []);

  const submitRecording = (recording: VoiceRecording) => {
    // A brush of the button, not a message — drop it quietly.
    if (isSendableRecording(recording.durationMs)) onSendVoice?.(recording);
  };

  const recorder = useVoiceRecorder(submitRecording);

  const handleStartRecording = async () => {
    if (disabled || isSending) return;
    onStoppedTyping?.();
    try {
      const started = await recorder.start();
      if (!started) {
        Alert.alert(t('mobile.chat.voice_permission_title'), t('mobile.chat.voice_permission_body'));
      }
    } catch {
      Alert.alert(t('mobile.chat.voice_failed'));
    }
  };

  const handleSendRecording = async () => {
    const recording = await recorder.stop();
    if (recording) submitRecording(recording);
  };

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
  const showMic = Boolean(onSendVoice) && text.trim().length === 0;

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
      {recorder.isRecording ? (
        <View style={styles.container} testID="chat-recording-bar">
          <Pressable
            onPress={() => void recorder.cancel()}
            hitSlop={8}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={t('mobile.chat.voice_cancel')}
            testID="chat-voice-cancel"
          >
            <Trash2 size={20} color={colors.error} />
          </Pressable>
          <View style={styles.recordingInfo}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime} testID="chat-recording-time">
              {formatVoiceDuration(recorder.durationMs)}
            </Text>
            <Text style={styles.recordingMax}>/ {formatVoiceDuration(MAX_VOICE_DURATION_MS)}</Text>
          </View>
          <Pressable
            onPress={() => void handleSendRecording()}
            style={styles.sendButton}
            accessibilityRole="button"
            accessibilityLabel={t('mobile.chat.voice_send')}
            testID="chat-voice-send"
          >
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
      ) : (
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
        {showMic ? (
          <Pressable
            onPress={() => void handleStartRecording()}
            disabled={disabled || isSending}
            style={[styles.sendButton, (disabled || isSending) && styles.sendButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('mobile.chat.voice_record')}
            testID="chat-mic-button"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Mic size={18} color={disabled ? colors.textDisabled : colors.white} />
            )}
          </Pressable>
        ) : (
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
        )}
        </View>
      )}
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 40,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  recordingTime: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  recordingMax: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface,
  },
});
