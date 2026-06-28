import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ARCHIVE_SORT_OPTIONS } from '@/constants/archive';
import type { ArchiveSort } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

type SortPickerModalProps = {
  visible: boolean;
  value: ArchiveSort;
  onClose: () => void;
  onChange: (sort: ArchiveSort) => void;
  onRequestNearest: () => void;
};

export function SortPickerModal({
  visible,
  value,
  onClose,
  onChange,
  onRequestNearest,
}: SortPickerModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t('mobile.archive.sort_by')}</Text>
          {ARCHIVE_SORT_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (option.value === 'nearest') {
                    onRequestNearest();
                  } else {
                    onChange(option.value);
                  }
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
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
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
    fontWeight: '600',
  },
});
