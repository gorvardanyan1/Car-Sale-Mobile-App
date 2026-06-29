import { describe, expect, it } from 'vitest';

import { parsePushNotificationData } from '@/lib/notifications/pushNotificationData';

describe('parsePushNotificationData', () => {
  it('parses wanted search match payload', () => {
    expect(
      parsePushNotificationData({
        type: 'wanted_search_match',
        announcement_id: 42,
        wanted_search_id: 7,
      }),
    ).toEqual({
      type: 'wanted_search_match',
      announcement_id: 42,
      wanted_search_id: 7,
    });
  });

  it('returns empty object for missing data', () => {
    expect(parsePushNotificationData(undefined)).toEqual({});
  });
});
