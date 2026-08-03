import { apiFetch, ApiClientError } from '@/lib/api/client';
import type { SupportedLanguage } from '@/i18n';

export class ChatTranslateApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ChatTranslateApiError';
  }
}

type TranslateChatMessageResponse = {
  success: boolean;
  translated_text?: string;
  target_language?: string;
  message?: string;
};

export async function translateChatMessage(
  text: string,
  targetLanguage: SupportedLanguage,
): Promise<string> {
  try {
    const response = await apiFetch<TranslateChatMessageResponse>('/chat/messages/translate', {
      method: 'POST',
      auth: true,
      body: { text, target_language: targetLanguage },
    });

    if (!response.success || !response.translated_text) {
      throw new ChatTranslateApiError(response.message ?? 'Translation failed', 500);
    }

    return response.translated_text;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new ChatTranslateApiError(error.message, error.status);
    }

    throw error;
  }
}
