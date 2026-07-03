export type ChatMessageShape = {
  _id: string;
  conversationId: string;
  senderId: number;
  receiverId: number;
  text: string;
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
