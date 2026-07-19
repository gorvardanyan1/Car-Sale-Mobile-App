import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'components/create-announcement/CreateAnnouncementWizard.tsx',
  'components/create-announcement/CreateAnnouncementStepDetails.tsx',
  'components/create-announcement/CreateAnnouncementStepPhotos.tsx',
  'components/create-announcement/AnnouncementPriceSuggestionModal.tsx',
  'constants/createAnnouncement.ts',
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

describe('create announcement locale keys', () => {
  const usedKeys = collectKeysFromSources();

  it('collects the AI price suggestion and translation keys from source', () => {
    expect(usedKeys).toContain('announcement.ai_price_suggestion_title');
    expect(usedKeys).toContain('announcement.get_ai_price_suggestion');
    expect(usedKeys).toContain('announcement.use_this_price');
    expect(usedKeys).toContain('announcement.enable_translations');
    expect(usedKeys).toContain('announcement.ai_translate');
    expect(usedKeys).toContain('announcement.store_price_change');
    expect(usedKeys.length).toBeGreaterThan(20);
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every create announcement key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
