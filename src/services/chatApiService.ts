import { apiFetch } from '@/lib/api/client';
import type { ApiResponse } from '@/types';
import type { ChatConversation, ChatMessageShape, UnreadSummary } from '@/types/chat';

/**
 * Fetch a short-lived chat JWT from Laravel.
 * This token is used to authenticate with the Socket.io server directly.
 */
export async function fetchChatToken(): Promise<string> {
  const res = await apiFetch<ApiResponse<{ token: string }>>('/chat/token', { auth: true });
  return res.data.token;
}

/** Fetch all conversations enriched with announcement / dealer data. */
export async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await apiFetch<ApiResponse<ChatConversation[]>>('/chat/conversations', {
    auth: true,
  });
  return Array.isArray(res.data) ? res.data : [];
}

/** Fetch total unread count for the badge. Route: GET /chat/unread-summary */
export async function fetchUnreadSummary(): Promise<UnreadSummary> {
  const res = await apiFetch<ApiResponse<UnreadSummary>>('/chat/unread-summary', {
    auth: true,
  });
  return res.data;
}

/** Fetch messages for a conversation (ordered oldest→newest). */
export async function fetchMessages(conversationId: string): Promise<ChatMessageShape[]> {
  const res = await apiFetch<ApiResponse<ChatMessageShape[]>>(
    `/chat/messages?conversationId=${encodeURIComponent(conversationId)}`,
    { auth: true },
  );
  return Array.isArray(res.data) ? res.data : [];
}

/** Create / find a conversation for an announcement. */
export async function addConversation(announcementId: number): Promise<void> {
  await apiFetch<ApiResponse<unknown>>('/chat/conversations/add', {
    method: 'POST',
    auth: true,
    body: { announcementId },
  });
}

/** Create / find a dealer conversation. */
export async function addDealerConversation(ownerId: number): Promise<void> {
  await apiFetch<ApiResponse<unknown>>('/chat/conversations/add-dealer', {
    method: 'POST',
    auth: true,
    body: { ownerId },
  });
}

/** Mark all messages in a conversation as read (REST fallback). */
export async function markConversationReadRest(conversationId: string): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(`/chat/conversations/${conversationId}/read`, {
    method: 'POST',
    auth: true,
  });
}

/** Permanently delete a conversation and all its messages. */
export async function deleteConversation(conversationId: string): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(`/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    auth: true,
  });
}
