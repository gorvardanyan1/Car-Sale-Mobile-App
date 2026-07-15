import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { useConversations } from '@/hooks/useConversations';
import { useChatThread } from '@/hooks/useChatThread';
import { useChatSocket } from '@/contexts/ChatSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getConversationDisplay } from '@/lib/chat/conversationDisplay';
import { colors, spacing, typography } from '@/theme';
import type { ChatMessageShape } from '@/types/chat';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { connected, isUserOnline, joinConversation, joinConversationById, leaveConversation } = useChatSocket();
  const { conversations } = useConversations();
  const { messages, isLoading, error, isSending, sendError, sendMessage } = useChatThread(
    id ?? null,
  );

  const flatListRef = useRef<FlatList<ChatMessageShape>>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const joinedRef = useRef<string | null>(null);

  const conversation = id ? conversations.find((c) => c._id === id) : undefined;
  const display = conversation
    ? getConversationDisplay(conversation, user?.id, t)
    : null;

  const partnerId =
    conversation
      ? Number(user?.id) === Number(conversation.buyerId)
        ? conversation.ownerId
        : conversation.buyerId
      : null;

  // `conversation` is looked up fresh from `conversations` on every render,
  // so it gets a brand-new object reference whenever the list refetches —
  // including for reasons unrelated to this thread (e.g. a message arriving
  // in a different conversation). Depending on the object itself would leave
  // + rejoin this room on every such refresh, opening a window where
  // message:new events for the currently-open thread are missed. Depend on
  // the primitive fields that actually determine which room to join instead.
  const isDealer = conversation?.kind === 'dealer';
  const announcementId = conversation?.announcementId;
  const buyerId = conversation?.buyerId;
  const ownerId = conversation?.ownerId;
  const hasConversation = Boolean(conversation);

  // Join the socket room so message:new events are delivered to this client.
  // Even if the join fails (e.g. chat server not yet restarted), we mark as
  // attempted so the screen still works — message:send uses participant auth
  // on the server and doesn't strictly require room membership to save.
  const doJoin = useCallback(async () => {
    if (!id || !hasConversation || joinedRef.current === id) return;
    // Mark immediately so repeated renders don't call join multiple times.
    joinedRef.current = id;

    try {
      const ack = isDealer
        ? await joinConversationById(id)
        : await joinConversation({
            announcementId: Number(announcementId),
            buyerId: Number(buyerId),
            ownerId: Number(ownerId),
          });

      if (ack.success) {
        setPartnerOnline(Boolean(ack.partnerOnline));
      } else if (__DEV__) {
        console.warn('[chat] conversation join failed:', ack.error);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[chat] doJoin threw:', err);
      }
    }
  }, [id, hasConversation, isDealer, announcementId, buyerId, ownerId, joinConversation, joinConversationById]);

  useEffect(() => {
    if (connected && hasConversation) {
      void doJoin();
    }
    return () => {
      if (joinedRef.current) {
        leaveConversation(joinedRef.current);
        joinedRef.current = null;
      }
    };
  }, [connected, hasConversation, doJoin, leaveConversation]);

  // Keep partnerOnline in sync with presence events when not in the join ack
  useEffect(() => {
    if (partnerId != null) {
      setPartnerOnline(isUserOnline(partnerId));
    }
  }, [partnerId, isUserOnline]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <ChevronLeft color={colors.textSecondary} size={22} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {display?.title ?? t('mobile.chat.conversation')}
          </Text>
          <View style={styles.statusRow}>
            {connected ? (
              <Wifi size={10} color={colors.success} />
            ) : (
              <WifiOff size={10} color={colors.error} />
            )}
            <Text style={styles.statusText}>
              {partnerOnline ? t('chat.online') : t('chat.offline')}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ChatMessageBubble
                message={item}
                isMine={Number(item.senderId) === Number(user?.id)}
              />
            )}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>{t('mobile.chat.no_messages')}</Text>
              </View>
            }
          />
        )}

        {sendError ? (
          <Text style={styles.sendErrorText}>{t('chat.send_failed')}</Text>
        ) : null}

        <ChatInput onSend={handleSend} isSending={isSending} disabled={!connected} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    gap: spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
  },
  messageList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  sendErrorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
