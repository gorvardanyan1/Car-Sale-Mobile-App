import { describe, expect, it } from 'vitest';

import { buildArchiveAiFilterChips } from '@/lib/announcements/buildArchiveAiFilterChips';

describe('buildArchiveAiFilterChips', () => {
  const t = (key: string) => key;

  it('returns empty array for empty filters', () => {
    expect(buildArchiveAiFilterChips({}, t)).toEqual([]);
  });

  it('builds chips for parsed AI filters', () => {
    const chips = buildArchiveAiFilterChips(
      {
        brand: 'Mercedes',
        model: 'C230',
        max_price: 9800,
        year: 2018,
      },
      t,
      '$',
    );

    expect(chips).toEqual([
      'archive.ai.filter_brand: Mercedes',
      'archive.ai.filter_model: C230',
      'archive.ai.filter_max_price: 9,800 $',
      'archive.ai.filter_year: 2018',
    ]);
  });
});
