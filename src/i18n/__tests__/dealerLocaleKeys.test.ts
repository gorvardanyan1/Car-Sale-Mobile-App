import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const KEYS = [
  'dealer.directory_title',
  'dealer.view_profile',
  'dealer.message',
  'mobile.list.browse_dealers',
] as const;

describe('dealer locale keys', () => {
  it.each(KEYS)('defines %s in all locales', (key) => {
    expect(en[key]).toBeTruthy();
    expect(ru[key]).toBeTruthy();
    expect(am[key]).toBeTruthy();
  });
});
