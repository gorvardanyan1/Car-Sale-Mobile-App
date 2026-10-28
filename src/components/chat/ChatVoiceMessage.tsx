import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useChatSocket } from '@/contexts/ChatSocketContext';
import { colors, radii, spacing, typography } from '@/theme';
import {
  formatVoiceDuration,
  playbackProgress,
  voiceAudioUrl,
} from '@/lib/chat/voiceMessage';

type Props = {
  messageId: string;
  durationMs: number;
  isMine: boolean;
};

/** Only one voice message plays at a time — starting another pauses this one. */
let pauseActive: (() => void) | null = null;

/**
 * Inline player for a voice message. Nothing is fetched until the user taps
 * play, so scrolling a long thread does not download every recording. The
 * stream is authenticated with the chat JWT sent as a header on the request.
 */
export function ChatVoiceMessage({ messageId, durationMs, isMine }: Props) {
  const { t } = useTranslation();
  const { getChatToken } = useChatSocket();
  const [source, setSource] = useState<AudioSource | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [failed, setFailed] = useState(false);
  const wantsPlayRef = useRef(false);

  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const pause = useCallback(() => player.pause(), [player]);

  // Source assigned by a tap: begin once the player reports it is loaded.
  useEffect(() => {
    if (!status.isLoaded || !wantsPlayRef.current) return;
    wantsPlayRef.current = false;
    pauseActive?.();
    pauseActive = pause;
    setIsPreparing(false);
    player.play();
  }, [status.isLoaded, player, pause]);

  // Rewind at the end so the next tap replays instead of doing nothing.
  useEffect(() => {
    if (!status.didJustFinish) return;
    void player.seekTo(0);
    player.pause();
    if (pauseActive === pause) pauseActive = null;
  }, [status.didJustFinish, player, pause]);

  useEffect(
    () => () => {
      if (pauseActive === pause) pauseActive = null;
    },
    [pause],
  );

  const handlePress = useCallback(async () => {
    if (status.playing) {
      player.pause();
      return;
    }

    if (source) {
      pauseActive?.();
      pauseActive = pause;
      player.play();
      return;
    }

    setFailed(false);
    setIsPreparing(true);
    wantsPlayRef.current = true;
    try {
      const token = await getChatToken();
      setSource({
        uri: voiceAudioUrl(messageId),
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      wantsPlayRef.current = false;
      setIsPreparing(false);
      setFailed(true);
    }
  }, [status.playing, source, player, pause, getChatToken, messageId]);

  const totalMs = status.duration > 0 ? status.duration * 1000 : durationMs;
  const positionMs = status.currentTime * 1000;
  const progress = playbackProgress(positionMs, totalMs);
  const shownMs = status.playing || positionMs > 0 ? positionMs : durationMs;

  const fg = isMine ? colors.white : colors.text;
  const track = isMine ? 'rgba(255,255,255,0.35)' : colors.border;
  const fill = isMine ? colors.white : colors.primary;

  return (
    <View style={styles.row} testID={`chat-voice-${messageId}`}>
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        style={[styles.playButton, { backgroundColor: isMine ? 'rgba(255,255,255,0.22)' : colors.inputBackground }]}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t('mobile.chat.voice_pause') : t('mobile.chat.voice_play')}
        testID={`chat-voice-toggle-${messageId}`}
      >
        {isPreparing ? (
          <ActivityIndicator size="small" color={isMine ? colors.white : colors.primary} />
        ) : status.playing ? (
          <Pause size={16} color={fg} />
        ) : (
          <Play size={16} color={fg} />
        )}
      </Pressable>

      <View style={styles.body}>
        <View style={[styles.track, { backgroundColor: track }]}>
          <View style={[styles.fill, { backgroundColor: fill, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.duration, { color: failed ? colors.error : fg }]}>
          {failed ? t('mobile.chat.voice_failed') : formatVoiceDuration(shownMs)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 190,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  duration: {
    ...typography.caption,
    fontSize: 11,
  },
});
