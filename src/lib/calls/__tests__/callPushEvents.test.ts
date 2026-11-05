import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetCallPushEvents,
  callActionFromResponse,
  publishCallPushEvent,
  subscribeCallPushEvents,
  type CallPushEvent,
} from '@/lib/calls/callPushEvents';
import { parsePushNotificationData } from '@/lib/notifications/pushNotificationData';

const event = (overrides: Partial<CallPushEvent> = {}): CallPushEvent => ({
  callId: '64b7f0c2c2a4e1eeeeeeeeee',
  conversationId: '64b7f0c2c2a4e11111111111',
  callType: 'video',
  action: 'open',
  ...overrides,
});

beforeEach(() => {
  __resetCallPushEvents();
});

describe('callPushEvents', () => {
  it('holds a cold-start tap until the call provider subscribes, then delivers it once', () => {
    publishCallPushEvent(event({ action: 'accept' }));

    const first = vi.fn();
    subscribeCallPushEvents(first);
    expect(first).toHaveBeenCalledWith(event({ action: 'accept' }));

    const second = vi.fn();
    subscribeCallPushEvents(second);
    expect(second).not.toHaveBeenCalled();
  });

  it('keeps only the newest pending tap', () => {
    publishCallPushEvent(event({ callId: 'aaaaaaaaaaaaaaaaaaaaaaaa' }));
    publishCallPushEvent(event({ callId: 'bbbbbbbbbbbbbbbbbbbbbbbb' }));

    const listener = vi.fn();
    subscribeCallPushEvents(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].callId).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('delivers live to subscribers and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCallPushEvents(listener);

    publishCallPushEvent(event({ action: 'decline' }));
    unsubscribe();
    publishCallPushEvent(event());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].action).toBe('decline');
  });

  it('maps notification buttons to actions', () => {
    expect(callActionFromResponse('call-accept', 'call-accept', 'call-decline')).toBe('accept');
    expect(callActionFromResponse('call-decline', 'call-accept', 'call-decline')).toBe('decline');
    expect(callActionFromResponse('expo.modules.notifications.actions.DEFAULT', 'call-accept', 'call-decline')).toBe(
      'open',
    );
    expect(callActionFromResponse(null, 'call-accept', 'call-decline')).toBe('open');
  });
});

describe('parsePushNotificationData (calls)', () => {
  it('accepts a well-formed call push', () => {
    expect(
      parsePushNotificationData({
        type: 'chat_call',
        call_id: '64b7f0c2c2a4e1eeeeeeeeee',
        conversation_id: '64b7f0c2c2a4e11111111111',
        call_type: 'video',
      }),
    ).toMatchObject({ type: 'chat_call', call_id: '64b7f0c2c2a4e1eeeeeeeeee', call_type: 'video' });
  });

  it('drops a call id that is not a 24-hex id, so it never reaches a route', () => {
    for (const callId of ['../settings', '64b7f0c2c2a4e1eeeeeeeeee/../x', 42, { $gt: '' }]) {
      expect(parsePushNotificationData({ type: 'chat_call', call_id: callId }).call_id).toBeUndefined();
    }
    expect(parsePushNotificationData({ type: 'chat_call', call_type: 'screen' }).call_type).toBeUndefined();
  });
});
