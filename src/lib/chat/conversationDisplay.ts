import { resolveStorageImageUrl } from '@/lib/announcements/formatAnnouncement';
import type { ChatConversation } from '@/types/chat';

type ConversationDisplay = {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  initials: string;
};

/**
 * Compute display title, subtitle, image, and initials for a conversation.
 * Handles both announcement-based and dealer-based conversations.
 */
export function getConversationDisplay(
  conv: ChatConversation,
  currentUserId: number | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
): ConversationDisplay {
  const kind = conv.kind ?? 'announcement';

  if (kind === 'dealer') {
    const isDealerOwner = Number(currentUserId) === Number(conv.ownerId);

    if (isDealerOwner) {
      const name = conv.buyer?.name?.trim() || t('chat.buyer');
      return {
        title: name,
        subtitle: t('chat.listing_title'),
        imageUrl: null,
        initials: name.charAt(0).toUpperCase() || '?',
      };
    }

    const dealerName = conv.dealer?.name?.trim() || t('dealer.message');
    const logo = conv.dealer?.logo;

    return {
      title: dealerName,
      subtitle: t('chat.listing_title'),
      imageUrl: logo ? resolveStorageImageUrl(logo) : null,
      initials: dealerName.charAt(0).toUpperCase() || '?',
    };
  }

  // Announcement conversation
  const ann = conv.announcement;
  const brandModel =
    (ann?.car_brand?.brand?.trim() && ann?.car_model?.model?.trim())
      ? `${ann.car_brand.brand} ${ann.car_model.model}`
      : t('chat.listing_title');

  const imageUrl = ann?.main_image_path ? resolveStorageImageUrl(ann.main_image_path) : null;
  const initials = brandModel.charAt(0).toUpperCase();

  return {
    title: brandModel,
    subtitle: t('chat.listing_title'),
    imageUrl,
    initials,
  };
}

/** Format a relative time string (e.g. "2m", "1h", "3d"). */
export function formatChatTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
