import { Platform } from 'react-native';
import {
  AudioSession,
  RNE2EEManager,
  RNKeyProvider,
  registerGlobals,
} from '@livekit/react-native';
import {
  Room,
  RoomEvent,
  Track,
  type LocalVideoTrack,
  type RemoteTrack,
  type RemoteVideoTrack,
} from 'livekit-client';

/**
 * The only module that touches LiveKit/WebRTC native code. CallProvider loads
 * it with a dynamic import() when a call actually starts, so screens never
 * pay for it and an Expo Go session (no native WebRTC) only fails if someone
 * tries to call — not at startup.
 */

let globalsRegistered = false;

function ensureGlobals(): void {
  if (!globalsRegistered) {
    registerGlobals();
    globalsRegistered = true;
  }
}

export type CallMediaController = {
  setMuted(muted: boolean): Promise<void>;
  setCameraOn(on: boolean): Promise<void>;
  switchCamera(): Promise<void>;
  setSpeaker(on: boolean): Promise<void>;
  localVideoTrack(): LocalVideoTrack | undefined;
  disconnect(): Promise<void>;
};

/**
 * Earpiece vs loudspeaker. With a headset or Bluetooth device connected,
 * "speaker off" means "use that device", never the earpiece.
 */
async function routeAudio(speakerOn: boolean): Promise<void> {
  if (Platform.OS === 'ios') {
    await AudioSession.selectAudioOutput(speakerOn ? 'force_speaker' : 'default');
    return;
  }
  const outputs = await AudioSession.getAudioOutputs();
  if (speakerOn) {
    await AudioSession.selectAudioOutput('speaker');
    return;
  }
  const preferred = ['bluetooth', 'headset', 'earpiece'].find((o) => outputs.includes(o));
  if (preferred) {
    await AudioSession.selectAudioOutput(preferred);
  }
}

export async function connectCallMedia(options: {
  url: string;
  token: string;
  video: boolean;
  speakerOn: boolean;
  /** base64 E2EE key, or null for DTLS-SRTP only. */
  mediaKey: string | null;
  onRemoteVideo: (track: RemoteVideoTrack | null) => void;
  onQuality?: (quality: string) => void;
  onReconnect?: (phase: 'reconnecting' | 'reconnected') => void;
  onDisconnected: () => void;
}): Promise<CallMediaController> {
  ensureGlobals();
  await AudioSession.startAudioSession();

  let keyProvider: RNKeyProvider | undefined;
  let room: Room;
  if (options.mediaKey) {
    // Same shared-key passphrase derivation as the web's ExternalE2EEKeyProvider,
    // so a phone and a browser end up with the same frame keys.
    keyProvider = new RNKeyProvider({ sharedKey: true });
    await keyProvider.setSharedKey(options.mediaKey);
    room = new Room({
      adaptiveStream: true,
      dynacast: true,
      encryption: { e2eeManager: new RNE2EEManager(keyProvider) },
    });
  } else {
    room = new Room({ adaptiveStream: true, dynacast: true });
  }

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Video) {
      options.onRemoteVideo(track as RemoteVideoTrack);
    }
  });
  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Video) {
      options.onRemoteVideo(null);
    }
  });
  room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
    if (participant?.isLocal) options.onQuality?.(String(quality));
  });
  room.on(RoomEvent.Reconnecting, () => options.onReconnect?.('reconnecting'));
  room.on(RoomEvent.Reconnected, () => options.onReconnect?.('reconnected'));
  room.on(RoomEvent.Disconnected, () => options.onDisconnected());

  try {
    await room.connect(options.url, options.token);
    if (keyProvider) {
      await room.setE2EEEnabled(true);
    }
    await room.localParticipant.setMicrophoneEnabled(true);
    if (options.video) {
      await room.localParticipant.setCameraEnabled(true);
    }
    await routeAudio(options.speakerOn).catch(() => undefined);
  } catch (error) {
    room.removeAllListeners();
    await room.disconnect().catch(() => undefined);
    keyProvider?.dispose();
    await AudioSession.stopAudioSession().catch(() => undefined);
    throw error;
  }

  const cameraTrack = () =>
    room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack as
      | LocalVideoTrack
      | undefined;

  return {
    async setMuted(muted) {
      await room.localParticipant.setMicrophoneEnabled(!muted);
    },
    async setCameraOn(on) {
      await room.localParticipant.setCameraEnabled(on);
    },
    async switchCamera() {
      const track = cameraTrack();
      const facing = track?.mediaStreamTrack.getSettings().facingMode === 'environment' ? 'user' : 'environment';
      await track?.restartTrack({ facingMode: facing });
    },
    setSpeaker: routeAudio,
    localVideoTrack: cameraTrack,
    async disconnect() {
      room.removeAllListeners();
      await room.disconnect();
      keyProvider?.dispose();
      await AudioSession.stopAudioSession().catch(() => undefined);
    },
  };
}
