import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';

type ConfirmActionTone = 'danger' | 'warning';

const TONE_CONFIG: Record<
  ConfirmActionTone,
  { glow: string; iconGradient: readonly [string, string]; confirmGradient: readonly [string, string] }
> = {
  danger: {
    glow: 'rgba(239, 68, 68, 0.16)',
    iconGradient: ['#F87171', '#DC2626'],
    confirmGradient: ['#F87171', '#DC2626'],
  },
  warning: {
    glow: 'rgba(245, 158, 11, 0.16)',
    iconGradient: ['#FBBF24', '#D97706'],
    confirmGradient: ['#FBBF24', '#D97706'],
  },
};

type ConfirmActionModalProps = {
  visible: boolean;
  tone?: ConfirmActionTone;
  icon: LucideIcon;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmActionModal({
  visible,
  tone = 'danger',
  icon: Icon,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const { t } = useTranslation();
  const toneConfig = TONE_CONFIG[tone];

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 16, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = 0.9;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={loading ? undefined : onClose}>
        <Animated.View style={cardStyle}>
          <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.iconGlow, { backgroundColor: toneConfig.glow }]}>
              <LinearGradient
                colors={toneConfig.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBadge}
              >
                <Icon color={colors.white} size={28} strokeWidth={2.25} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={({ pressed }) => [
                  styles.cancelAction,
                  pressed && !loading && styles.cancelActionPressed,
                ]}
                testID="confirm-action-modal-cancel"
              >
                <Text style={styles.cancelActionText}>{cancelLabel ?? t('common.cancel')}</Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                disabled={loading}
                style={({ pressed }) => [
                  styles.confirmAction,
                  pressed && !loading && styles.confirmActionPressed,
                  loading && styles.confirmActionDisabled,
                ]}
                testID="confirm-action-modal-confirm"
              >
                <LinearGradient
                  colors={toneConfig.confirmGradient}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.confirmGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.confirmActionText} numberOfLines={1}>
                      {confirmLabel}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: 320,
    maxWidth: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconGlow: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  cancelAction: {
    flex: 1,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelActionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  cancelActionText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    fontSize: 14,
  },
  confirmAction: {
    flex: 1,
    borderRadius: radii.button,
    overflow: 'hidden',
  },
  confirmActionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  confirmActionDisabled: {
    opacity: 0.75,
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionText: {
    ...typography.sectionTitle,
    color: colors.white,
    fontSize: 14,
  },
});
