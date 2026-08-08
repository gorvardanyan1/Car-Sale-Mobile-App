import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '@/i18n';
import { translateChatMessage } from '@/services/chatTranslateService';
import { OptionPickerModal } from '@/components/ui/OptionPickerModal';
import { colors, radii, spacing, typography } from '@/theme';

const LANGUAGE_OPTIONS: { value: SupportedLanguage; labelKey: string }[] = [
  { value: 'en', labelKey: 'mobile.settings.language_en' },
  { value: 'am', labelKey: 'mobile.settings.language_am' },
  { value: 'ru', labelKey: 'mobile.settings.language_ru' },
];

type Props = {
  text: string;
  align: 'left' | 'right';
};

export function ChatMessageTranslate({ text, align }: Props) {
  const { t, i18n } = useTranslation();
  const siteDefaultLanguage = (
    LANGUAGE_OPTIONS.some((option) => option.value === i18n.language) ? i18n.language : 'en'
  ) as SupportedLanguage;

  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(siteDefaultLanguage);
  const [translations, setTranslations] = useState<Partial<Record<SupportedLanguage, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!text.trim()) {
    return null;
  }

  const translatedText = translations[targetLanguage];

  async function runTranslate(langCode: SupportedLanguage) {
    setError(null);
    setIsTranslating(true);
    try {
      const translated = await translateChatMessage(text, langCode);
      setTranslations((prev) => ({ ...prev, [langCode]: translated }));
      setIsShowingTranslation(true);
    } catch {
      setError(t('mobile.chat.translate_failed'));
    } finally {
      setIsTranslating(false);
    }
  }

  function handleToggle() {
    if (isShowingTranslation) {
      setIsShowingTranslation(false);
      return;
    }

    if (translatedText) {
      setIsShowingTranslation(true);
      return;
    }

    void runTranslate(targetLanguage);
  }

  function handleSelectLanguage(langCode: SupportedLanguage) {
    setTargetLanguage(langCode);

    if (langCode === targetLanguage) {
      return;
    }

    // Picking from the menu is an explicit request, so always surface the
    // result rather than only refreshing an already-visible translation.
    if (translations[langCode]) {
      setIsShowingTranslation(true);
    } else {
      void runTranslate(langCode);
    }
  }

  return (
    <View style={[styles.container, align === 'right' ? styles.alignRight : styles.alignLeft]}>
      <View style={styles.row}>
        <Pressable
          onPress={handleToggle}
          disabled={isTranslating}
          style={styles.toggle}
          testID="chat-translate-toggle"
        >
          {isTranslating ? (
            <ActivityIndicator size="small" color={colors.primaryLight} />
          ) : (
            <Languages size={12} color={colors.primaryLight} />
          )}
          <Text style={styles.toggleText}>
            {isTranslating
              ? t('mobile.chat.translating')
              : isShowingTranslation
                ? t('mobile.chat.show_original')
                : t('mobile.chat.translate')}
          </Text>
        </Pressable>

        {/* Compact trigger + chevron, mirroring the web bubble: three inline
            chips crowded the row on narrow phones. */}
        <Pressable
          onPress={() => setIsPickerOpen(true)}
          style={styles.languageTrigger}
          accessibilityRole="button"
          accessibilityLabel={t('mobile.chat.select_language')}
          testID="chat-translate-language-select"
        >
          <Text style={styles.languageTriggerText}>{targetLanguage.toUpperCase()}</Text>
          <ChevronDown size={12} color={colors.textSubtle} />
        </Pressable>
      </View>

      <OptionPickerModal<SupportedLanguage>
        visible={isPickerOpen}
        title={t('mobile.chat.select_language')}
        value={targetLanguage}
        options={LANGUAGE_OPTIONS}
        onClose={() => setIsPickerOpen(false)}
        onChange={handleSelectLanguage}
      />

      {isShowingTranslation && translatedText && (
        <Text style={styles.translatedText} testID="chat-translated-text">
          {translatedText}
        </Text>
      )}

      {error && (
        <Text style={styles.errorText} testID="chat-translate-error">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    // The 78% cap is applied by the bubble's translate slot; repeating it here
    // would compound to ~61% of the row.
    maxWidth: '100%',
    gap: 2,
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primaryLight,
  },
  languageTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageTriggerText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSubtle,
  },
  translatedText: {
    ...typography.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.error,
  },
});
