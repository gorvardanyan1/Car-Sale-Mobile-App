import { describe, expect, it } from 'vitest';

import { describeCallHistory, isCallMessage } from '@/lib/calls/callHistory';
import type { ChatCallSummary, ChatMessageShape } from '@/types/chat';

const t = (key: string) => key;
const message = (call: Partial<ChatCallSummary>): ChatMessageShape => ({
  _id: 'm1',
  conversationId: 'c1',
  senderId: 1,
  receiverId: 2,
  text: 'Missed voice call',
  type: 'call',
  call: { callId: 'k1', callType: 'voice', status: 'missed', durationSec: 0, ...call },
  isRead: false,
  createdAt: new Date().toISOString(),
});

describe('describeCallHistory', () => {
  it('flags a missed call only for the person who missed it', () => {
    expect(describeCallHistory(message({}), false, t)).toEqual({
      label: 'mobile.call.history_missed_voice',
      missed: true,
      video: false,
    });
    expect(describeCallHistory(message({}), true, t)).toEqual({
      label: 'mobile.call.history_no_answer',
      missed: false,
      video: false,
    });
  });

  it('shows the duration of a completed video call', () => {
    expect(describeCallHistory(message({ callType: 'video', status: 'ended', durationSec: 192 }), false, t).label).toBe(
      'mobile.call.history_video · 3:12',
    );
  });

  it('words a declined call from each side', () => {
    expect(describeCallHistory(message({ status: 'declined' }), true, t).label).toBe('mobile.call.history_declined');
    expect(describeCallHistory(message({ status: 'declined' }), false, t).label).toBe('mobile.call.history_you_declined');
  });
});

describe('isCallMessage', () => {
  it('needs both the type and the summary', () => {
    expect(isCallMessage(message({}))).toBe(true);
    expect(isCallMessage({ ...message({}), call: null })).toBe(false);
    expect(isCallMessage({ ...message({}), type: 'text' })).toBe(false);
  });
});
