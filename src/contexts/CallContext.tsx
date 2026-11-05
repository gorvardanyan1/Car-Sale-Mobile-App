import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Vibration } from 'react-native';
import { getRandomBytes } from 'expo-crypto';
import { usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { RemoteVideoTrack } from 'livekit-client';

import { type CallAck, useChatSocket } from '@/contexts/ChatSocketContext';
import { deriveCallSecrets, generateCallKeyPair, type CallKeyPair } from '@/lib/calls/callCrypto';
import type { CallMediaController } from '@/lib/calls/callMedia';
import { ensureCallPermissions } from '@/lib/calls/callPermissions';
import { subscribeCallPushEvents } from '@/lib/calls/callPushEvents';
import {
  callReducer,
  initialCallState,
  isCallBusy,
  reconnectOutcome,
  reconnectRequest,
  type CallOutcome,
  type CallPeer,
  type CallState,
  type CallType,
} from '@/lib/calls/callState';
import { getConversationDisplay } from '@/lib/chat/conversationDisplay';
import { dismissCallNotifications } from '@/lib/notifications/pushNotifications';
import { fetchConversations } from '@/services/chatApiService';

type CallContextValue = {
  state: CallState;
  callsEnabled: boolean;
  videoCallsEnabled: boolean;
  canStartCall: boolean;
  remoteVideoTrack: RemoteVideoTrack | null;
  media: CallMediaController | null;
  startCall: (conversationId: string, type: CallType, peer: CallPeer | null) => Promise<void>;
  accept: () => Promise<void>;
  decline: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  switchCamera: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

/** Null outside CallProvider (signed out). */
export function useCall(): CallContextValue | null {
  return useContext(CallContext);
}

const CALL_ROUTE = '/call';
// Ring pattern while a call waits for us in the foreground: 1s on, 1s off.
const RING_PATTERN = [0, 1000, 1000];

function loadCallMedia() {
  return import('@/lib/calls/callMedia');
}

/**
 * 1:1 voice/video calls on the phone, layered on the chat socket — the same
 * protocol as the web CallProvider. Signaling goes through the chat server,
 * media to LiveKit, end-to-end encrypted when both sides offer a key.
 */
export function CallProvider({ userId, children }: { userId: number | null; children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { connected, chatSettings, emitCall, subscribeCallEvents } = useChatSocket();
  const callsEnabled = chatSettings.callsEnabled;
  const videoCallsEnabled = chatSettings.callsEnabled && chatSettings.videoCallsEnabled;

  const [state, dispatch] = useReducer(callReducer, initialCallState);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [media, setMedia] = useState<CallMediaController | null>(null);
  const stateRef = useRef(state);
  const keyPairRef = useRef<CallKeyPair | null>(null);
  // Proof that this device placed/answered the call — the only thing that lets
  // it take the call back after a reconnect (call:resume).
  const resumeTokenRef = useRef<string | null>(null);
  const mediaRef = useRef<CallMediaController | null>(null);
  const pathnameRef = useRef(pathname);
  // Async flows (await permission → check we're still 'outgoing') read the
  // latest committed state through these.
  useLayoutEffect(() => {
    stateRef.current = state;
    pathnameRef.current = pathname;
  }, [state, pathname]);
  // A notification "Decline" tapped before the socket was up.
  const pendingDeclineRef = useRef<string | null>(null);

  const showCallScreen = useCallback(() => {
    if (pathnameRef.current !== CALL_ROUTE) {
      router.push(CALL_ROUTE);
    }
  }, [router]);

  const teardownMedia = useCallback(async () => {
    const current = mediaRef.current;
    mediaRef.current = null;
    keyPairRef.current = null;
    resumeTokenRef.current = null;
    setMedia(null);
    setRemoteVideoTrack(null);
    if (current) {
      await current.disconnect().catch(() => undefined);
    }
  }, []);

  const finish = useCallback(
    (callId: string | null, outcome: CallOutcome) => {
      void teardownMedia();
      if (callId) void dismissCallNotifications(callId);
      dispatch({ type: 'ENDED', callId, outcome });
    },
    [teardownMedia],
  );

  const resolvePeer = useCallback(
    async (conversationId: string): Promise<CallPeer> => {
      try {
        const list = await fetchConversations();
        const conversation = list.find((c) => c._id === conversationId);
        if (conversation) {
          const display = getConversationDisplay(conversation, userId, t);
          return { title: display.title, imageUrl: display.imageUrl, initials: display.initials };
        }
      } catch {
        // fall through to the generic label
      }
      return { title: t('mobile.call.unknown_peer'), imageUrl: null, initials: '?' };
    },
    [t, userId],
  );

  const joinMedia = useCallback(
    async (callId: string, grant: CallAck) => {
      const peerKey = typeof grant.peerPublicKey === 'string' ? grant.peerPublicKey : null;
      let mediaKey: string | null = null;
      let verificationCode: string | null = null;
      if (grant.e2ee && peerKey && keyPairRef.current) {
        try {
          ({ mediaKey, verificationCode } = deriveCallSecrets(keyPairRef.current.privateKey, peerKey, callId));
        } catch {
          mediaKey = null;
        }
      }
      keyPairRef.current = null;
      dispatch({ type: 'MEDIA_GRANTED', callId, e2ee: Boolean(mediaKey), verificationCode });

      try {
        const { connectCallMedia } = await loadCallMedia();
        const controller = await connectCallMedia({
          url: String(grant.livekitUrl),
          token: String(grant.token),
          video: stateRef.current.type === 'video',
          speakerOn: stateRef.current.speakerOn,
          mediaKey,
          onRemoteVideo: setRemoteVideoTrack,
          onQuality: (quality) => dispatch({ type: 'QUALITY', quality }),
          onReconnect: (phase) => dispatch({ type: 'RECONNECTING', value: phase === 'reconnecting' }),
          onDisconnected: () => {
            if (stateRef.current.callId === callId && isCallBusy(stateRef.current)) {
              void emitCall('call:hangup', { callId });
              finish(callId, { status: 'ended', reason: 'disconnected' });
            }
          },
        });

        if (stateRef.current.callId !== callId || stateRef.current.phase !== 'connecting') {
          await controller.disconnect();
          return;
        }
        mediaRef.current = controller;
        setMedia(controller);
        dispatch({ type: 'CONNECTED', at: Date.now() });
      } catch {
        void emitCall('call:hangup', { callId });
        finish(callId, { error: 'media_failed' });
      }
    },
    [emitCall, finish],
  );

  const startCall = useCallback(
    async (conversationId: string, type: CallType, peer: CallPeer | null) => {
      if (!callsEnabled || (type === 'video' && !videoCallsEnabled) || isCallBusy(stateRef.current)) {
        return;
      }
      dispatch({ type: 'OUTGOING_START', conversationId, callType: type, peer });
      showCallScreen();

      const denied = await ensureCallPermissions(type === 'video');
      if (denied) {
        finish(null, { error: denied });
        return;
      }

      keyPairRef.current = generateCallKeyPair(getRandomBytes);
      const ack = await emitCall('call:invite', {
        conversationId,
        type,
        publicKey: keyPairRef.current.publicKey,
      });
      if (!ack.success) {
        finish(null, { error: ack.error });
        return;
      }
      const callId = String(ack.callId);
      if (stateRef.current.phase !== 'outgoing') {
        void emitCall('call:cancel', { callId });
        return;
      }
      resumeTokenRef.current = typeof ack.resumeToken === 'string' ? ack.resumeToken : null;
      dispatch({ type: 'OUTGOING_RINGING', callId });
    },
    [callsEnabled, videoCallsEnabled, emitCall, finish, showCallScreen],
  );

  const accept = useCallback(async () => {
    const current = stateRef.current;
    if (current.phase !== 'incoming' || !current.callId) return;
    const { callId } = current;
    dispatch({ type: 'ANSWERING' });
    void dismissCallNotifications(callId);

    const denied = await ensureCallPermissions(current.type === 'video');
    if (denied) {
      void emitCall('call:decline', { callId });
      finish(callId, { error: denied });
      return;
    }

    keyPairRef.current = current.callerPublicKey ? generateCallKeyPair(getRandomBytes) : null;
    const ack = await emitCall('call:accept', {
      callId,
      ...(keyPairRef.current ? { publicKey: keyPairRef.current.publicKey } : {}),
    });
    if (!ack.success) {
      finish(callId, { error: ack.error });
      return;
    }
    resumeTokenRef.current = typeof ack.resumeToken === 'string' ? ack.resumeToken : null;
    await joinMedia(callId, ack);
  }, [emitCall, finish, joinMedia]);

  const decline = useCallback(() => {
    const { phase, callId } = stateRef.current;
    if (phase !== 'incoming' || !callId) return;
    void emitCall('call:decline', { callId });
    void dismissCallNotifications(callId);
    dispatch({ type: 'RESET' });
  }, [emitCall]);

  const hangup = useCallback(() => {
    const { phase, callId } = stateRef.current;
    if (phase === 'outgoing') {
      if (callId) void emitCall('call:cancel', { callId });
      finish(callId, { status: 'missed', reason: 'cancelled' });
      return;
    }
    if ((phase === 'connecting' || phase === 'active') && callId) {
      void emitCall('call:hangup', { callId });
      finish(callId, { status: 'ended', reason: 'hangup' });
    }
  }, [emitCall, finish]);

  const toggleMute = useCallback(() => {
    const next = !stateRef.current.muted;
    dispatch({ type: 'TOGGLE_MUTE' });
    void mediaRef.current?.setMuted(next);
  }, []);

  const toggleCamera = useCallback(() => {
    const next = !stateRef.current.cameraOn;
    dispatch({ type: 'SET_CAMERA', on: next });
    void mediaRef.current?.setCameraOn(next);
  }, []);

  const toggleSpeaker = useCallback(() => {
    const next = !stateRef.current.speakerOn;
    dispatch({ type: 'SET_SPEAKER', on: next });
    void mediaRef.current?.setSpeaker(next);
  }, []);

  const switchCamera = useCallback(() => {
    void mediaRef.current?.switchCamera();
  }, []);

  /** Treat a ring we learned about (socket or push) the same way. */
  const receiveRing = useCallback(
    (ring: { callId: string; conversationId: string; type: CallType; callerPublicKey: string | null }) => {
      if (!callsEnabled) return;
      const known = stateRef.current.callId === ring.callId;
      dispatch({
        type: 'INCOMING',
        callId: ring.callId,
        conversationId: ring.conversationId,
        callType: ring.type,
        callerPublicKey: ring.callerPublicKey,
      });
      if (known || isCallBusy(stateRef.current)) return;
      showCallScreen();
      void resolvePeer(ring.conversationId).then((peer) =>
        dispatch({ type: 'PEER_RESOLVED', conversationId: ring.conversationId, peer }),
      );
    },
    [callsEnabled, resolvePeer, showCallScreen],
  );

  // ── Socket events ──────────────────────────────────────────────────────
  useEffect(
    () =>
      subscribeCallEvents({
        'call:incoming': (payload) =>
          receiveRing({
            callId: payload.callId,
            conversationId: payload.conversationId,
            type: payload.type === 'video' ? 'video' : 'voice',
            callerPublicKey: payload.callerPublicKey ?? null,
          }),
        'call:accepted': (payload) => {
          const current = stateRef.current;
          if (current.phase === 'outgoing' && current.callId === payload.callId) {
            void joinMedia(payload.callId, { success: true, ...payload });
          } else if (current.callId !== payload.callId) {
            void emitCall('call:hangup', { callId: payload.callId });
          }
        },
        'call:ended': (payload) => {
          if (stateRef.current.callId === payload.callId) {
            finish(payload.callId, { status: payload.status, reason: payload.reason });
          } else {
            void dismissCallNotifications(payload.callId);
          }
        },
      }),
    [subscribeCallEvents, receiveRing, joinMedia, emitCall, finish],
  );

  // Every (re)connect: move a call in progress to the new socket (call:resume,
  // proven by this device's token — a call still ringing in has nothing to
  // move, so it only checks the ring is live), and send a Decline the user
  // tapped on the notification while we were offline.
  useEffect(() => {
    if (!connected) return;

    const pendingDecline = pendingDeclineRef.current;
    if (pendingDecline) {
      pendingDeclineRef.current = null;
      void emitCall('call:decline', { callId: pendingDecline });
    }

    const { callId, phase } = stateRef.current;
    const request = reconnectRequest(stateRef.current, resumeTokenRef.current);
    if (!callId || !request) return;
    void emitCall(request.event, request.payload).then((ack) => {
      if (stateRef.current.callId !== callId) return;
      const outcome = reconnectOutcome(phase, ack);
      if (outcome) finish(callId, outcome);
    });
  }, [connected, emitCall, finish]);

  // ── Notification taps ─────────────────────────────────────────────────
  const acceptWhenReadyRef = useRef<string | null>(null);

  useEffect(
    () =>
      subscribeCallPushEvents((event) => {
        void dismissCallNotifications(event.callId);
        if (event.action === 'decline') {
          if (connected) void emitCall('call:decline', { callId: event.callId });
          else pendingDeclineRef.current = event.callId;
          return;
        }
        if (event.action === 'accept') {
          acceptWhenReadyRef.current = event.callId;
        }
        // The ring itself reaches us over the socket (the server replays it to
        // a newly connected device). Show the screen now; if the call is
        // already over, call:sync below says so.
        if (event.conversationId && !isCallBusy(stateRef.current)) {
          router.push({ pathname: '/chat/[id]', params: { id: event.conversationId } });
        }
        if (connected) {
          void emitCall('call:sync', { callId: event.callId }).then((ack) => {
            const call = ack.call as
              | { status?: string; conversationId?: string; calleeId?: number; type?: CallType }
              | undefined;
            if (ack.success && call?.status === 'ringing' && Number(call.calleeId) === Number(userId)) {
              receiveRing({
                callId: event.callId,
                conversationId: String(call.conversationId),
                type: call.type === 'video' ? 'video' : 'voice',
                callerPublicKey: typeof ack.callerPublicKey === 'string' ? ack.callerPublicKey : null,
              });
            }
          });
        }
      }),
    [connected, emitCall, receiveRing, router, userId],
  );

  // "Answer" on the notification: answer as soon as the ring is in state.
  useEffect(() => {
    if (state.phase === 'incoming' && state.callId && acceptWhenReadyRef.current === state.callId) {
      acceptWhenReadyRef.current = null;
      void accept();
    }
  }, [state.phase, state.callId, accept]);

  // Vibrate while ringing in the foreground (the push channel rings otherwise).
  useEffect(() => {
    if (state.phase !== 'incoming') return undefined;
    Vibration.vibrate(RING_PATTERN, true);
    return () => Vibration.cancel();
  }, [state.phase]);

  // Show the outcome briefly, then clear.
  useEffect(() => {
    if (state.phase !== 'ended') return undefined;
    const timer = setTimeout(() => dispatch({ type: 'RESET' }), 2500);
    return () => clearTimeout(timer);
  }, [state.phase]);

  // Signing out mid-call.
  useEffect(() => () => void teardownMedia(), [teardownMedia]);

  const value = useMemo<CallContextValue>(
    () => ({
      state,
      callsEnabled,
      videoCallsEnabled,
      canStartCall: callsEnabled && connected && !isCallBusy(state),
      remoteVideoTrack,
      media,
      startCall,
      accept,
      decline,
      hangup,
      toggleMute,
      toggleCamera,
      toggleSpeaker,
      switchCamera,
    }),
    [
      state,
      callsEnabled,
      videoCallsEnabled,
      connected,
      remoteVideoTrack,
      media,
      startCall,
      accept,
      decline,
      hangup,
      toggleMute,
      toggleCamera,
      toggleSpeaker,
      switchCamera,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
