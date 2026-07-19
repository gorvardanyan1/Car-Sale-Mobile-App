import { Sparkles, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/ui/GradientButton';
import type { AiPriceSuggestion } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

type AnnouncementPriceSuggestionModalProps = {
  visible: boolean;
  loading: boolean;
  suggestion: AiPriceSuggestion | null;
  error: string | null;
  onClose: () => void;
  onUsePrice: (price: number | string) => void;
};

export function AnnouncementPriceSuggestionModal({
  visible,
  loading,
  suggestion,
  error,
  onClose,
  onUsePrice,
}: AnnouncementPriceSuggestionModalProps) {
  const { t } = useTranslation();
  const canUsePrice = suggestion?.recommended_price != null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Sparkles color={colors.primaryLight} size={18} />
              <Text style={styles.title}>{t('announcement.ai_price_suggestion_title')}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
              <X color={colors.textSubtle} size={20} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.body}>
              {suggestion?.recommended_price != null ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{t('announcement.price_recommended')}</Text>
                  <Text style={styles.rowValueStrong}>{suggestion.recommended_price}</Text>
                </View>
              ) : null}

              {suggestion?.min_price != null || suggestion?.max_price != null ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{t('announcement.price_range')}</Text>
                  <Text style={styles.rowValue}>
                    {suggestion?.min_price ?? '—'} - {suggestion?.max_price ?? '—'}
                  </Text>
                </View>
              ) : null}

              {suggestion?.confidence ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{t('announcement.price_confidence')}</Text>
                  <Text style={styles.rowValue}>{suggestion.confidence}</Text>
                </View>
              ) : null}

              {suggestion?.reason ? (
                <View style={styles.reasonBlock}>
                  <Text style={styles.rowLabel}>{t('announcement.price_reason')}</Text>
                  <Text style={styles.reasonText}>{suggestion.reason}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.closeAction}>
              <Text style={styles.closeActionText}>{t('common.close')}</Text>
            </Pressable>
            <GradientButton
              label={t('announcement.use_this_price')}
              onPress={() => {
                if (suggestion?.recommended_price != null) {
                  onUsePrice(suggestion.recommended_price);
                }
              }}
              disabled={!canUsePrice}
              style={styles.useAction}
            />
          </View>
        </Pressable>
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
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  body: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  rowValue: {
    ...typography.body,
    color: colors.text,
  },
  rowValueStrong: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  reasonBlock: {
    gap: spacing.xs,
  },
  reasonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  closeAction: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    fontSize: 14,
  },
  useAction: {
    flex: 1,
  },
});
