import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';

const DOT_COUNT = 3;
const DOT_CYCLE_MS = 1200;
const DOT_STAGGER_MS = 160;

/**
 * "typing…" bubble, shaped like an incoming message so it reads as part of the
 * thread rather than a status bar bolted onto it.
 *
 * The dots animate on the native driver (opacity only) so the loop does not
 * compete with the message list for JS-thread time while someone is scrolling.
 */
export function ChatTypingIndicator() {
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);

  // One value per dot, created once and kept across renders so the loop is
  // never restarted. Lazy useState rather than a ref: these are read during
  // render, which is exactly what refs are not for.
  const [dots] = useState(() =>
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0.35)),
  );

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduceMotion(enabled);
      })
      .catch(() => {
        // Unsupported platform — animating is the safe default.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotion(enabled),
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      dots.forEach((dot) => dot.setValue(0.6));
      return undefined;
    }

    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * DOT_STAGGER_MS),
          Animated.timing(dot, {
            toValue: 1,
            duration: DOT_CYCLE_MS / 3,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: DOT_CYCLE_MS / 3,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(DOT_CYCLE_MS / 3 - index * DOT_STAGGER_MS),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [dots, reduceMotion]);

  return (
    <View
      style={styles.row}
      testID="chat-typing-indicator"
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={t('mobile.chat.typing')}
    >
      <View style={styles.bubble}>
        <View style={styles.dots}>
          {dots.map((dot, index) => (
            <Animated.View key={index} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
        <Text style={styles.label}>{t('mobile.chat.typing')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs / 2,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});
