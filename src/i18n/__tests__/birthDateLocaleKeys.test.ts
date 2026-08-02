import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const KEYS = ['profile.birth_date', 'mobile.errors.invalid_birth_date'] as const;

describe('birth date locale keys', () => {
  it.each(KEYS)('defines %s in all locales', (key) => {
    expect(en[key]).toBeTruthy();
    expect(ru[key]).toBeTruthy();
    expect(am[key]).toBeTruthy();
  });

  it.each(KEYS)('does not leave %s untranslated in ru/am', (key) => {
    expect(ru[key]).not.toBe(en[key]);
    expect(am[key]).not.toBe(en[key]);
  });
});
