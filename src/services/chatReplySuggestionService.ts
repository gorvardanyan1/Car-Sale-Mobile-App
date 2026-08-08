import { apiFetch, ApiClientError } from '@/lib/api/client';
import type { SupportedLanguage } from '@/i18n';
import type { ApiResponse } from '@/types';

export class ChatReplySuggestionApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ChatReplySuggestionApiError';
  }
}

type ReplySuggestionPayload = {
  suggestion?: string;
};

/**
 * The error text that may be shown to the user, or the caller's localized
 * fallback.
 *
 * Only server-authored 4xx copy says something the user can act on — the
 * feature being switched off, a rate limit, a conversation that no longer
 * exists. Everything else is internal detail: `ApiNetworkError` in particular
 * carries the full API URL in an English sentence, which has no business being
 * painted into a chat thread whose UI may be Armenian or Russian.
 */
export function describeChatReplySuggestionError(error: unknown, fallback: string): string {
  if (!(error instanceof ChatReplySuggestionApiError)) {
    return fallback;
  }

  if (error.status < 400 || error.status >= 500) {
    return fallback;
  }

  return error.message.trim() || fallback;
}

/**
 * Ask the server for an AI draft of the next message in a conversation.
 *
 * Only the conversation id travels: the transcript is read server-side with the
 * caller's own chat token, so a suggestion can never be produced for a thread
 * the user is not a participant of.
 */
export async function suggestChatReply(
  conversationId: string,
  language: SupportedLanguage,
): Promise<string> {
  try {
    const response = await apiFetch<ApiResponse<ReplySuggestionPayload>>(
      '/chat/messages/reply-suggestion',
      {
        method: 'POST',
        auth: true,
        body: { conversation_id: conversationId, language },
      },
    );

    // Failures arrive as non-2xx and are raised by apiFetch as ApiClientError,
    // so reaching here without a suggestion means an unexpectedly shaped 200.
    if (!response.data?.suggestion) {
      throw new ChatReplySuggestionApiError('Reply suggestion failed', 500);
    }

    return response.data.suggestion;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new ChatReplySuggestionApiError(error.message, error.status);
    }

    throw error;
  }
}
