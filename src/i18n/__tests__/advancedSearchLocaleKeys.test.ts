import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'components/announcements/AdvancedSearchModal.tsx',
  'app/(tabs)/index.tsx',
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

describe('advanced search locale keys', () => {
  const usedKeys = collectKeysFromSources().filter((key) => key.startsWith('search.'));

  it('collects the advanced search keys from source', () => {
    expect(usedKeys).toContain('search.advanced');
    expect(usedKeys).toContain('search.all_words');
    expect(usedKeys).toContain('search.any_words');
    expect(usedKeys).toContain('search.none_words');
    expect(usedKeys).toContain('search.author');
    expect(usedKeys.length).toBeGreaterThanOrEqual(15);
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every advanced search key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });

    it(`has no empty advanced search translations in ${localeName}`, () => {
      const empty = usedKeys.filter((key) => !String(dictionary[key as keyof typeof dictionary] ?? '').trim());
      expect(empty, `Empty in ${localeName}: ${empty.join(', ')}`).toEqual([]);
    });
  }
});
