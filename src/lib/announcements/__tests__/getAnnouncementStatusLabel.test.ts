import { describe, expect, it } from 'vitest';

import { getAnnouncementStatusLabel } from '@/lib/announcements/getAnnouncementStatusLabel';

describe('getAnnouncementStatusLabel', () => {
  const t = ((key: string) => key) as never;

  it('maps known statuses to i18n keys', () => {
    expect(getAnnouncementStatusLabel('active', t)).toBe('status.active');
    expect(getAnnouncementStatusLabel('sold', t)).toBe('status.sold');
  });

  it('returns dash for empty status', () => {
    expect(getAnnouncementStatusLabel(null, t)).toBe('—');
  });
});
