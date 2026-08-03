import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '@/i18n';
import { translateChatMessage } from '@/services/chatTranslateService';
import { colors, radii, spacing, typography } from '@/theme';

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'am', label: 'ՀԱՅ' },
  { code: 'ru', label: 'РУ' },
];

type Props = {
  text: string;
  align: 'left' | 'right';
};

export function ChatMessageTranslate({ text, align }: Props) {
  const { t, i18n } = useTranslation();
  const siteDefaultLanguage = (
    LANGUAGE_OPTIONS.some((option) => option.code === i18n.language) ? i18n.language : 'en'
  ) as SupportedLanguage;

  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(siteDefaultLanguage);
  const [translations, setTranslations] = useState<Partial<Record<SupportedLanguage, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);

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

    if (translations[langCode]) {
      setIsShowingTranslation(true);
    } else if (isShowingTranslation) {
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

        <View style={styles.languageChips} testID="chat-translate-language-select">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.code === targetLanguage;
            return (
              <Pressable
                key={option.code}
                onPress={() => handleSelectLanguage(option.code)}
                style={[styles.chip, isSelected && styles.chipSelected]}
                testID={`chat-translate-language-${option.code}`}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
    maxWidth: '78%',
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
  languageChips: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  chipText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSubtle,
  },
  chipTextSelected: {
    color: colors.primaryLight,
    fontWeight: '600',
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
