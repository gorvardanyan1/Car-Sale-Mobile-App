import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PhoneOff } from 'lucide-react-native';

import { useCall } from '@/contexts/CallContext';
import { useCallTimer } from '@/hooks/useCallTimer';
import { callStatusText, isCallBusy } from '@/lib/calls/callState';
import { colors, spacing, typography } from '@/theme';

/**
 * A call keeps going while the person browses the app; this pill (above the
 * tab bar) shows it's still on and takes them back with one tap.
 */
export function CallReturnBar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const call = useCall();
  const state = call?.state;
  const seconds = useCallTimer(state?.phase === 'active' ? state.startedAt : null);

  if (!call || !state || !isCallBusy(state) || pathname === '/call') {
    return null;
  }

  const title = state.peer?.title ?? t('mobile.call.unknown_peer');

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 72 }]}>
      <View style={styles.bar} testID="call-return-bar">
        <Pressable
          onPress={() => router.push('/call')}
          accessibilityRole="button"
          accessibilityLabel={t('mobile.call.expand')}
          style={styles.main}
        >
          <View style={styles.dot} />
          <View style={styles.texts}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.status}>{callStatusText(state, seconds, t)}</Text>
          </View>
        </Pressable>
        {state.phase !== 'incoming' && (
          <Pressable
            onPress={call.hangup}
            accessibilityRole="button"
            accessibilityLabel={t('mobile.call.hang_up')}
            style={styles.hangup}
            hitSlop={4}
            testID="call-return-hangup"
          >
            <PhoneOff size={18} color={colors.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#14532D',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  status: {
    ...typography.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontVariant: ['tabular-nums'],
  },
  hangup: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
