import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, gradients, radii, typography } from '@/theme';

type GradientButtonProps = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
  disabled?: boolean;
  /** Fill parent height (use with a fixed-height wrapper; removes vertical padding). */
  fillHeight?: boolean;
};

export function GradientButton({
  label,
  onPress,
  style,
  compact = false,
  disabled = false,
  fillHeight = false,
}: GradientButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[...gradients.primary]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.gradient,
          compact && styles.compact,
          fillHeight && styles.gradientFill,
        ]}
      >
        <Text
          style={[styles.label, compact && styles.compactLabel, fillHeight && styles.fillLabel]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.button,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  gradient: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientFill: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  compact: {
    paddingVertical: 10,
  },
  label: {
    ...typography.sectionTitle,
    color: colors.white,
    fontSize: 14,
  },
  fillLabel: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    includeFontPadding: false,
  },
  compactLabel: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
