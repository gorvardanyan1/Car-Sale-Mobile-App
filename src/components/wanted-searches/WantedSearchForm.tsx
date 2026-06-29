import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NumberField, SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { GradientButton } from '@/components/ui/GradientButton';
import type { useWantedSearches } from '@/hooks/useWantedSearches';
import { radii, spacing, typography, colors } from '@/theme';

type WantedSearchFormProps = {
  wizard: ReturnType<typeof useWantedSearches>;
};

function RangeFields({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
}: {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder: string;
  maxPlaceholder: string;
}) {
  return (
    <View style={styles.rangeBlock}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <View style={styles.rangeRow}>
        <View style={styles.rangeField}>
          <NumberField
            label={minPlaceholder}
            value={minValue}
            onChange={onMinChange}
            placeholder={minPlaceholder}
            showOptionalHint={false}
          />
        </View>
        <View style={styles.rangeField}>
          <NumberField
            label={maxPlaceholder}
            value={maxValue}
            onChange={onMaxChange}
            placeholder={maxPlaceholder}
            showOptionalHint={false}
          />
        </View>
      </View>
    </View>
  );
}

export function WantedSearchForm({ wizard }: WantedSearchFormProps) {
  const { t } = useTranslation();
  const { config, form, editingId, models, loadingModels, submitting, updateForm, cancelEdit, submit } =
    wizard;

  const categoryOptions = useMemo(
    () =>
      (config?.categories ?? []).map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [config?.categories],
  );

  const brandOptions = useMemo(
    () =>
      (config?.brands ?? []).map((brand) => ({
        value: brand.id,
        label: brand.brand,
      })),
    [config?.brands],
  );

  const modelOptions = useMemo(
    () => models.map((model) => ({ value: model.id, label: model.model })),
    [models],
  );

  const currencyOptions = useMemo(
    () => [
      { value: '' as const, label: t('wanted_searches.any_currency') },
      ...(config?.currencies ?? []).map((currency) => ({
        value: currency.id,
        label: `${currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`,
      })),
    ],
    [config?.currencies, t],
  );

  const mileageUnitOptions = useMemo(
    () => [
      { value: 'km' as const, label: t('wanted_searches.mileage_km_unit') },
      { value: 'mi' as const, label: t('wanted_searches.mileage_mi_unit') },
    ],
    [t],
  );

  if (!config) {
    return null;
  }

  return (
    <View style={styles.card} testID="wanted-search-form">
      <Text style={styles.title}>
        {editingId ? t('wanted_searches.edit_title') : t('wanted_searches.create_title')}
      </Text>
      <Text style={styles.subtitle}>{t('wanted_searches.form_subtitle')}</Text>

      <SelectField
        label={t('wanted_searches.category')}
        value={form.category_id}
        options={categoryOptions}
        onChange={(value) => updateForm({ category_id: value })}
        searchable
        required
        showOptionalHint={false}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <SelectField
            label={t('wanted_searches.brand')}
            value={form.car_brand_id}
            options={brandOptions}
            onChange={(value) => updateForm({ car_brand_id: value, car_model_id: '' })}
            placeholder={t('wanted_searches.any_brand')}
            searchable
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label={t('wanted_searches.model')}
            value={form.car_model_id}
            options={modelOptions}
            onChange={(value) => updateForm({ car_model_id: value })}
            placeholder={loadingModels ? t('common.loading') : t('wanted_searches.any_model')}
            disabled={!form.car_brand_id || loadingModels}
            searchable
          />
        </View>
      </View>

      <TextField
        label={t('wanted_searches.label_optional')}
        value={form.name}
        onChangeText={(value) => updateForm({ name: value })}
        placeholder={t('wanted_searches.label_placeholder')}
      />

      <RangeFields
        label={t('wanted_searches.price')}
        minValue={form.min_price}
        maxValue={form.max_price}
        onMinChange={(value) => updateForm({ min_price: value })}
        onMaxChange={(value) => updateForm({ max_price: value })}
        minPlaceholder={t('wanted_searches.min')}
        maxPlaceholder={t('wanted_searches.max')}
      />

      <SelectField
        label={t('wanted_searches.currency')}
        value={form.currency_id}
        options={currencyOptions}
        onChange={(value) => updateForm({ currency_id: value })}
        searchable
      />

      <RangeFields
        label={t('wanted_searches.year')}
        minValue={form.min_year}
        maxValue={form.max_year}
        onMinChange={(value) => updateForm({ min_year: value })}
        onMaxChange={(value) => updateForm({ max_year: value })}
        minPlaceholder={t('wanted_searches.min')}
        maxPlaceholder={t('wanted_searches.max')}
      />

      <RangeFields
        label={t('wanted_searches.horsepower')}
        minValue={form.min_horsepower}
        maxValue={form.max_horsepower}
        onMinChange={(value) => updateForm({ min_horsepower: value })}
        onMaxChange={(value) => updateForm({ max_horsepower: value })}
        minPlaceholder={t('wanted_searches.min')}
        maxPlaceholder={t('wanted_searches.max')}
      />

      <RangeFields
        label={t('wanted_searches.engine_capacity')}
        minValue={form.min_engine_capacity}
        maxValue={form.max_engine_capacity}
        onMinChange={(value) => updateForm({ min_engine_capacity: value })}
        onMaxChange={(value) => updateForm({ max_engine_capacity: value })}
        minPlaceholder={t('wanted_searches.min')}
        maxPlaceholder={t('wanted_searches.max')}
      />

      <RangeFields
        label={t('wanted_searches.mileage')}
        minValue={form.min_mileage}
        maxValue={form.max_mileage}
        onMinChange={(value) => updateForm({ min_mileage: value })}
        onMaxChange={(value) => updateForm({ max_mileage: value })}
        minPlaceholder={t('wanted_searches.min')}
        maxPlaceholder={t('wanted_searches.max')}
      />

      <SelectField
        label={t('wanted_searches.mileage_km')}
        value={form.mileage_unit}
        options={mileageUnitOptions}
        onChange={(value) => updateForm({ mileage_unit: value === 'mi' ? 'mi' : 'km' })}
        showOptionalHint={false}
      />

      <View style={styles.actions}>
        {editingId ? (
          <Pressable onPress={cancelEdit} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        ) : null}
        <GradientButton
          label={
            submitting
              ? t('mobile.profile.saving')
              : editingId
                ? t('wanted_searches.save')
                : t('wanted_searches.create')
          }
          onPress={() => void submit()}
          disabled={submitting}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 17,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  rangeBlock: {
    gap: spacing.xs,
  },
  rangeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rangeField: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    fontSize: 14,
  },
  submitButton: {
    flex: 2,
  },
});
