import { apiFetch, ApiClientError } from '@/lib/api/client';
import type { SupportedLanguage } from '@/i18n';
import type { ApiResponse } from '@/types';

export class ChatTranslateApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ChatTranslateApiError';
  }
}

type TranslateChatMessagePayload = {
  translated_text?: string;
  target_language?: string;
};

export async function translateChatMessage(
  text: string,
  targetLanguage: SupportedLanguage,
): Promise<string> {
  try {
    const response = await apiFetch<ApiResponse<TranslateChatMessagePayload>>(
      '/chat/messages/translate',
      {
        method: 'POST',
        auth: true,
        body: { text, target_language: targetLanguage },
      },
    );

    // Failures arrive as non-2xx and are raised by apiFetch as ApiClientError,
    // so reaching here without text means an unexpectedly shaped 200.
    if (!response.data?.translated_text) {
      throw new ChatTranslateApiError('Translation failed', 500);
    }

    return response.data.translated_text;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new ChatTranslateApiError(error.message, error.status);
    }

    throw error;
  }
}
