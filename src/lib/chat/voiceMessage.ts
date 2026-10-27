import { CHAT_URL } from '@/constants/chat';
import type { ChatMessageShape } from '@/types/chat';

/**
 * Longest recording the composer will take. Mirrors the chat server's
 * VOICE_MAX_DURATION_MS default; the server is the authority and rejects
 * anything longer, this just stops the user recording something unsendable.
 */
export const MAX_VOICE_DURATION_MS = 120_000;

/** Shorter than this is an accidental tap, and the server rejects it too. */
export const MIN_VOICE_DURATION_MS = 500;

/** The recorder emits AAC in an MP4 container on both platforms (see RecordingPresets). */
export const VOICE_UPLOAD_CONTENT_TYPE = 'audio/mp4';

export function isVoiceMessage(
  message: Pick<ChatMessageShape, 'type' | 'audio'>,
): message is Pick<ChatMessageShape, 'type' | 'audio'> & { audio: NonNullable<ChatMessageShape['audio']> } {
  return message.type === 'voice' && message.audio != null;
}

/** 0 → "0:00", 65_400 → "1:05". Rounds to the nearest second, never negative. */
export function formatVoiceDuration(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.round(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** True when a finished recording is long enough to be worth sending. */
export function isSendableRecording(durationMs: number): boolean {
  return durationMs >= MIN_VOICE_DURATION_MS && durationMs <= MAX_VOICE_DURATION_MS;
}

export function voiceAudioUrl(messageId: string, baseUrl: string = CHAT_URL): string {
  return `${baseUrl}/api/messages/${encodeURIComponent(messageId)}/audio`;
}

/** Fraction played, clamped to [0, 1]; 0 when the duration is unknown. */
export function playbackProgress(positionMs: number, durationMs: number): number {
  if (!(durationMs > 0) || !(positionMs > 0)) return 0;
  return Math.min(1, positionMs / durationMs);
}
