import { describe, expect, it, vi } from 'vitest';

import { parseSseStream } from '@/lib/api/parseSseStream';

function createSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let index = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
    },
  });

  return new Response(stream);
}

describe('parseSseStream', () => {
  it('parses data lines and stops on DONE', async () => {
    const payloads: string[] = [];

    await parseSseStream(
      createSseResponse([
        'data: {"content":"Hello"}\n\n',
        'data: {"content":" world"}\n\n',
        'data: [DONE]\n\n',
      ]),
      (payload) => payloads.push(payload),
    );

    expect(payloads).toEqual(['{"content":"Hello"}', '{"content":" world"}']);
  });
});
