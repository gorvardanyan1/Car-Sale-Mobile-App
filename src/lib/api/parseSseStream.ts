/**
 * Reads an SSE response body and invokes `onPayload` for each `data:` line payload.
 */
export async function parseSseStream(
  response: Response,
  onPayload: (payload: string) => void,
  options?: { signal?: AbortSignal },
): Promise<void> {
  if (!response.body) {
    throw new Error('Response body is not readable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const abort = () => {
    void reader.cancel();
  };

  options?.signal?.addEventListener('abort', abort, { once: true });

  try {
    while (true) {
      if (options?.signal?.aborted) {
        return;
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');
        if (!line.startsWith('data:')) {
          continue;
        }

        const payload = line.slice(5).trimStart();
        if (payload === '[DONE]') {
          return;
        }

        onPayload(payload);
      }
    }
  } finally {
    options?.signal?.removeEventListener('abort', abort);
  }
}
