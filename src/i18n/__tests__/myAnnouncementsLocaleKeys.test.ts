import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'app/settings/my-announcements.tsx',
  'components/my-announcements/MyAnnouncementCard.tsx',
  'components/my-announcements/MyAnnouncementsStatsGrid.tsx',
  'constants/myAnnouncements.ts',
  'lib/announcements/getAnnouncementStatusLabel.ts',
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

describe('my announcements locale keys', () => {
  const usedKeys = collectKeysFromSources();

  it('collects the expected my announcements keys from source', () => {
    expect(usedKeys).toContain('my_announcements.title');
    expect(usedKeys).toContain('my_announcements.sort.newest');
    expect(usedKeys.length).toBeGreaterThan(20);
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every my announcements key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
