import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Trash2 } from 'lucide-react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ConversationListItem } from '@/components/chat/ConversationListItem';
import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal';
import { useConversations } from '@/hooks/useConversations';
import { useChatSocket } from '@/contexts/ChatSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, typography } from '@/theme';
import type { ChatConversation } from '@/types/chat';

export default function MessagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { totalUnread, connected } = useChatSocket();
  const { conversations, isLoading, error, refresh, remove } = useConversations();
  const [deleteTarget, setDeleteTarget] = useState<ChatConversation | null>(null);

  const handlePress = useCallback(
    (conv: ChatConversation) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push({ pathname: '/chat/[id]' as any, params: { id: conv._id } });
    },
    [router],
  );

  const handleLongPress = useCallback((conv: ChatConversation) => {
    setDeleteTarget(conv);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      void remove(deleteTarget._id);
    }
    setDeleteTarget(null);
  }, [deleteTarget, remove]);

  const subtitle = totalUnread > 0
    ? t('mobile.chat.unread_count', { count: totalUnread })
    : connected
      ? t('mobile.chat.connected')
      : t('mobile.chat.disconnected');

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <ScreenHeader
          title={t('mobile.messages.title')}
          subtitle={subtitle}
        />
        {!connected ? <View style={styles.offlineDot} /> : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <MessageCircle color={colors.textDisabled} size={48} />
          <Text style={styles.emptyTitle}>{t('mobile.chat.no_conversations')}</Text>
          <Text style={styles.emptySubtitle}>{t('mobile.chat.no_conversations_hint')}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              currentUserId={user?.id ?? null}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={refresh}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ConfirmActionModal
        visible={deleteTarget != null}
        tone="danger"
        icon={Trash2}
        title={t('mobile.chat.delete_title')}
        message={t('mobile.chat.delete_confirm')}
        confirmLabel={t('common.delete')}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  offlineDot: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
