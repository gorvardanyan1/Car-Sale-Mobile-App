import type { ChatConversation } from '@/types/chat';

/** Other participant in a buyer/owner conversation. */
export function getChatPartnerId(
  conversation: ChatConversation | null | undefined,
  currentUserId: number | null | undefined,
): number | null {
  if (!conversation || currentUserId == null) {
    return null;
  }

  const buyerId = Number(conversation.buyerId);
  const ownerId = Number(conversation.ownerId);
  const me = Number(currentUserId);

  if (me === buyerId) {
    return ownerId;
  }

  if (me === ownerId) {
    return buyerId;
  }

  const fromParticipants = (conversation.participants ?? []).find((id) => Number(id) !== me);

  return fromParticipants != null ? Number(fromParticipants) : null;
}
