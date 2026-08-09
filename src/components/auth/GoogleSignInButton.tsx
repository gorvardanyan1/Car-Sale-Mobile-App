import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import { colors, radii, spacing, typography } from '@/theme';

type GoogleSignInButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * "Continue with Google".
 *
 * Deliberately a *secondary* surface rather than the blue gradient: the app has
 * one primary action per screen, and giving a second button the same weight
 * flattens the hierarchy. It borrows the TextField's surface and border so it
 * reads as part of the same form.
 *
 * The G mark is Google's own artwork and must not be recoloured, resized
 * out of proportion, or placed on a background it fails contrast against —
 * hence the fixed 20pt mark on a light-neutral tile inside the dark button.
 */
export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
  style,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.continue_with_google')}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID="google-sign-in-button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textSecondary} testID="google-sign-in-spinner" />
      ) : (
        <>
          <View style={styles.logoTile}>
            <GoogleMark />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {t('auth.continue_with_google')}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Google's official four-colour "G". */
function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

/** Labelled rule separating the social button from the email form. */
export function AuthDivider({ label }: { label: string }) {
  return (
    <View accessible accessibilityRole="text" style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    // 48pt tall at this padding — comfortably past the 44pt minimum target.
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: 14,
    paddingHorizontal: spacing.md + spacing.xs,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  logoTile: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    // The mark needs a light ground to stay legible and on-brand against the
    // dark button.
    backgroundColor: colors.white,
  },
  label: {
    ...typography.sectionTitle,
    fontSize: 14,
    color: colors.textSecondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textSubtle,
    textTransform: 'lowercase',
  },
});
