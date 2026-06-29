import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DEALER_SORT_OPTIONS } from '@/constants/dealers';
import type { DealerSort } from '@/types/dealer';
import { colors, radii, spacing, typography } from '@/theme';

type DealerSortModalProps = {
  visible: boolean;
  activeSort: DealerSort;
  onClose: () => void;
  onSelect: (sort: DealerSort) => void;
};

export function DealerSortModal({ visible, activeSort, onClose, onSelect }: DealerSortModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{t('dealer.sort_top_rated').replace('Sort: ', '')}</Text>
          {DEALER_SORT_OPTIONS.map((option) => {
            const active = option.value === activeSort;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                style={[styles.option, active && styles.optionActive]}
                testID={`dealer-sort-${option.value}`}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  option: {
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  optionText: {
    ...typography.body,
    color: colors.textMuted,
  },
  optionTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
