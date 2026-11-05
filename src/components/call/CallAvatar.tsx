import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import type { CallPeer } from '@/lib/calls/callState';

/** The other party's listing photo / dealer logo, or their initial. */
export function CallAvatar({ peer, size = 112 }: { peer: CallPeer | null; size?: number }) {
  const dims = { width: size, height: size, borderRadius: size / 2 };

  if (peer?.imageUrl) {
    return <Image source={{ uri: peer.imageUrl }} style={[styles.ring, dims]} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={[styles.ring, styles.fallback, dims]}>
      <Text style={[styles.initial, { fontSize: size * 0.36 }]}>{peer?.initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  fallback: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.white,
    fontWeight: '700',
  },
});
