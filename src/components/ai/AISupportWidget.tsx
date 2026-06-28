import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '@/lib/api/errors';
import { fetchAiSupportConfig, streamAiSupportChat } from '@/services/aiSupportService';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function AISupportWidget() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [popularQuestions, setPopularQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const mountedRef = useRef(true);
  const streamAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;
    };
  }, []);

  const closeModal = useCallback(() => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsLoading(false);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const config = await fetchAiSupportConfig();
        if (!cancelled) {
          setPopularQuestions(config.popular_questions);
        }
      } catch {
        // Popular questions are optional.
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text = input) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setInput('');
      setIsLoading(true);

      streamAbortRef.current?.abort();
      const abortController = new AbortController();
      streamAbortRef.current = abortController;

      let assistantContent = '';

      try {
        if (mountedRef.current) {
          setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        }

        await streamAiSupportChat(
          trimmed,
          (chunk) => {
            if (!mountedRef.current || abortController.signal.aborted) {
              return;
            }

            assistantContent += chunk;
            const nextContent = assistantContent;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: nextContent };
              return updated;
            });
          },
          { signal: abortController.signal },
        );
      } catch (error) {
        if (!mountedRef.current || abortController.signal.aborted) {
          return;
        }

        setMessages((prev) => {
          const withoutEmptyAssistant =
            prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1]?.content === ''
              ? prev.slice(0, -1)
              : prev;

          return [
            ...withoutEmptyAssistant,
            { role: 'assistant', content: getErrorMessage(error, t('mobile.ai_support.error')) },
          ];
        });
      } finally {
        if (streamAbortRef.current === abortController) {
          streamAbortRef.current = null;
        }

        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [input, isLoading, t],
  );

  return (
    <>
      {!isOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mobile.ai_support.open')}
          onPress={() => setIsOpen(true)}
          style={[styles.fab, { bottom: Math.max(insets.bottom, spacing.sm) + 72 }]}
        >
          <LinearGradient colors={[...gradients.primary]} style={styles.fabGradient}>
            <MessageCircle color={colors.white} size={24} />
          </LinearGradient>
        </Pressable>
      ) : null}

      <Modal visible={isOpen} animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
            <Text style={styles.headerTitle}>{t('mobile.ai_support.title')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mobile.ai_support.close')}
              onPress={closeModal}
              hitSlop={8}
            >
              <X color={colors.textMuted} size={22} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && popularQuestions.length > 0 ? (
              <View style={styles.popularBlock}>
                <Text style={styles.popularTitle}>{t('mobile.ai_support.popular_questions')}</Text>
                {popularQuestions.map((question) => (
                  <Pressable
                    key={question}
                    onPress={() => sendMessage(question)}
                    style={styles.popularChip}
                  >
                    <Text style={styles.popularChipText}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[
                  styles.messageRow,
                  message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading ? (
              <View style={styles.typingRow}>
                <Text style={styles.typingText}>{t('mobile.ai_support.typing')}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('mobile.ai_support.placeholder')}
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.input}
              editable={!isLoading}
              returnKeyType="send"
              onSubmitEditing={() => void sendMessage()}
            />
            <Pressable
              onPress={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              style={[styles.sendButton, (isLoading || !input.trim()) && styles.sendButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.sendText}>{t('mobile.ai_support.send')}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 40,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  popularBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  popularTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  popularChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  popularChipText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    backgroundColor: colors.surfaceMuted,
  },
  messageText: {
    ...typography.body,
    fontSize: 14,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.text,
  },
  typingRow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
