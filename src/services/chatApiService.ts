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

// Every request is HMAC-signed over method+path+timestamp-in-whole-seconds
// (see signRequest.ts), with no per-request nonce or sub-second precision.
// The API rejects a second request with an identical signature as a replay —
// so two GETs to the same no-param endpoint landing in the same wall-clock
// second produce the exact same signature and the later one is rejected,
// *even if they're fully sequential* (not just concurrent — see
// VerifyMobileAppSignature::handle's Cache::add on the raw signature).
// `dedupeAndThrottle` collapses concurrent callers onto one in-flight
// request (fixes the concurrent case) and, once that settles, delays the
// next real request until the clock has ticked into a new second (fixes the
// sequential-but-same-second case) — guaranteeing every request this app
// sends to a given endpoint has a signature the server hasn't seen before.
function dedupeAndThrottle<T>(fetcher: () => Promise<T>) {
  let inFlight: Promise<T> | null = null;
  let lastSentSecond = 0;

  return (): Promise<T> => {
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        const nowSecond = Math.floor(Date.now() / 1000);
        if (nowSecond <= lastSentSecond) {
          const waitMs = (lastSentSecond + 1) * 1000 - Date.now();
          if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
        lastSentSecond = Math.floor(Date.now() / 1000);
        return await fetcher();
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  };
}

/** Fetch all conversations enriched with announcement / dealer data. */
export const fetchConversations = dedupeAndThrottle(async (): Promise<ChatConversation[]> => {
  const res = await apiFetch<ApiResponse<ChatConversation[]>>('/chat/conversations', {
    auth: true,
  });
  return Array.isArray(res.data) ? res.data : [];
});

/** Fetch total unread count for the badge. Route: GET /chat/unread-summary */
export const fetchUnreadSummary = dedupeAndThrottle(async (): Promise<UnreadSummary> => {
  const res = await apiFetch<ApiResponse<UnreadSummary>>('/chat/unread-summary', {
    auth: true,
  });
  return res.data;
});

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
