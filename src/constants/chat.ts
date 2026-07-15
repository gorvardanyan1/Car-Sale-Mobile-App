/**
 * Base URL for the Socket.io / chat REST server (car-shop-chat-app).
 * Set EXPO_PUBLIC_CHAT_URL in .env to your local or production chat server.
 *
 * Example: EXPO_PUBLIC_CHAT_URL=http://192.168.0.109:3000
 */
import { readPublicEnv } from '@/lib/env/publicEnv';

const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production';

const configuredChatUrl = (readPublicEnv('EXPO_PUBLIC_CHAT_URL') ?? '').replace(/\/$/, '');

if (!isDev && !configuredChatUrl) {
  // Falling back to localhost in a shipped build means chat can never
  // connect for any real user — fail loudly at startup instead of quietly
  // trying (and failing) to reach a socket server that only exists on a
  // developer's machine.
  throw new Error(
    '[chat] EXPO_PUBLIC_CHAT_URL is not set in this production build. Refusing to fall back to localhost.',
  );
}

if (!isDev && configuredChatUrl && !/^(https|wss):\/\//i.test(configuredChatUrl)) {
  console.warn(
    `[chat] EXPO_PUBLIC_CHAT_URL ("${configuredChatUrl}") does not use a secure scheme (https/wss). ` +
      'Chat traffic, including the session auth token, would be sent unencrypted.',
  );
}

export const CHAT_URL: string = configuredChatUrl || 'http://localhost:3000';
