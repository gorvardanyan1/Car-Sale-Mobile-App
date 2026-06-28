import { config } from '@/constants/config';
import { ApiClientError } from '@/lib/api/client';
import { parseSseStream } from '@/lib/api/parseSseStream';

export type AiSupportConfig = {
  popular_questions: string[];
};

export type StreamAiSupportChatOptions = {
  signal?: AbortSignal;
};

export async function fetchAiSupportConfig(): Promise<AiSupportConfig> {
  const response = await fetch(`${config.apiRootUrl}/ai-support/config`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new ApiClientError('Failed to load AI support config.', response.status);
  }

  const data = (await response.json()) as AiSupportConfig;

  return {
    popular_questions: Array.isArray(data.popular_questions) ? data.popular_questions : [],
  };
}

export async function streamAiSupportChat(
  message: string,
  onChunk: (content: string) => void,
  options: StreamAiSupportChatOptions = {},
): Promise<void> {
  const response = await fetch(`${config.apiRootUrl}/ai-support/chat`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
    signal: options.signal,
  });

  if (!response.ok) {
    let errorMessage = 'AI support request failed.';
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        errorMessage = payload.message;
      }
    } catch {
      // Keep default message when body is not JSON.
    }

    throw new ApiClientError(errorMessage, response.status);
  }

  await parseSseStream(
    response,
    (payload) => {
      try {
        const parsed = JSON.parse(payload) as { content?: string };
        if (parsed.content) {
          onChunk(parsed.content);
        }
      } catch {
        // Ignore malformed SSE chunks.
      }
    },
    { signal: options.signal },
  );
}
