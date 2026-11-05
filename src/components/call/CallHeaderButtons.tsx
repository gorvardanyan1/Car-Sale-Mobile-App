import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Phone, Video } from 'lucide-react-native';

import { useCall } from '@/contexts/CallContext';
import type { CallPeer } from '@/lib/calls/callState';
import { colors } from '@/theme';

/**
 * Voice/video buttons for the chat thread header — same icon size and
 * padding as the header's back button. Hidden while calls are switched off.
 */
export function CallHeaderButtons({ conversationId, peer }: { conversationId: string | null; peer: CallPeer }) {
  const { t } = useTranslation();
  const call = useCall();

  if (!call?.callsEnabled || !conversationId) {
    return null;
  }

  const disabled = !call.canStartCall;
  const tint = disabled ? colors.textDisabled : colors.textSecondary;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => void call.startCall(conversationId, 'voice', peer)}
        disabled={disabled}
        hitSlop={8}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={t('mobile.call.start_voice')}
        accessibilityState={{ disabled }}
        testID="chat-call-voice"
      >
        <Phone color={tint} size={20} />
      </Pressable>
      {call.videoCallsEnabled && (
        <Pressable
          onPress={() => void call.startCall(conversationId, 'video', peer)}
          disabled={disabled}
          hitSlop={8}
          style={styles.btn}
          accessibilityRole="button"
          accessibilityLabel={t('mobile.call.start_video')}
          accessibilityState={{ disabled }}
          testID="chat-call-video"
        >
          <Video color={tint} size={22} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    padding: 6,
  },
});
