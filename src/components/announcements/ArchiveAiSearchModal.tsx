import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { ListingCard } from '@/components/announcements/ListingCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useFavorites } from '@/contexts/FavoritesContext';
import { buildArchiveAiFilterChips } from '@/lib/announcements/buildArchiveAiFilterChips';
import {
  ArchiveAiSearchApiError,
  fetchArchiveAiSearch,
  type ArchiveAiSearchMeta,
} from '@/services/archiveAiSearchService';
import type { Announcement } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

const EXAMPLE_PROMPTS = [
  'archive.ai.example_mercedes',
  'archive.ai.example_suv',
  'archive.ai.example_budget',
] as const;

const aiColors = {
  violet: '#7C3AED',
  violetLight: 'rgba(124, 58, 237, 0.15)',
  violetBorder: 'rgba(139, 92, 246, 0.45)',
  indigo: '#4F46E5',
};

type ArchiveAiSearchModalProps = {
  visible: boolean;
  countryId?: string | number | null;
  currencyId?: string | number | null;
  currencySymbol?: string;
  onClose: () => void;
  onOpenListing: (announcement: Announcement) => void;
};

export function ArchiveAiSearchModal({
  visible,
  countryId = null,
  currencyId = null,
  currencySymbol = '$',
  onClose,
  onOpenListing,
}: ArchiveAiSearchModalProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [searchParams, setSearchParams] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<ArchiveAiSearchMeta | null>(null);

  const filterChips = useMemo(
    () => buildArchiveAiFilterChips(filters, t, currencySymbol),
    [filters, t, currencySymbol],
  );
  const showFallbackNotice = meta?.ai_parsed === false;

  function resolveSearchErrorMessage(searchError: unknown): string {
    if (searchError instanceof ArchiveAiSearchApiError) {
      if (searchError.status === 429) {
        return t('archive.ai.rate_limit');
      }

      if (searchError.status === 422) {
        return searchError.message || t('archive.ai.unparsed');
      }
    }

    return t('archive.ai.error');
  }

  function resetResults() {
    setAnnouncements([]);
    setFilters({});
    setSearchParams(null);
    setMeta(null);
    setError('');
  }

  async function handleSearch(messageOverride: string | null = null) {
    const message = (messageOverride ?? prompt).trim();
    if (!message || loading) {
      return;
    }

    setLoading(true);
    setError('');
    resetResults();
    setPrompt(message);

    try {
      const response = await fetchArchiveAiSearch({
        message,
        country_id: countryId || undefined,
        currency_id: currencyId || undefined,
        page: 1,
      });

      setAnnouncements(response.announcements);
      setFilters(response.filters);
      setSearchParams(response.search_params);
      setMeta(response.meta);
    } catch (searchError) {
      setError(resolveSearchErrorMessage(searchError));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!searchParams || loadingMore || !meta?.has_more) {
      return;
    }

    const nextPage = (meta.current_page ?? 1) + 1;
    setLoadingMore(true);
    setError('');

    try {
      const response = await fetchArchiveAiSearch({
        search_params: searchParams,
        country_id: countryId || undefined,
        currency_id: currencyId || undefined,
        page: nextPage,
      });

      setAnnouncements((prev) => [...prev, ...response.announcements]);
      setMeta(response.meta);
    } catch (loadMoreError) {
      setError(resolveSearchErrorMessage(loadMoreError));
    } finally {
      setLoadingMore(false);
    }
  }

  function handleExampleClick(key: (typeof EXAMPLE_PROMPTS)[number]) {
    const example = t(key);
    setPrompt(example);
    void handleSearch(example);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <LinearGradient colors={[aiColors.violet, aiColors.indigo]} style={styles.headerIcon}>
              <Sparkles color={colors.white} size={20} />
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('archive.ai.title')}</Text>
              <Text style={styles.subtitle}>{t('archive.ai.subtitle')}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('archive.ai.close')}
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
          <View style={styles.formSection}>
            <Text style={styles.promptLabel}>{t('archive.ai.prompt_label')}</Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder={t('archive.ai.prompt_placeholder')}
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.promptInput}
            />

            <View style={styles.exampleRow}>
              {EXAMPLE_PROMPTS.map((key) => (
                <Pressable key={key} onPress={() => handleExampleClick(key)} style={styles.exampleChip}>
                  <Text style={styles.exampleChipText}>{t(key)}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => void handleSearch()}
              disabled={loading || !prompt.trim()}
              style={[styles.searchButton, (loading || !prompt.trim()) && styles.searchButtonDisabled]}
            >
              <LinearGradient colors={[aiColors.violet, aiColors.indigo]} style={styles.searchButtonGradient}>
                {loading ? (
                  <>
                    <ActivityIndicator color={colors.white} size="small" />
                    <Text style={styles.searchButtonText}>{t('archive.ai.searching')}</Text>
                  </>
                ) : (
                  <>
                    <Sparkles color={colors.white} size={16} />
                    <Text style={styles.searchButtonText}>{t('archive.ai.search_button')}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {showFallbackNotice && !error ? (
            <View style={styles.fallbackBanner} testID="archive-ai-fallback-notice">
              <Text style={styles.fallbackText}>{t('archive.ai.fallback_notice')}</Text>
            </View>
          ) : null}

          {filterChips.length > 0 ? (
            <View style={styles.chipRow}>
              {filterChips.map((chip) => (
                <View key={chip} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={aiColors.violet} size="large" />
              <Text style={styles.stateText}>{t('archive.ai.analyzing')}</Text>
            </View>
          ) : null}

          {!loading && announcements.length === 0 && searchParams ? (
            <View style={styles.emptyResults}>
              <Text style={styles.stateText}>{t('archive.no_results')}</Text>
            </View>
          ) : null}

          {!loading && announcements.length > 0 ? (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsCount}>
                {t('archive.ai.results_count', {
                  shown: announcements.length,
                  total: meta?.total ?? announcements.length,
                })}
              </Text>

              {announcements.map((announcement) => (
                <View key={announcement.id} style={styles.resultCard}>
                  <ListingCard
                    announcement={announcement}
                    isFavorite={isFavorite(announcement)}
                    onPress={onOpenListing}
                    onToggleFavorite={(item) => void toggleFavorite(item)}
                  />
                </View>
              ))}

              {meta?.has_more ? (
                <View style={styles.loadMoreWrap}>
                  <GradientButton
                    label={loadingMore ? t('archive.ai.loading_more') : t('archive.load_more_cars')}
                    compact
                    onPress={() => void handleLoadMore()}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function ArchiveAiSearchButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('archive.ai.open')}
      onPress={onPress}
      style={styles.toggleButton}
    >
      <Sparkles color={aiColors.violet} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  formSection: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  promptLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  promptInput: {
    minHeight: 110,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  exampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exampleChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: aiColors.violetBorder,
    backgroundColor: aiColors.violetLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  exampleChipText: {
    ...typography.caption,
    color: '#C4B5FD',
    fontSize: 12,
  },
  searchButton: {
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  searchButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.errorMuted,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  fallbackBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    padding: spacing.sm,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.warning,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  filterChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  stateText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyResults: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  resultCard: {
    marginBottom: spacing.sm,
  },
  loadMoreWrap: {
    paddingVertical: spacing.sm,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: aiColors.violetBorder,
    backgroundColor: aiColors.violetLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
