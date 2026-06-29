import { describe, expect, it } from 'vitest';

import { formatEngineTypeLabel, shouldHideEngineCapacity } from '@/lib/announcements/engineType';

describe('engineType helpers', () => {
  const t = ((key: string) => key) as never;

  it('formats known engine types via i18n keys', () => {
    expect(formatEngineTypeLabel(t, 'petrol')).toBe('announcement.engine_type.petrol');
    expect(formatEngineTypeLabel(t, 'electro')).toBe('announcement.engine_type.electro');
  });

  it('returns dash for empty values', () => {
    expect(formatEngineTypeLabel(t, null)).toBe('—');
    expect(formatEngineTypeLabel(t, '')).toBe('—');
  });

  it('hides engine capacity for electric listings', () => {
    expect(shouldHideEngineCapacity('electro', [])).toBe(true);
    expect(shouldHideEngineCapacity('petrol', ['engine_capacity'])).toBe(true);
    expect(shouldHideEngineCapacity('petrol', [])).toBe(false);
  });
});
