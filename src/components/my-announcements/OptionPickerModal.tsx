import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '@/theme';

type OptionPickerModalProps<T extends string> = {
  visible: boolean;
  title: string;
  value: T;
  options: ReadonlyArray<{ value: T; labelKey: string }>;
  onClose: () => void;
  onChange: (value: T) => void;
};

export function OptionPickerModal<T extends string>({
  visible,
  title,
  value,
  options,
  onClose,
  onChange,
}: OptionPickerModalProps<T>) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value || 'all'}
                onPress={() => {
                  onChange(option.value);
                  onClose();
                }}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  optionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  optionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
