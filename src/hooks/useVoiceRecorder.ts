import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { MAX_VOICE_DURATION_MS } from '@/lib/chat/voiceMessage';

export type VoiceRecording = { uri: string; durationMs: number };

type UseVoiceRecorderReturn = {
  isRecording: boolean;
  /** Elapsed recording time in milliseconds. */
  durationMs: number;
  /** Set when the user declined the microphone permission. */
  permissionDenied: boolean;
  start: () => Promise<boolean>;
  /** Stop and hand back the file, or null if nothing was being recorded. */
  stop: () => Promise<VoiceRecording | null>;
  /** Stop and throw the recording away. */
  cancel: () => Promise<void>;
};

/**
 * Microphone recording for the chat composer. Records AAC/M4A, which the chat
 * server accepts and both platforms can play back.
 */
export function useVoiceRecorder(onLimitReached?: (recording: VoiceRecording) => void): UseVoiceRecorderReturn {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 200);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // Own flag rather than `state.isRecording`, which lags the first poll after start().
  const [isRecording, setIsRecording] = useState(false);
  const activeRef = useRef(false);
  const onLimitRef = useRef(onLimitReached);
  useEffect(() => {
    onLimitRef.current = onLimitReached;
  });

  const finish = useCallback(async (): Promise<VoiceRecording | null> => {
    if (!activeRef.current) return null;
    activeRef.current = false;
    setIsRecording(false);

    const durationMs = recorder.getStatus().durationMillis;
    await recorder.stop();
    // Playback of other voice messages needs the speaker route back.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

    const uri = recorder.uri;
    return uri ? { uri, durationMs } : null;
  }, [recorder]);

  const start = useCallback(async () => {
    if (activeRef.current) return false;

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setPermissionDenied(true);
      return false;
    }
    setPermissionDenied(false);

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    activeRef.current = true;
    setIsRecording(true);
    return true;
  }, [recorder]);

  const stop = useCallback(() => finish(), [finish]);

  const cancel = useCallback(async () => {
    await finish();
  }, [finish]);

  // Auto-stop at the cap, handing the result to the screen so it can send it
  // instead of silently dropping the last seconds the user spoke.
  useEffect(() => {
    if (!activeRef.current || state.durationMillis < MAX_VOICE_DURATION_MS) return;
    void finish().then((recording) => {
      if (recording) onLimitRef.current?.(recording);
    });
  }, [state.durationMillis, finish]);

  // Leaving the screen mid-recording must release the microphone.
  useEffect(
    () => () => {
      if (activeRef.current) {
        activeRef.current = false;
        void recorder.stop().catch(() => {});
      }
    },
    [recorder],
  );

  return {
    isRecording,
    durationMs: isRecording ? state.durationMillis : 0,
    permissionDenied,
    start,
    stop,
    cancel,
  };
}
