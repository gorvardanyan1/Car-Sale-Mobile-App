import { resolveStorageImageUrl } from '@/lib/announcements/formatAnnouncement';
import type { ChatConversation } from '@/types/chat';

const DEALER_CHAT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=120&q=60';

export type DealerConversationDisplay = {
  title: string;
  imageUrl: string | null;
  initials: string;
};

/** Title and avatar for dealer-kind conversations (buyer vs dealer perspective). */
export function getDealerConversationDisplay(
  client: ChatConversation,
  currentUserId: number | null | undefined,
  t: (key: string) => string,
): DealerConversationDisplay {
  const isDealerOwner = Number(currentUserId) === Number(client?.ownerId);

  if (isDealerOwner) {
    const buyerName = client?.buyer?.name?.trim();

    return {
      title: buyerName || t('chat.buyer'),
      imageUrl: null,
      initials: buyerName?.charAt(0)?.toUpperCase() || '?',
    };
  }

  const dealerName = client?.dealer?.name?.trim();
  const logo = client?.dealer?.logo;

  return {
    title: dealerName || t('dealer.message'),
    imageUrl: logo ? resolveStorageImageUrl(logo) : DEALER_CHAT_FALLBACK_IMAGE,
    initials: dealerName?.charAt(0)?.toUpperCase() || '?',
  };
}

export { DEALER_CHAT_FALLBACK_IMAGE };
