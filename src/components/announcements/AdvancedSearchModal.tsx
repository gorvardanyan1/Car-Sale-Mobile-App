import { AtSign, Minus, Plus, RotateCcw, SearchCode, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { GradientButton } from '@/components/ui/GradientButton';
import {
  buildAdvancedSearchQuery,
  emptyAdvancedSearchFields,
  hasAdvancedSearchFields,
  parseAdvancedSearchQuery,
  type AdvancedSearchFields,
} from '@/lib/announcements/advancedSearchQuery';
import { colors, radii, spacing, typography } from '@/theme';

type AdvancedSearchModalProps = {
  visible: boolean;
  currentSearch: string;
  onClose: () => void;
  onSearch: (query: string) => void;
};

export function AdvancedSearchModal({
  visible,
  currentSearch,
  onClose,
  onSearch,
}: AdvancedSearchModalProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<AdvancedSearchFields>(emptyAdvancedSearchFields());

  useEffect(() => {
    if (visible) {
      setFields(parseAdvancedSearchQuery(currentSearch));
    }
    // Re-parse only when the modal opens, not on every keystroke of currentSearch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleChange(key: keyof AdvancedSearchFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setFields(emptyAdvancedSearchFields());
  }

  function handleSubmit() {
    const query = buildAdvancedSearchQuery(fields);
    onSearch(query);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.header}>
            <View style={styles.headerTitleBlock}>
              <View style={styles.headerIcon}>
                <SearchCode color={colors.white} size={20} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('search.advanced')}</Text>
                <Text style={styles.subtitle}>{t('search.advanced_subtitle')}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('search.advanced_close')}
              onPress={onClose}
              hitSlop={8}
            >
              <X color={colors.textMuted} size={22} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <AdvancedSearchField
              icon={<Plus color={colors.primaryLight} size={12} strokeWidth={3} />}
              iconBackground="rgba(59, 130, 246, 0.15)"
              label={t('search.all_words')}
              hint={t('search.all_words_hint')}
              placeholder={t('search.all_words_placeholder')}
              value={fields.allOfTheseWords}
              onChangeText={(value) => handleChange('allOfTheseWords', value)}
              testID="advanced-search-all-words"
            />

            <AdvancedSearchField
              icon={<Text style={styles.fieldIconGlyph}>∼</Text>}
              iconBackground="rgba(139, 92, 246, 0.15)"
              label={t('search.any_words')}
              hint={t('search.any_words_hint')}
              placeholder={t('search.any_words_placeholder')}
              value={fields.anyOfTheseWords}
              onChangeText={(value) => handleChange('anyOfTheseWords', value)}
              testID="advanced-search-any-words"
            />

            <AdvancedSearchField
              icon={<Minus color="#F87171" size={12} strokeWidth={3} />}
              iconBackground="rgba(239, 68, 68, 0.15)"
              label={t('search.none_words')}
              hint={t('search.none_words_hint')}
              placeholder={t('search.none_words_placeholder')}
              value={fields.noneOfTheseWords}
              onChangeText={(value) => handleChange('noneOfTheseWords', value)}
              testID="advanced-search-none-words"
            />

            <AdvancedSearchField
              icon={<AtSign color="#4ADE80" size={12} strokeWidth={3} />}
              iconBackground="rgba(34, 197, 94, 0.15)"
              label={t('search.author')}
              hint={t('search.author_hint')}
              placeholder={t('search.author_placeholder')}
              value={fields.author}
              onChangeText={(value) => handleChange('author', value)}
              testID="advanced-search-author"
              autoCapitalize="none"
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={styles.resetButton}
              onPress={handleReset}
              disabled={!hasAdvancedSearchFields(fields)}
              accessibilityRole="button"
              accessibilityLabel={t('search.advanced_clear')}
            >
              <RotateCcw
                color={hasAdvancedSearchFields(fields) ? colors.textSecondary : colors.textDisabled}
                size={16}
              />
            </Pressable>
            <View style={styles.submitButtonWrap}>
              <GradientButton label={t('search.search_now')} onPress={handleSubmit} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function AdvancedSearchButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('search.advanced')}
      onPress={onPress}
      style={styles.toggleButton}
      testID="advanced-search-toggle"
    >
      <SearchCode color={colors.primaryLight} size={20} />
    </Pressable>
  );
}

type AdvancedSearchFieldProps = {
  icon: React.ReactNode;
  iconBackground: string;
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  testID?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function AdvancedSearchField({
  icon,
  iconBackground,
  label,
  hint,
  placeholder,
  value,
  onChangeText,
  testID,
  autoCapitalize,
}: AdvancedSearchFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelRow}>
        <View style={[styles.fieldIconBadge, { backgroundColor: iconBackground }]}>{icon}</View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        style={styles.fieldInput}
        autoCapitalize={autoCapitalize}
        testID={testID}
      />
      <Text style={styles.fieldHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.icon,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 18,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldIconBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  fieldIconGlyph: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonWrap: {
    flex: 1,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
