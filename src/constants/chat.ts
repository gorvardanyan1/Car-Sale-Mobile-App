/**
 * Base URL for the Socket.io / chat REST server (car-shop-chat-app).
 * Set EXPO_PUBLIC_CHAT_URL in .env to your local or production chat server.
 *
 * Example: EXPO_PUBLIC_CHAT_URL=http://192.168.0.109:3000
 */
import { readPublicEnv } from '@/lib/env/publicEnv';

export const CHAT_URL: string =
  (readPublicEnv('EXPO_PUBLIC_CHAT_URL') ?? '').replace(/\/$/, '') || 'http://localhost:3000';
