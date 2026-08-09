import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'app/(auth)/login.tsx',
  'app/(auth)/register.tsx',
  'components/auth/GoogleSignInButton.tsx',
];

function collectKeysFromSources(): string[] {
  const keys = new Set<string>();
  const tPattern = /t\(\s*['"]([^'"]+)['"]/g;

  for (const relativePath of SOURCE_FILES) {
    const source = readFileSync(join(root, relativePath), 'utf8');
    for (const match of source.matchAll(tPattern)) {
      keys.add(match[1]);
    }
  }

  return [...keys].sort();
}

const locales = { en, ru, am } as const;

describe('google auth locale keys', () => {
  const usedKeys = collectKeysFromSources();

  it('collects the Google sign-in keys from the auth screens', () => {
    expect(usedKeys).toContain('auth.continue_with_google');
    expect(usedKeys).toContain('auth.or_continue_with_email');
    expect(usedKeys).toContain('mobile.errors.google_sign_in_failed');
    expect(usedKeys).toContain('mobile.errors.google_unavailable');
    expect(usedKeys).toContain('mobile.errors.registration_closed');
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every auth-screen key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
