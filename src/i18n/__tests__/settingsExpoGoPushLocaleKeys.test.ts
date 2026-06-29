import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const KEYS = [
  'mobile.settings.expo_go_push_title',
  'mobile.settings.expo_go_push_message',
] as const;

describe('settings expo go push locale keys', () => {
  it.each(KEYS)('defines %s in all locales', (key) => {
    expect(en[key]).toBeTruthy();
    expect(ru[key]).toBeTruthy();
    expect(am[key]).toBeTruthy();
  });
});
