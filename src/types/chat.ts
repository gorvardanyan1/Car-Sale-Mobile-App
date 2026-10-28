/**
 * Snapshot of the message a reply quotes. Built and truncated server-side
 * (car-shop-chat-app lib/reply.ts) and stored on the reply, so it renders even
 * when the original is outside the loaded page.
 */
export type ChatReplySnapshot = {
  messageId: string;
  senderId: number;
  text: string;
};

/** Public metadata of a voice recording; the audio itself is fetched on demand. */
export type ChatVoiceAudio = {
  mimeType: string;
  durationMs: number;
  size: number;
};

export type ChatMessageShape = {
  _id: string;
  conversationId: string;
  senderId: number;
  receiverId: number;
  text: string;
  /** Absent on messages from before voice support — treat as 'text'. */
  type?: 'text' | 'voice';
  audio?: ChatVoiceAudio | null;
  replyTo?: ChatReplySnapshot | null;
  isRead: boolean;
  createdAt: string | Date;
};

export type ConversationLastMessage = {
  text: string;
  senderId: number;
  createdAt: string | Date;
};

export type ConversationAnnouncement = {
  id: number;
  main_image_path: string | null;
  car_brand?: { id: number; brand: string } | null;
  car_model?: { id: number; model: string } | null;
  user_id: number;
};

export type ConversationDealer = {
  id: number;
  name: string;
  logo: string | null;
};

export type ConversationBuyer = {
  id: number;
  name: string;
};

export type ChatConversation = {
  _id: string;
  announcementId: number;
  buyerId: number;
  ownerId: number;
  participants: number[];
  lastMessage?: ConversationLastMessage | null;
  unreadCount: number;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  /** kind === 'dealer' for dealer-initiated chats */
  kind?: 'announcement' | 'dealer';
  announcement?: ConversationAnnouncement | null;
  dealer?: ConversationDealer | null;
  buyer?: ConversationBuyer | null;
};

export type UnreadSummary = {
  totalUnread: number;
};

/**
 * Admin-configurable chat settings (Settings → Chat in the web admin).
 *
 * Delivered alongside the chat token — the mobile app has no equivalent of the
 * web's shared Inertia props, and the token is fetched at exactly the moments
 * these need to be current. Every flag is also enforced server-side; honouring
 * them here is presentation, not the security boundary.
 */
export type ChatClientSettings = {
  enabled: boolean;
  dealerChatEnabled: boolean;
  translationEnabled: boolean;
  replySuggestionsEnabled: boolean;
  emojiPickerEnabled: boolean;
  typingIndicatorEnabled: boolean;
  presenceEnabled: boolean;
  messageMaxLength: number;
};

/** Used until the server answers, and whenever it omits a field. */
export const CHAT_SETTINGS_DEFAULTS: ChatClientSettings = {
  enabled: true,
  dealerChatEnabled: true,
  translationEnabled: true,
  replySuggestionsEnabled: true,
  emojiPickerEnabled: true,
  typingIndicatorEnabled: true,
  presenceEnabled: true,
  messageMaxLength: 4000,
};

export type ChatSession = {
  token: string;
  settings: ChatClientSettings;
};
