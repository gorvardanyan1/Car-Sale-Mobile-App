import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'app/settings/wanted-searches.tsx',
  'app/(tabs)/settings.tsx',
  'components/wanted-searches/FeatureAccessBanner.tsx',
  'components/wanted-searches/WantedSearchAlertCard.tsx',
  'components/wanted-searches/WantedMatchCard.tsx',
  'components/wanted-searches/WantedSearchForm.tsx',
];

function collectKeysFromSources(): string[] {
  const keys = new Set<string>();
  const tPattern = /t\(\s*['"]([^'"]+)['"]/g;
  const labelKeyPattern = /labelKey:\s*['"]([^'"]+)['"]/g;

  for (const relativePath of SOURCE_FILES) {
    const source = readFileSync(join(root, relativePath), 'utf8');
    for (const pattern of [tPattern, labelKeyPattern]) {
      for (const match of source.matchAll(pattern)) {
        keys.add(match[1]);
      }
    }
  }

  return [...keys].sort();
}

const locales = { en, ru, am } as const;

describe('wanted searches locale keys', () => {
  const usedKeys = collectKeysFromSources();

  it('collects wanted searches keys from source', () => {
    expect(usedKeys).toContain('wanted_searches.create_title');
    expect(usedKeys).toContain('user.wanted_searches');
    expect(usedKeys.length).toBeGreaterThan(15);
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every wanted searches key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
