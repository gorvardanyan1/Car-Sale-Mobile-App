import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'components/announcements/SimilarAnnouncementCard.tsx',
  'components/announcements/SimilarAnnouncementsSection.tsx',
  'lib/announcements/matchReason.ts',
];

function collectKeysFromSources(): string[] {
  const keys = new Set<string>();
  // Word-boundary before `t(` and quote-only (no backtick) avoids false
  // positives like the `t` in `reason.split(':')` and the unresolved
  // `${key}` interpolation inside the one template-literal t() call.
  const tPattern = /\bt\(\s*['"]([^'"]+)['"]/g;

  for (const relativePath of SOURCE_FILES) {
    const source = readFileSync(join(root, relativePath), 'utf8');
    for (const match of source.matchAll(tPattern)) {
      keys.add(match[1]);
    }
  }

  // formatMatchReasonLabel builds its translation key dynamically
  // (`announcement.similar.reason.${key}`) rather than as a string literal,
  // so the static regex above can't see it — list the reason keys the
  // backend can emit explicitly (see AnnouncementService::scoreSimilarCandidate).
  const dynamicReasonKeys = [
    'same_model',
    'same_brand',
    'same_body_type',
    'similar_price',
    'similar_year',
    'same_engine_type',
    'same_transmission',
    'nearby',
  ];
  for (const reasonKey of dynamicReasonKeys) {
    keys.add(`announcement.similar.reason.${reasonKey}`);
  }

  return [...keys].sort();
}

const locales = { en, ru, am } as const;

describe('similar announcements locale keys', () => {
  const usedKeys = collectKeysFromSources();

  it('collects the expected similar-announcements keys from source', () => {
    expect(usedKeys).toContain('announcement.similar.title');
    expect(usedKeys).toContain('announcement.similar.subtitle');
    expect(usedKeys).toContain('announcement.similar.match_score');
    expect(usedKeys).toContain('announcement.similar.reason.same_model');
    expect(usedKeys).toContain('announcement.similar.reason.nearby');
    expect(usedKeys.length).toBeGreaterThan(10);
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every similar-announcements key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
