import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { VideoView } from '@livekit/react-native';
import {
  ChevronDown,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ShieldCheck,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
  WifiLow,
} from 'lucide-react-native';

import { CallAvatar } from '@/components/call/CallAvatar';
import { VerificationPlate } from '@/components/call/VerificationPlate';
import { useCall } from '@/contexts/CallContext';
import { useCallTimer } from '@/hooks/useCallTimer';
import { callStatusText } from '@/lib/calls/callState';
import { colors, spacing, typography } from '@/theme';

const CALL_BACKGROUND = '#0B0D12';
const ANSWER_GREEN = '#16A34A';

type ControlProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
  /** Toggle that is currently "on" (muted, speaker, camera off…) — inverted colors. */
  active?: boolean;
  tone?: 'neutral' | 'danger' | 'answer';
  showLabel?: boolean;
  testID?: string;
};

/** A 64pt round control with an optional caption — sized for one-handed use. */
function CallControl({ label, onPress, children, active = false, tone = 'neutral', showLabel = false, testID }: ControlProps) {
  const background =
    tone === 'danger'
      ? colors.error
      : tone === 'answer'
        ? ANSWER_GREEN
        : active
          ? colors.white
          : 'rgba(255, 255, 255, 0.12)';

  return (
    <View style={styles.controlWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={tone === 'neutral' ? { selected: active } : undefined}
        style={({ pressed }) => [styles.control, { backgroundColor: background }, pressed && styles.pressed]}
        testID={testID}
      >
        {children}
      </Pressable>
      {showLabel && <Text style={styles.controlLabel}>{label}</Text>}
    </View>
  );
}

/**
 * The call itself: incoming (answer / decline), ringing, and in-call for
 * voice and video. Navigating away keeps the call going — the "return to
 * call" bar brings the person back here.
 */
export default function CallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const call = useCall();
  const state = call?.state;
  const seconds = useCallTimer(state?.phase === 'active' ? state.startedAt : null);

  // Nothing (left) to show — e.g. the outcome was displayed and cleared.
  const idle = !state || state.phase === 'idle';
  useEffect(() => {
    if (!idle) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [idle, router]);

  if (!call || !state || idle) {
    return <View style={styles.root} />;
  }

  const video = state.type === 'video';
  const live = state.phase === 'connecting' || state.phase === 'active';
  const localTrack = video && state.cameraOn && live ? call.media?.localVideoTrack() : undefined;
  const remoteVideo = video && state.phase === 'active' ? call.remoteVideoTrack : null;
  const title = state.peer?.title ?? t('mobile.call.unknown_peer');
  const status = callStatusText(state, seconds, t);
  const iconColor = (active: boolean) => (active ? CALL_BACKGROUND : colors.white);

  return (
    <View style={styles.root}>
      {remoteVideo && (
        <VideoView videoTrack={remoteVideo} objectFit="cover" style={StyleSheet.absoluteFill} />
      )}

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          {live || state.phase === 'outgoing' ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('mobile.call.minimize')}
              style={styles.iconBtn}
              testID="call-minimize"
            >
              <ChevronDown size={26} color={colors.white} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          {state.phase === 'active' && state.e2ee && state.verificationCode ? (
            <VerificationPlate code={state.verificationCode} />
          ) : state.phase === 'active' ? (
            <View style={styles.transportRow} testID="call-transport-only">
              <ShieldCheck size={14} color={colors.textMuted} />
              <Text style={styles.transportText}>{t('mobile.call.transport_encrypted')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.center}>
          {remoteVideo ? (
            <View style={styles.videoCaption}>
              <Text style={styles.titleSmall} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.status}>{status}</Text>
            </View>
          ) : (
            <>
              <CallAvatar peer={state.peer} />
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.status} accessibilityLiveRegion="polite" testID="call-status">
                {status}
              </Text>
            </>
          )}
          {state.quality === 'poor' && state.phase === 'active' && (
            <View style={styles.weak}>
              <WifiLow size={14} color="#FCD34D" />
              <Text style={styles.weakText}>{t('mobile.call.weak_connection')}</Text>
            </View>
          )}
        </View>

        {localTrack && (
          <View style={styles.pip}>
            <VideoView videoTrack={localTrack} objectFit="cover" mirror zOrder={1} style={StyleSheet.absoluteFill} />
          </View>
        )}

        {state.phase === 'incoming' && (
          <View style={styles.answerRow}>
            <CallControl label={t('mobile.call.decline')} onPress={call.decline} tone="danger" showLabel testID="call-decline">
              <PhoneOff size={28} color={colors.white} />
            </CallControl>
            <CallControl label={t('mobile.call.accept')} onPress={() => void call.accept()} tone="answer" showLabel testID="call-accept">
              {video ? <Video size={28} color={colors.white} /> : <Phone size={28} color={colors.white} />}
            </CallControl>
          </View>
        )}

        {(live || state.phase === 'outgoing') && (
          <View style={styles.controls}>
            {live && (
              <View style={styles.controlRow}>
                <CallControl
                  label={t(state.muted ? 'mobile.call.unmute' : 'mobile.call.mute')}
                  onPress={call.toggleMute}
                  active={state.muted}
                  testID="call-mute"
                >
                  {state.muted ? <MicOff size={24} color={iconColor(true)} /> : <Mic size={24} color={iconColor(false)} />}
                </CallControl>
                <CallControl
                  label={t(state.speakerOn ? 'mobile.call.speaker_off' : 'mobile.call.speaker_on')}
                  onPress={call.toggleSpeaker}
                  active={state.speakerOn}
                  testID="call-speaker"
                >
                  <Volume2 size={24} color={iconColor(state.speakerOn)} />
                </CallControl>
                {video && (
                  <CallControl
                    label={t(state.cameraOn ? 'mobile.call.camera_off' : 'mobile.call.camera_on')}
                    onPress={call.toggleCamera}
                    active={!state.cameraOn}
                    testID="call-camera"
                  >
                    {state.cameraOn ? (
                      <Video size={24} color={iconColor(false)} />
                    ) : (
                      <VideoOff size={24} color={iconColor(true)} />
                    )}
                  </CallControl>
                )}
                {video && state.cameraOn && (
                  <CallControl label={t('mobile.call.switch_camera')} onPress={call.switchCamera} testID="call-flip">
                    <SwitchCamera size={24} color={colors.white} />
                  </CallControl>
                )}
              </View>
            )}
            <CallControl
              label={t(state.phase === 'outgoing' ? 'mobile.call.cancel' : 'mobile.call.hang_up')}
              onPress={call.hangup}
              tone="danger"
              testID="call-hangup"
            >
              <PhoneOff size={28} color={colors.white} />
            </CallControl>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CALL_BACKGROUND,
  },
  safe: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    minHeight: 56,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  transportText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  videoCaption: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.screenTitle,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  titleSmall: {
    ...typography.sectionTitle,
    color: colors.white,
  },
  status: {
    ...typography.body,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  weak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  weakText: {
    ...typography.caption,
    color: '#FCD34D',
  },
  pip: {
    position: 'absolute',
    right: spacing.md,
    bottom: 200,
    width: 104,
    height: 144,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: colors.surface,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  controls: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  controlWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  control: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  controlLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
