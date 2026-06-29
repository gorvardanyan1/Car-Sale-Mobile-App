import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'app/settings/billing.tsx',
  'app/(tabs)/settings.tsx',
  'components/billing/BillingTabSwitcher.tsx',
  'components/billing/BillingTransactionCard.tsx',
  'components/billing/BillingSubscriptionCard.tsx',
  'components/billing/CancelSubscriptionModal.tsx',
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

describe('billing locale keys', () => {
  const usedKeys = collectKeysFromSources();

  it('collects billing keys from source', () => {
    expect(usedKeys).toContain('billing.title');
    expect(usedKeys).toContain('user.billing');
  });

  for (const [localeName, dictionary] of Object.entries(locales)) {
    it(`defines every billing key in ${localeName}`, () => {
      const missing = usedKeys.filter((key) => !(key in dictionary));
      expect(missing, `Missing in ${localeName}: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
