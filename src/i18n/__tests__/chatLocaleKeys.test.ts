import { describe, expect, it } from 'vitest';

import { en } from '../locales/en';
import { ru } from '../locales/ru';
import { am } from '../locales/am';

const REQUIRED_KEYS = [
  'mobile.chat.type_message',
  'mobile.chat.conversation',
  'mobile.chat.no_conversations',
  'mobile.chat.no_conversations_hint',
  'mobile.chat.no_messages',
  'mobile.chat.unread_count',
  'mobile.chat.connected',
  'mobile.chat.disconnected',
  'mobile.chat.delete_title',
  'mobile.chat.delete_confirm',
  'chat.online',
  'chat.offline',
  'chat.buyer',
  'chat.listing_title',
  'chat.send_failed',
] as const;

const locales = { en, ru, am } as const;

describe('chat locale keys', () => {
  for (const [localeName, dict] of Object.entries(locales)) {
    it(`defines all required chat keys in ${localeName}`, () => {
      const missing = REQUIRED_KEYS.filter((key) => !(key in dict));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
