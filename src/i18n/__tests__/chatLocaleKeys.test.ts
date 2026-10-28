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
  'mobile.chat.typing',
  'mobile.chat.replying_to',
  'mobile.chat.cancel_reply',
  'mobile.chat.voice_record',
  'mobile.chat.voice_send',
  'mobile.chat.voice_cancel',
  'mobile.chat.voice_play',
  'mobile.chat.voice_pause',
  'mobile.chat.voice_failed',
  'mobile.chat.voice_permission_title',
  'mobile.chat.voice_permission_body',
  'mobile.chat.unread_count',
  'mobile.chat.connected',
  'mobile.chat.disconnected',
  'mobile.chat.delete_title',
  'mobile.chat.delete_confirm',
  'mobile.chat.translate',
  'mobile.chat.translating',
  'mobile.chat.show_original',
  'mobile.chat.translate_failed',
  'mobile.chat.select_language',
  'mobile.chat.suggest_reply',
  'mobile.chat.suggesting_reply',
  'mobile.chat.suggest_reply_hint',
  'mobile.chat.suggest_reply_failed',
  // Language names shown in the chat translate picker.
  'mobile.settings.language_en',
  'mobile.settings.language_am',
  'mobile.settings.language_ru',
  'chat.online',
  'chat.offline',
  'chat.buyer',
  'chat.listing_title',
  'chat.send_failed',
  'chat.you',
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
