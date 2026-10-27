import { describe, expect, it } from 'vitest';

import {
  MAX_VOICE_DURATION_MS,
  MIN_VOICE_DURATION_MS,
  formatVoiceDuration,
  isSendableRecording,
  isVoiceMessage,
  playbackProgress,
  voiceAudioUrl,
} from '@/lib/chat/voiceMessage';

describe('formatVoiceDuration', () => {
  it('formats m:ss, rounding to the nearest second', () => {
    expect(formatVoiceDuration(0)).toBe('0:00');
    expect(formatVoiceDuration(4_200)).toBe('0:04');
    expect(formatVoiceDuration(4_600)).toBe('0:05');
    expect(formatVoiceDuration(65_400)).toBe('1:05');
    expect(formatVoiceDuration(MAX_VOICE_DURATION_MS)).toBe('2:00');
  });

  it('never shows a negative or non-finite duration', () => {
    expect(formatVoiceDuration(-5_000)).toBe('0:00');
    expect(formatVoiceDuration(Number.NaN)).toBe('0:00');
    expect(formatVoiceDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('isSendableRecording', () => {
  it('rejects accidental taps and over-long recordings, accepting the boundaries', () => {
    expect(isSendableRecording(MIN_VOICE_DURATION_MS - 1)).toBe(false);
    expect(isSendableRecording(MIN_VOICE_DURATION_MS)).toBe(true);
    expect(isSendableRecording(MAX_VOICE_DURATION_MS)).toBe(true);
    expect(isSendableRecording(MAX_VOICE_DURATION_MS + 1)).toBe(false);
    expect(isSendableRecording(0)).toBe(false);
  });
});

describe('isVoiceMessage', () => {
  const audio = { mimeType: 'audio/mp4', durationMs: 3000, size: 100 };

  it('is true only for a voice message that carries audio metadata', () => {
    expect(isVoiceMessage({ type: 'voice', audio })).toBe(true);
    expect(isVoiceMessage({ type: 'voice', audio: null })).toBe(false);
    expect(isVoiceMessage({ type: 'text', audio })).toBe(false);
  });

  it('treats messages from before voice support (no type) as text', () => {
    expect(isVoiceMessage({})).toBe(false);
  });
});

describe('voiceAudioUrl', () => {
  it('points at the authenticated audio endpoint and encodes the id', () => {
    expect(voiceAudioUrl('abc123', 'https://chat.example.com')).toBe(
      'https://chat.example.com/api/messages/abc123/audio',
    );
    expect(voiceAudioUrl('a/b?c', 'https://chat.example.com')).toBe(
      'https://chat.example.com/api/messages/a%2Fb%3Fc/audio',
    );
  });
});

describe('playbackProgress', () => {
  it('returns the played fraction, clamped to [0, 1]', () => {
    expect(playbackProgress(2_000, 4_000)).toBe(0.5);
    expect(playbackProgress(9_000, 4_000)).toBe(1);
    expect(playbackProgress(-100, 4_000)).toBe(0);
  });

  it('is 0 when the duration is unknown', () => {
    expect(playbackProgress(1_000, 0)).toBe(0);
    expect(playbackProgress(1_000, Number.NaN)).toBe(0);
  });
});
