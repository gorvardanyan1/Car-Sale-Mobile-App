import { describe, expect, it } from 'vitest';

import {
  callReducer,
  callStatusText,
  formatCallDuration,
  initialCallState,
  isCallBusy,
  outcomeMessageKey,
  reconnectOutcome,
  reconnectRequest,
  type CallAction,
  type CallState,
} from '@/lib/calls/callState';

const run = (...actions: CallAction[]): CallState => actions.reduce(callReducer, initialCallState);
const t = (key: string) => key;
const peer = { title: 'BMW X5', imageUrl: null, initials: 'B' };

describe('callReducer', () => {
  it('walks an outgoing video call to active, defaulting to the loudspeaker', () => {
    let state = run({ type: 'OUTGOING_START', conversationId: 'c1', callType: 'video', peer });
    expect(state).toMatchObject({ phase: 'outgoing', cameraOn: true, speakerOn: true, callId: null });

    state = callReducer(state, { type: 'OUTGOING_RINGING', callId: 'k1' });
    state = callReducer(state, { type: 'MEDIA_GRANTED', callId: 'k1', e2ee: true, verificationCode: '853338' });
    state = callReducer(state, { type: 'CONNECTED', at: 5000 });

    expect(state).toMatchObject({ phase: 'active', e2ee: true, verificationCode: '853338', startedAt: 5000 });
    expect(isCallBusy(state)).toBe(true);
  });

  it('starts voice calls on the earpiece with no camera', () => {
    const state = run({ type: 'OUTGOING_START', conversationId: 'c1', callType: 'voice', peer });
    expect(state).toMatchObject({ cameraOn: false, speakerOn: false });
    expect(callReducer(state, { type: 'SET_CAMERA', on: true }).cameraOn).toBe(false);
    expect(callReducer(state, { type: 'SET_SPEAKER', on: true }).speakerOn).toBe(true);
  });

  it('refuses a new call or ring while one is in progress, but takes a replay of the same ring', () => {
    const ringing = run({ type: 'INCOMING', callId: 'k1', conversationId: 'c1', callType: 'voice' });

    expect(
      callReducer(ringing, { type: 'INCOMING', callId: 'k2', conversationId: 'c2', callType: 'voice' }),
    ).toBe(ringing);
    expect(
      callReducer(ringing, { type: 'OUTGOING_START', conversationId: 'c3', callType: 'voice', peer }),
    ).toBe(ringing);
    expect(
      callReducer(ringing, { type: 'INCOMING', callId: 'k1', conversationId: 'c1', callType: 'voice', peer }).peer,
    ).toEqual(peer);
  });

  it('ignores end events for other calls and keeps the first outcome', () => {
    let state = run(
      { type: 'INCOMING', callId: 'k1', conversationId: 'c1', callType: 'voice' },
      { type: 'ANSWERING' },
    );
    expect(callReducer(state, { type: 'ENDED', callId: 'zz', outcome: { status: 'ended' } })).toBe(state);

    state = callReducer(state, { type: 'ENDED', callId: 'k1', outcome: { status: 'ended', reason: 'hangup' } });
    state = callReducer(state, { type: 'ENDED', callId: 'k1', outcome: { status: 'ended', reason: 'peer_left' } });
    expect(state).toMatchObject({ phase: 'ended', outcome: { reason: 'hangup' } });
  });

  it('ends an outgoing call that failed before the server gave it an id', () => {
    const state = callReducer(run({ type: 'OUTGOING_START', conversationId: 'c1', callType: 'voice', peer }), {
      type: 'ENDED',
      callId: null,
      outcome: { error: 'permission_denied' },
    });
    expect(state.phase).toBe('ended');
  });
});

describe('call status text', () => {
  it('reads the right line for each phase', () => {
    const incoming = run({ type: 'INCOMING', callId: 'k1', conversationId: 'c1', callType: 'video' });
    expect(callStatusText(incoming, 0, t)).toBe('mobile.call.incoming_video');

    const outgoing = run({ type: 'OUTGOING_START', conversationId: 'c1', callType: 'voice', peer });
    expect(callStatusText(outgoing, 0, t)).toBe('mobile.call.ringing');

    const active: CallState = { ...outgoing, phase: 'active', startedAt: 1 };
    expect(callStatusText(active, 125, t)).toBe('2:05');
    expect(callStatusText({ ...active, reconnecting: true }, 125, t)).toBe('mobile.call.reconnecting');
  });

  it('describes outcomes from the reader’s side', () => {
    expect(outcomeMessageKey({ status: 'missed', reason: 'timeout' }, 'out')).toBe('mobile.call.outcome_no_answer');
    expect(outcomeMessageKey({ status: 'missed', reason: 'timeout' }, 'in')).toBe('mobile.call.outcome_missed');
    expect(outcomeMessageKey({ status: 'declined' }, 'out')).toBe('mobile.call.outcome_declined');
    expect(outcomeMessageKey({ error: 'Busy' }, 'out')).toBe('mobile.call.outcome_busy');
    expect(outcomeMessageKey({ error: 'media_failed' }, 'out')).toBe('mobile.call.outcome_failed');
  });

  it('formats durations', () => {
    expect(formatCallDuration(59)).toBe('0:59');
    expect(formatCallDuration(3725)).toBe('1:02:05');
  });
});

describe('reconnecting mid-call', () => {
  const active: CallState = {
    ...run({ type: 'OUTGOING_START', conversationId: 'c1', callType: 'voice', peer }),
    phase: 'active',
    callId: 'k1',
    startedAt: 1,
  };

  it('takes the call back with this device’s resume token', () => {
    expect(reconnectRequest(active, 'tok')).toEqual({
      event: 'call:resume',
      payload: { callId: 'k1', resumeToken: 'tok' },
    });
  });

  it('only reads the state of a ring still waiting for an answer, or without a token', () => {
    const ringing = run({ type: 'INCOMING', callId: 'k2', conversationId: 'c1', callType: 'voice' });
    expect(reconnectRequest(ringing, 'tok')).toEqual({ event: 'call:sync', payload: { callId: 'k2' } });
    expect(reconnectRequest(active, null)).toEqual({ event: 'call:sync', payload: { callId: 'k1' } });
  });

  it('sends nothing when no call is in progress', () => {
    expect(reconnectRequest(initialCallState, 'tok')).toBeNull();
    expect(reconnectRequest({ ...active, phase: 'ended' }, 'tok')).toBeNull();
  });

  it('carries on when the call is still live', () => {
    expect(reconnectOutcome('active', { success: true, call: { status: 'accepted' } })).toBeNull();
    expect(reconnectOutcome('incoming', { success: true, call: { status: 'ringing' } })).toBeNull();
  });

  it('ends the call when it is over, owned by another device, or answered elsewhere', () => {
    expect(reconnectOutcome('active', { success: true, call: { status: 'ended', endReason: 'peer_left' } })).toEqual({
      status: 'ended',
      reason: 'peer_left',
    });
    expect(reconnectOutcome('active', { success: false })).toEqual({ status: 'failed', reason: 'disconnected' });
    expect(reconnectOutcome('incoming', { success: true, call: { status: 'accepted' } })).toEqual({
      status: 'accepted',
      reason: 'answered_elsewhere',
    });
  });
});
