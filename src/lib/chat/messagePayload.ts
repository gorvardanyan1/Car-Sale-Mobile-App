/**
 * Shapes the `message:send` payload.
 *
 * Kept separate from the socket context so the wire contract can be tested:
 * the chat service treats a present-but-invalid `replyToId` as an error rather
 * than ignoring it, so the key has to be *absent* — not null, not empty — when
 * the message is not a reply.
 */
export type SendMessagePayload = {
  conversationId: string;
  text: string;
  replyToId?: string;
};

export function buildSendMessagePayload(
  conversationId: string,
  text: string,
  replyToId?: string | null,
): SendMessagePayload {
  const base: SendMessagePayload = { conversationId, text };

  if (typeof replyToId === 'string' && replyToId.trim() !== '') {
    base.replyToId = replyToId;
  }

  return base;
}
