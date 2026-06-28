import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '@/i18n';
import { setStoredLanguage } from '@/lib/i18n/languageStorage';
import { colors, radii, spacing, typography } from '@/theme';

const LANGUAGE_OPTIONS: { code: SupportedLanguage; labelKey: string }[] = [
  { code: 'en', labelKey: 'mobile.settings.language_en' },
  { code: 'am', labelKey: 'mobile.settings.language_am' },
  { code: 'ru', labelKey: 'mobile.settings.language_ru' },
];

type LanguagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function LanguagePickerModal({ visible, onClose }: LanguagePickerModalProps) {
  const { t, i18n } = useTranslation();
  const current = i18n.language as SupportedLanguage;

  async function selectLanguage(code: SupportedLanguage) {
    await setStoredLanguage(code);
    await i18n.changeLanguage(code);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t('mobile.settings.language')}</Text>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.code === current;
            return (
              <Pressable
                key={option.code}
                onPress={() => void selectLanguage(option.code)}
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
