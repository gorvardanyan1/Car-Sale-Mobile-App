export type PushNotificationData = {
  type?: string;
  announcement_id?: number | string;
  wanted_search_id?: number | string;
  conversation_id?: string;
};

export function parsePushNotificationData(
  data: Record<string, unknown> | undefined,
): PushNotificationData {
  if (!data) {
    return {};
  }

  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    announcement_id:
      typeof data.announcement_id === 'number' || typeof data.announcement_id === 'string'
        ? data.announcement_id
        : undefined,
    wanted_search_id:
      typeof data.wanted_search_id === 'number' || typeof data.wanted_search_id === 'string'
        ? data.wanted_search_id
        : undefined,
    conversation_id: typeof data.conversation_id === 'string' ? data.conversation_id : undefined,
  };
}
