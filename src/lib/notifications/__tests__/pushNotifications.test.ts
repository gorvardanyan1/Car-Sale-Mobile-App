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

  it('parses chat message payload', () => {
    expect(
      parsePushNotificationData({
        type: 'chat_message',
        conversation_id: '6a5697756c85a06ee8d61c3c',
        sender_id: 9,
      }),
    ).toEqual({
      type: 'chat_message',
      conversation_id: '6a5697756c85a06ee8d61c3c',
    });
  });

  it('returns empty object for missing data', () => {
    expect(parsePushNotificationData(undefined)).toEqual({});
  });
});
