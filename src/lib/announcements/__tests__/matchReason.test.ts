import { describe, expect, it } from 'vitest';

import { formatMatchReasonLabel, parseMatchReason } from '@/lib/announcements/matchReason';

describe('matchReason helpers', () => {
  const t = ((key: string) => key) as never;

  it('parses a plain reason key with no value', () => {
    expect(parseMatchReason('same_model')).toEqual({ key: 'same_model', value: null });
  });

  it('parses a "key:value" reason into its parts', () => {
    expect(parseMatchReason('same_transmission:automatic')).toEqual({
      key: 'same_transmission',
      value: 'automatic',
    });
  });

  it('formats a plain reason as just its translated label', () => {
    expect(formatMatchReasonLabel(t, 'same_model')).toBe('announcement.similar.reason.same_model');
  });

  it('appends the capitalized value for a same_transmission reason', () => {
    expect(formatMatchReasonLabel(t, 'same_transmission:automatic')).toBe(
      'announcement.similar.reason.same_transmission (Automatic)',
    );
  });

  it('formats the engine type value through the shared engine-type translator', () => {
    expect(formatMatchReasonLabel(t, 'same_engine_type:diesel')).toBe(
      'announcement.similar.reason.same_engine_type (announcement.engine_type.diesel)',
    );
  });
});
