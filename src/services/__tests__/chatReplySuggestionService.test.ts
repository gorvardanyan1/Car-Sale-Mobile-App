import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import * as chatReplySuggestionService from '@/services/chatReplySuggestionService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

describe('chatReplySuggestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts only the conversation id and language, returning the drafted reply', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { suggestion: 'Thursday works for me. What time?' },
      meta: {},
    });

    const result = await chatReplySuggestionService.suggestChatReply(
      '65b0f1a2c3d4e5f60718293a',
      'en',
    );

    // The transcript never leaves the server — only the id travels, so the
    // server decides (against the caller's own token) what may be read.
    expect(apiFetch).toHaveBeenCalledWith('/chat/messages/reply-suggestion', {
      method: 'POST',
      auth: true,
      body: { conversation_id: '65b0f1a2c3d4e5f60718293a', language: 'en' },
    });
    expect(result).toBe('Thursday works for me. What time?');
  });

  it('surfaces the server message when the admin has disabled reply suggestions', async () => {
    const { ApiClientError } = await import('@/lib/api/client');
    vi.mocked(apiFetch).mockRejectedValueOnce(
      new ApiClientError(
        'AI reply suggestions are currently disabled by the site administrator.',
        403,
      ),
    );

    await expect(
      chatReplySuggestionService.suggestChatReply('65b0f1a2c3d4e5f60718293a', 'ru'),
    ).rejects.toMatchObject({
      name: 'ChatReplySuggestionApiError',
      message: 'AI reply suggestions are currently disabled by the site administrator.',
      status: 403,
    });
  });

  it('keeps the status when the caller is not a participant of the conversation', async () => {
    const { ApiClientError } = await import('@/lib/api/client');
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiClientError('Forbidden', 403));

    await expect(
      chatReplySuggestionService.suggestChatReply('65b0f1a2c3d4e5f60718293a', 'en'),
    ).rejects.toMatchObject({
      name: 'ChatReplySuggestionApiError',
      status: 403,
    });
  });

  it('maps a rate-limited call to ChatReplySuggestionApiError with the same status', async () => {
    const { ApiClientError } = await import('@/lib/api/client');
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiClientError('Too many requests', 429));

    await expect(
      chatReplySuggestionService.suggestChatReply('65b0f1a2c3d4e5f60718293a', 'am'),
    ).rejects.toMatchObject({
      name: 'ChatReplySuggestionApiError',
      status: 429,
    });
  });

  it('throws when a 2xx response omits the suggestion', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: {}, meta: {} });

    await expect(
      chatReplySuggestionService.suggestChatReply('65b0f1a2c3d4e5f60718293a', 'en'),
    ).rejects.toMatchObject({
      name: 'ChatReplySuggestionApiError',
      message: 'Reply suggestion failed',
    });
  });
});

describe('describeChatReplySuggestionError', () => {
  const FALLBACK = 'Չհաջողվեց առաջարկել պատասխան։ Կրկին փորձեք։';
  const { describeChatReplySuggestionError, ChatReplySuggestionApiError } =
    chatReplySuggestionService;

  it('shows the server copy for a feature the admin switched off', () => {
    const error = new ChatReplySuggestionApiError(
      'AI reply suggestions are currently disabled by the site administrator.',
      403,
    );

    expect(describeChatReplySuggestionError(error, FALLBACK)).toBe(
      'AI reply suggestions are currently disabled by the site administrator.',
    );
  });

  it('shows the server copy for a rate limit and for a stale conversation', () => {
    expect(
      describeChatReplySuggestionError(
        new ChatReplySuggestionApiError('Too many requests', 429),
        FALLBACK,
      ),
    ).toBe('Too many requests');

    expect(
      describeChatReplySuggestionError(
        new ChatReplySuggestionApiError('Conversation not found', 404),
        FALLBACK,
      ),
    ).toBe('Conversation not found');
  });

  /**
   * ApiNetworkError's message embeds the full API URL in an English sentence.
   * Painting that into a chat thread leaks internal detail and ignores the
   * user's language, so it must never reach the UI.
   */
  it('never leaks a network error, URL and all, to the user', async () => {
    class ApiNetworkError extends Error {
      constructor(
        message: string,
        public url: string,
      ) {
        super(message);
        this.name = 'ApiNetworkError';
      }
    }

    const error = new ApiNetworkError(
      'Cannot reach the API server at https://api.example.test/api/v1/chat/messages/reply-suggestion. Check your internet connection and API URL settings.',
      'https://api.example.test/api/v1/chat/messages/reply-suggestion',
    );

    const shown = describeChatReplySuggestionError(error, FALLBACK);

    expect(shown).toBe(FALLBACK);
    expect(shown).not.toContain('https://');
  });

  it('hides 5xx internals behind the localized fallback', () => {
    expect(
      describeChatReplySuggestionError(
        new ChatReplySuggestionApiError('Reply suggestion failed', 500),
        FALLBACK,
      ),
    ).toBe(FALLBACK);

    expect(
      describeChatReplySuggestionError(
        new ChatReplySuggestionApiError('Could not suggest a reply right now.', 502),
        FALLBACK,
      ),
    ).toBe(FALLBACK);
  });

  it('falls back for a blank server message and for a non-Error throw', () => {
    expect(
      describeChatReplySuggestionError(new ChatReplySuggestionApiError('   ', 403), FALLBACK),
    ).toBe(FALLBACK);

    expect(describeChatReplySuggestionError('boom', FALLBACK)).toBe(FALLBACK);
    expect(describeChatReplySuggestionError(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
