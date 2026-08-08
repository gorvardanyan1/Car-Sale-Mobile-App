import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import * as chatTranslateService from '@/services/chatTranslateService';

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

describe('chatTranslateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the message text and target language, returning the translated text', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { translated_text: 'Բարև Ձեզ', target_language: 'am' },
      meta: {},
    });

    const result = await chatTranslateService.translateChatMessage('Hello there', 'am');

    expect(apiFetch).toHaveBeenCalledWith('/chat/messages/translate', {
      method: 'POST',
      auth: true,
      body: { text: 'Hello there', target_language: 'am' },
    });
    expect(result).toBe('Բարև Ձեզ');
  });

  it('surfaces the server message when the admin has disabled chat translation', async () => {
    const { ApiClientError } = await import('@/lib/api/client');
    vi.mocked(apiFetch).mockRejectedValueOnce(
      new ApiClientError(
        'Chat message translation is currently disabled by the site administrator.',
        403,
      ),
    );

    await expect(
      chatTranslateService.translateChatMessage('Hello there', 'ru'),
    ).rejects.toMatchObject({
      name: 'ChatTranslateApiError',
      message: 'Chat message translation is currently disabled by the site administrator.',
      status: 403,
    });
  });

  it('throws when a 2xx response omits translated_text', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: {}, meta: {} });

    await expect(
      chatTranslateService.translateChatMessage('Hello there', 'ru'),
    ).rejects.toMatchObject({
      name: 'ChatTranslateApiError',
      message: 'Translation failed',
    });
  });

  it('maps ApiClientError (e.g. rate limit) to ChatTranslateApiError with the same status', async () => {
    const { ApiClientError } = await import('@/lib/api/client');
    vi.mocked(apiFetch).mockRejectedValueOnce(new ApiClientError('Too many requests', 429));

    await expect(
      chatTranslateService.translateChatMessage('Hello there', 'en'),
    ).rejects.toMatchObject({
      name: 'ChatTranslateApiError',
      status: 429,
    });
  });
});
