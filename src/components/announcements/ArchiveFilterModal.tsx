import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { NumberField, SelectField } from '@/components/ui/SelectField';
import { GradientButton } from '@/components/ui/GradientButton';
import {
  DRIVE_TYPE_OPTIONS,
  MILEAGE_UNIT_OPTIONS,
  TRANSMISSION_OPTIONS,
} from '@/constants/archive';
import { resolveStorageImageUrl } from '@/lib/announcements/formatAnnouncement';
import { fetchBrandModels, fetchPlaces } from '@/services/announcementService';
import type { ArchiveConfig, ArchiveFilterState } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

type ArchiveFilterModalProps = {
  visible: boolean;
  config: ArchiveConfig;
  filters: ArchiveFilterState;
  onClose: () => void;
  onApply: (filters: ArchiveFilterState) => void;
  onReset: () => void;
};

export function ArchiveFilterModal({
  visible,
  config,
  filters,
  onClose,
  onApply,
  onReset,
}: ArchiveFilterModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ArchiveFilterState>(filters);
  const [models, setModels] = useState<{ id: number; model: string }[]>([]);
  const [places, setPlaces] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      if (!draft.brand_id) {
        setModels([]);
        return;
      }

      const result = await fetchBrandModels(draft.brand_id);
      if (!cancelled) {
        setModels(result);
      }
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [draft.brand_id]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      if (!draft.country_id) {
        setPlaces([]);
        return;
      }

      const result = await fetchPlaces({ countryId: draft.country_id });
      if (!cancelled) {
        setPlaces(result);
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [draft.country_id]);

  const subcategoryOptions = useMemo(
    () => [
      { value: '' as const, label: t('mobile.archive.subcategory_all'), icon: null },
      ...config.subcategoryFilters.map((item) => ({
        value: item.slug,
        label: item.name || item.slug,
        icon: item.icon_url ? resolveStorageImageUrl(item.icon_url) : null,
      })),
    ],
    [config.subcategoryFilters, t],
  );

  const brandOptions = useMemo(
    () => [
      { value: '' as const, label: t('filters.all_brands') },
      ...config.brands.map((brand) => ({ value: brand.id, label: brand.brand })),
    ],
    [config.brands, t],
  );

  const modelOptions = useMemo(
    () => [
      { value: '' as const, label: t('filters.all_models') },
      ...models.map((model) => ({ value: model.id, label: model.model })),
    ],
    [models, t],
  );

  const countryOptions = useMemo(
    () => [
      { value: '' as const, label: t('filters.all_countries') },
      ...config.countries.map((country) => ({ value: country.id, label: country.country })),
    ],
    [config.countries, t],
  );

  const placeOptions = useMemo(
    () => [
      { value: '' as const, label: t('filters.all_places') },
      ...places.map((place) => ({ value: place.value, label: place.label })),
    ],
    [places, t],
  );

  const currencyOptions = useMemo(
    () =>
      config.currencies.map((currency) => ({
        value: currency.id,
        label: `${currency.code} (${currency.symbol})`,
      })),
    [config.currencies],
  );

  const selectedCurrency = config.currencies.find(
    (currency) => String(currency.id) === String(draft.currency_id),
  );
  const currencySymbol = selectedCurrency?.symbol ?? '$';

  function updateDraft<K extends keyof ArchiveFilterState>(key: K, value: ArchiveFilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('filters.title')}</Text>
          <Pressable onPress={onReset} hitSlop={8}>
            <Text style={styles.resetText}>{t('filters.reset')}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SelectField
            label={t('mobile.filters.category')}
            value={draft.subcategory_slug}
            options={subcategoryOptions}
            onChange={(value) => updateDraft('subcategory_slug', value)}
            placeholder={t('mobile.select.placeholder')}
          />

          <SelectField
            label={t('mobile.filters.country')}
            value={draft.country_id}
            options={countryOptions}
            onChange={(value) => {
              updateDraft('country_id', value);
              updateDraft('place_id', '');
            }}
            searchable
            placeholder={t('mobile.select.placeholder')}
            searchPlaceholder={t('mobile.select.search')}
          />

          <SelectField<string | number>
            label={t('mobile.filters.place')}
            value={draft.place_id}
            options={placeOptions}
            onChange={(value) => updateDraft('place_id', value === '' ? '' : String(value))}
            disabled={!draft.country_id}
            searchable
            placeholder={t('mobile.select.placeholder')}
            searchPlaceholder={t('mobile.select.search')}
          />

          <SelectField
            label={t('filters.brand')}
            value={draft.brand_id}
            options={brandOptions}
            onChange={(value) => {
              updateDraft('brand_id', value);
              updateDraft('model_id', '');
            }}
            searchable
            placeholder={t('mobile.select.placeholder')}
            searchPlaceholder={t('mobile.select.search')}
          />

          <SelectField
            label={t('filters.model')}
            value={draft.model_id}
            options={modelOptions}
            onChange={(value) => updateDraft('model_id', value)}
            disabled={!draft.brand_id}
            searchable
            placeholder={t('mobile.select.placeholder')}
            searchPlaceholder={t('mobile.select.search')}
          />

          <SelectField
            label={t('mobile.filters.currency')}
            value={draft.currency_id}
            options={currencyOptions}
            onChange={(value) => updateDraft('currency_id', value)}
            placeholder={t('mobile.select.placeholder')}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <NumberField
                label={t('mobile.filters.min_price', { symbol: currencySymbol })}
                value={draft.price_min}
                onChange={(value) => updateDraft('price_min', value)}
                placeholder="0"
              />
            </View>
            <View style={styles.half}>
              <NumberField
                label={t('mobile.filters.max_price', { symbol: currencySymbol })}
                value={draft.price_max}
                onChange={(value) => updateDraft('price_max', value)}
                placeholder={t('filters.any')}
              />
            </View>
          </View>

          <SelectField
            label={t('mobile.filters.mileage_unit')}
            value={draft.mileage_unit}
            options={MILEAGE_UNIT_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            onChange={(value) => updateDraft('mileage_unit', value as ArchiveFilterState['mileage_unit'])}
            placeholder={t('mobile.select.placeholder')}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <NumberField
                label={t('mobile.filters.min_mileage')}
                value={draft.mileage_min}
                onChange={(value) => updateDraft('mileage_min', value)}
              />
            </View>
            <View style={styles.half}>
              <NumberField
                label={t('mobile.filters.max_mileage')}
                value={draft.mileage_max}
                onChange={(value) => updateDraft('mileage_max', value)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <NumberField
                label={t('mobile.filters.min_year')}
                value={draft.year_min}
                onChange={(value) => updateDraft('year_min', value)}
              />
            </View>
            <View style={styles.half}>
              <NumberField
                label={t('mobile.filters.max_year')}
                value={draft.year_max}
                onChange={(value) => updateDraft('year_max', value)}
              />
            </View>
          </View>

          <SelectField
            label={t('filters.drive_type')}
            value={draft.drive_type ?? ''}
            options={DRIVE_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            onChange={(value) => updateDraft('drive_type', value as ArchiveFilterState['drive_type'])}
            placeholder={t('mobile.select.placeholder')}
          />

          <SelectField
            label={t('filters.transmission')}
            value={draft.transmission ?? ''}
            options={TRANSMISSION_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            onChange={(value) =>
              updateDraft('transmission', value as ArchiveFilterState['transmission'])
            }
            placeholder={t('mobile.select.placeholder')}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
          <View style={styles.applyButtonWrap}>
            <GradientButton
              label={t('filters.apply_filters')}
              fillHeight
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={styles.footerButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const FOOTER_BUTTON_HEIGHT = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  resetText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelButton: {
    flex: 1,
    height: FOOTER_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 18,
    includeFontPadding: false,
  },
  applyButtonWrap: {
    flex: 1,
    height: FOOTER_BUTTON_HEIGHT,
  },
  footerButton: {
    height: FOOTER_BUTTON_HEIGHT,
  },
});
