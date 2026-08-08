import { describe, expect, it } from 'vitest';

import { buildSendMessagePayload } from '@/lib/chat/messagePayload';

const CONVERSATION_ID = '64b7f0c2c2a4e11111111111';
const MESSAGE_ID = '64b7f0c2c2a4e1aaaaaaaaaa';

describe('buildSendMessagePayload', () => {
  it('includes replyToId when replying', () => {
    expect(buildSendMessagePayload(CONVERSATION_ID, 'Thursday works', MESSAGE_ID)).toEqual({
      conversationId: CONVERSATION_ID,
      text: 'Thursday works',
      replyToId: MESSAGE_ID,
    });
  });

  it('omits the key entirely for a plain message', () => {
    const payload = buildSendMessagePayload(CONVERSATION_ID, 'Hello');

    expect(payload).toEqual({ conversationId: CONVERSATION_ID, text: 'Hello' });
    // Not just undefined — the key must not be present at all, because the
    // service rejects a present-but-unusable replyToId instead of ignoring it.
    expect('replyToId' in payload).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace', '   '],
  ])('omits the key when replyToId is %s', (_label, value) => {
    const payload = buildSendMessagePayload(CONVERSATION_ID, 'Hello', value as string | null);

    expect('replyToId' in payload).toBe(false);
  });

  it('does not trim or otherwise rewrite the text — that is the caller\'s job', () => {
    expect(buildSendMessagePayload(CONVERSATION_ID, '  spaced  ').text).toBe('  spaced  ');
  });

  it('passes the reply id through untouched so the server sees exactly what was picked', () => {
    const payload = buildSendMessagePayload(CONVERSATION_ID, 'ok', `  ${MESSAGE_ID}  `);

    expect(payload.replyToId).toBe(`  ${MESSAGE_ID}  `);
  });
});
