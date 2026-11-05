/**
 * Client-side call state — the same machine as the web app's callState.js.
 * The chat server is the authority on whether a call exists; this mirrors it
 * for one device so the call screen knows what to show.
 */
export type CallType = 'voice' | 'video';
export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended';

export type CallPeer = { title: string; imageUrl: string | null; initials: string };

/** A server end payload ({ status, reason }) or a local error code. */
export type CallOutcome = { status?: string; reason?: string; error?: string };

export type CallState = {
  phase: CallPhase;
  callId: string | null;
  conversationId: string | null;
  type: CallType;
  direction: 'in' | 'out' | null;
  peer: CallPeer | null;
  callerPublicKey: string | null;
  e2ee: boolean;
  verificationCode: string | null;
  muted: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
  startedAt: number | null;
  reconnecting: boolean;
  quality: string | null;
  outcome: CallOutcome | null;
};

export type CallAction =
  | { type: 'OUTGOING_START'; conversationId: string; callType: CallType; peer: CallPeer | null }
  | { type: 'OUTGOING_RINGING'; callId: string }
  | {
      type: 'INCOMING';
      callId: string;
      conversationId: string;
      callType: CallType;
      callerPublicKey?: string | null;
      peer?: CallPeer | null;
    }
  | { type: 'PEER_RESOLVED'; conversationId: string; peer: CallPeer }
  | { type: 'ANSWERING' }
  | { type: 'MEDIA_GRANTED'; callId: string; e2ee: boolean; verificationCode: string | null }
  | { type: 'CONNECTED'; at: number }
  | { type: 'RECONNECTING'; value: boolean }
  | { type: 'QUALITY'; quality: string }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_CAMERA'; on: boolean }
  | { type: 'SET_SPEAKER'; on: boolean }
  | { type: 'ENDED'; callId: string | null; outcome: CallOutcome }
  | { type: 'RESET' };

export const initialCallState: CallState = {
  phase: 'idle',
  callId: null,
  conversationId: null,
  type: 'voice',
  direction: null,
  peer: null,
  callerPublicKey: null,
  e2ee: false,
  verificationCode: null,
  muted: false,
  cameraOn: false,
  speakerOn: false,
  startedAt: null,
  reconnecting: false,
  quality: null,
  outcome: null,
};

const BUSY_PHASES: CallPhase[] = ['outgoing', 'incoming', 'connecting', 'active'];

export function isCallBusy(state: CallState): boolean {
  return BUSY_PHASES.includes(state.phase);
}

function matches(state: CallState, callId: string | null): boolean {
  return Boolean(callId) && state.callId === callId;
}

export function callReducer(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case 'OUTGOING_START':
      if (isCallBusy(state)) return state;
      return {
        ...initialCallState,
        phase: 'outgoing',
        direction: 'out',
        conversationId: action.conversationId,
        type: action.callType,
        peer: action.peer,
        cameraOn: action.callType === 'video',
        // Video calls are held away from the ear: loudspeaker by default.
        speakerOn: action.callType === 'video',
      };

    case 'OUTGOING_RINGING':
      return state.phase === 'outgoing' ? { ...state, callId: action.callId } : state;

    case 'INCOMING':
      if (isCallBusy(state)) {
        return matches(state, action.callId) && action.peer ? { ...state, peer: action.peer } : state;
      }
      return {
        ...initialCallState,
        phase: 'incoming',
        direction: 'in',
        callId: action.callId,
        conversationId: action.conversationId,
        type: action.callType,
        peer: action.peer ?? null,
        callerPublicKey: action.callerPublicKey ?? null,
        cameraOn: action.callType === 'video',
        speakerOn: action.callType === 'video',
      };

    case 'PEER_RESOLVED':
      return state.conversationId === action.conversationId ? { ...state, peer: action.peer } : state;

    case 'ANSWERING':
      return state.phase === 'incoming' ? { ...state, phase: 'connecting' } : state;

    case 'MEDIA_GRANTED':
      if (!matches(state, action.callId) || !['outgoing', 'connecting'].includes(state.phase)) {
        return state;
      }
      return {
        ...state,
        phase: 'connecting',
        e2ee: action.e2ee,
        verificationCode: action.verificationCode,
      };

    case 'CONNECTED':
      return state.phase === 'connecting'
        ? { ...state, phase: 'active', startedAt: action.at, reconnecting: false }
        : state;

    case 'RECONNECTING':
      return isCallBusy(state) ? { ...state, reconnecting: action.value } : state;

    case 'QUALITY':
      return state.phase === 'active' ? { ...state, quality: action.quality } : state;

    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };

    case 'SET_CAMERA':
      return state.type === 'video' ? { ...state, cameraOn: action.on } : state;

    case 'SET_SPEAKER':
      return { ...state, speakerOn: action.on };

    case 'ENDED':
      // First outcome wins: our own hangup is echoed back by the server.
      if (state.phase === 'ended' || state.phase === 'idle') return state;
      if (!matches(state, action.callId) && !(action.callId == null && isCallBusy(state))) {
        return state;
      }
      return { ...state, phase: 'ended', reconnecting: false, outcome: action.outcome };

    case 'RESET':
      return initialCallState;

    default:
      return state;
  }
}

/** i18n key describing how a call ended, from this device's side. */
export function outcomeMessageKey(outcome: CallOutcome | null, direction: 'in' | 'out' | null): string {
  if (!outcome) return 'mobile.call.ended';
  const { status, reason, error } = outcome;

  if (error === 'Busy') return 'mobile.call.outcome_busy';
  if (error === 'permission_denied') return 'mobile.call.outcome_permission_denied';
  if (error === 'Calls disabled' || error === 'Video calls disabled' || error === 'Calls unavailable') {
    return 'mobile.call.outcome_unavailable';
  }
  if (error === 'Rate limit exceeded') return 'mobile.call.outcome_rate_limited';
  if (error) return 'mobile.call.outcome_failed';

  if (reason === 'answered_elsewhere') return 'mobile.call.outcome_answered_elsewhere';
  if (status === 'declined') return direction === 'out' ? 'mobile.call.outcome_declined' : 'mobile.call.ended';
  if (status === 'missed' && reason === 'timeout') {
    return direction === 'out' ? 'mobile.call.outcome_no_answer' : 'mobile.call.outcome_missed';
  }
  if (status === 'missed' && reason === 'cancelled' && direction === 'in') return 'mobile.call.outcome_missed';
  if (reason === 'disconnected' || reason === 'peer_left') return 'mobile.call.outcome_connection_lost';
  if (status === 'failed') return 'mobile.call.outcome_failed';
  return 'mobile.call.ended';
}

/** 75 → "1:15", 3725 → "1:02:05". */
export function formatCallDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = String(s % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

/** The single status line under the name: ringing, connecting, the timer, or the outcome. */
export function callStatusText(state: CallState, seconds: number, t: (key: string) => string): string {
  if (state.phase === 'ended') return t(outcomeMessageKey(state.outcome, state.direction));
  if (state.reconnecting) return t('mobile.call.reconnecting');
  if (state.phase === 'incoming') {
    return t(state.type === 'video' ? 'mobile.call.incoming_video' : 'mobile.call.incoming_voice');
  }
  if (state.phase === 'outgoing') return t('mobile.call.ringing');
  if (state.phase === 'connecting') return t('mobile.call.connecting');
  return formatCallDuration(seconds);
}

/**
 * What to send after the chat socket reconnects mid-call. The device that
 * placed/answered the call proves it with its resume token and takes the
 * call back (call:resume). A ring still waiting for an answer — or a device
 * without a token — can only check the call is still live (call:sync).
 */
export function reconnectRequest(
  state: CallState,
  resumeToken: string | null,
): { event: 'call:sync' | 'call:resume'; payload: Record<string, unknown> } | null {
  if (!state.callId || !isCallBusy(state)) return null;
  if (state.phase === 'incoming' || !resumeToken) {
    return { event: 'call:sync', payload: { callId: state.callId } };
  }
  return { event: 'call:resume', payload: { callId: state.callId, resumeToken } };
}

/**
 * How the reconnect answer affects the call: null = carry on, otherwise the
 * outcome to end it with (it ended while we were away, it was answered on
 * another device, or this device can no longer resume it).
 */
export function reconnectOutcome(
  phase: CallPhase,
  ack: { success: boolean; call?: unknown },
): CallOutcome | null {
  const call = ack.call as { status?: string; endReason?: string } | undefined;
  if (!ack.success || (call?.status && !['ringing', 'accepted'].includes(call.status))) {
    return { status: call?.status ?? 'failed', reason: call?.endReason ?? 'disconnected' };
  }
  if (phase === 'incoming' && call?.status === 'accepted') {
    return { status: 'accepted', reason: 'answered_elsewhere' };
  }
  return null;
}
