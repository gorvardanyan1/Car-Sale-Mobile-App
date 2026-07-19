import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AnnouncementPriceSuggestionModal } from '@/components/create-announcement/AnnouncementPriceSuggestionModal';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { NumberField, SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import {
  DRIVE_TYPE_OPTIONS,
  MILEAGE_UNIT_OPTIONS,
  TRANSMISSION_OPTIONS,
} from '@/constants/createAnnouncement';
import type { useCreateAnnouncement } from '@/hooks/useCreateAnnouncement';
import type { CarFeatureDefinition } from '@/types/announcement';
import { colors, spacing, typography } from '@/theme';

type CreateAnnouncementStepDetailsProps = {
  wizard: ReturnType<typeof useCreateAnnouncement>;
};

function getFeatureLabel(feature: CarFeatureDefinition, language: string): string {
  if (language.startsWith('ru') && feature.name_ru) {
    return feature.name_ru;
  }
  if (language.startsWith('am') && feature.name_am) {
    return feature.name_am;
  }

  return feature.name_en ?? feature.key;
}

export function CreateAnnouncementStepDetails({ wizard }: CreateAnnouncementStepDetailsProps) {
  const { t, i18n } = useTranslation();
  const {
    isEdit,
    config,
    form,
    brandOptions,
    modelOptions,
    countryOptions,
    currencyOptions,
    subcategoryOptions,
    colorOptions,
    engineTypeOptions,
    places,
    hideEngineCapacity,
    loadingModels,
    loadingPlaces,
    updateForm,
    setBrand,
    setCountry,
    toggleFeature,
    priceChanged,
    generatingPriceSuggestion,
    priceSuggestion,
    priceSuggestionError,
    priceSuggestionVisible,
    runGeneratePriceSuggestion,
    closePriceSuggestion,
    applyPriceSuggestion,
  } = wizard;

  if (!config) {
    return null;
  }

  return (
    <View style={styles.form}>
      <Text style={styles.legend}>{t('mobile.create.required_hint')}</Text>

      {subcategoryOptions.length > 0 ? (
        <SelectField
          label={t('announcement.vehicle_type')}
          value={form.subcategory_slug}
          options={subcategoryOptions}
          onChange={(value) => updateForm({ subcategory_slug: value })}
          placeholder={t('announcement.select_vehicle_type')}
          required
        />
      ) : null}

      <SelectField
        label={t('filters.brand')}
        value={form.car_brand_id}
        options={brandOptions}
        onChange={(value) => setBrand(value)}
        searchable
        searchPlaceholder={t('mobile.select.search')}
        placeholder={t('mobile.select.placeholder')}
        required
      />

      <SelectField
        label={t('filters.model')}
        value={form.car_model_id}
        options={modelOptions}
        onChange={(value) => updateForm({ car_model_id: value })}
        disabled={!form.car_brand_id || loadingModels}
        searchable
        searchPlaceholder={t('mobile.select.search')}
        placeholder={loadingModels ? t('common.loading') : t('mobile.select.placeholder')}
        required
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <NumberField
            label={t('announcement.year')}
            value={form.year}
            onChange={(value) => updateForm({ year: value })}
            placeholder="2020"
            required
          />
        </View>
        <View style={styles.half}>
          <NumberField
            label={t('announcement.price')}
            value={form.price}
            onChange={(value) => updateForm({ price: value })}
            placeholder="15000"
            required
          />
        </View>
      </View>

      <Pressable onPress={() => void runGeneratePriceSuggestion()} style={styles.aiPriceButton}>
        <Sparkles color={colors.primaryLight} size={14} />
        <Text style={styles.aiPriceButtonText}>{t('announcement.get_ai_price_suggestion')}</Text>
      </Pressable>

      {isEdit && priceChanged ? (
        <View style={styles.priceChangeRow}>
          <Text style={styles.priceChangeLabel}>{t('announcement.store_price_change')}</Text>
          <Switch
            value={form.storePriceChange}
            onValueChange={(value) => updateForm({ storePriceChange: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      ) : null}

      <SelectField
        label={t('announcement.currency')}
        value={form.currency_id}
        options={currencyOptions}
        onChange={(value) => updateForm({ currency_id: value })}
        placeholder={t('mobile.select.placeholder')}
        required
      />

      <SelectField
        label={t('announcement.drive_type')}
        value={form.drive_type}
        options={DRIVE_TYPE_OPTIONS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        onChange={(value) => updateForm({ drive_type: value })}
        placeholder={t('announcement.select_drive_type')}
        required
      />

      <SelectField
        label={t('announcement.transmission')}
        value={form.transmission}
        options={TRANSMISSION_OPTIONS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        onChange={(value) => updateForm({ transmission: value })}
        placeholder={t('mobile.select.placeholder')}
        required
      />

      <SelectField
        label={t('announcement.engine_type')}
        value={form.engine_type}
        options={engineTypeOptions}
        onChange={(value) => updateForm({ engine_type: value })}
        placeholder={t('mobile.select.placeholder')}
        required
      />

      {!hideEngineCapacity ? (
        <NumberField
          label={t('announcement.engine_capacity')}
          value={form.engine_capacity}
          onChange={(value) => updateForm({ engine_capacity: value })}
          placeholder="2.0"
        />
      ) : null}

      <NumberField
        label={t('car.horsepower')}
        value={form.horsepower}
        onChange={(value) => updateForm({ horsepower: value })}
        placeholder="150"
        required
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <NumberField
            label={t('announcement.mileage')}
            value={form.mileage}
            onChange={(value) => updateForm({ mileage: value })}
            placeholder="50000"
          />
        </View>
        <View style={styles.unitField}>
          <SelectField
            label={t('mobile.filters.mileage_unit')}
            value={form.mileage_unit}
            options={MILEAGE_UNIT_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            onChange={(value) => updateForm({ mileage_unit: value || 'km' })}
            showOptionalHint={false}
          />
        </View>
      </View>

      <SelectField
        label={t('announcement.country')}
        value={form.country_id}
        options={countryOptions}
        onChange={(value) => setCountry(value)}
        searchable
        searchPlaceholder={t('mobile.select.search')}
        placeholder={t('mobile.select.placeholder')}
        required
      />

      <SelectField
        label={t('announcement.place')}
        value={form.place_id}
        options={places.map((place) => ({ value: place.value, label: place.label }))}
        onChange={(value) => updateForm({ place_id: value })}
        disabled={!form.country_id || loadingPlaces}
        searchable
        searchPlaceholder={t('mobile.select.search')}
        placeholder={loadingPlaces ? t('common.loading') : t('mobile.select.placeholder')}
        required
      />

      {colorOptions.length > 0 ? (
        <SelectField
          label={t('announcement.color')}
          value={form.color_id}
          options={colorOptions}
          onChange={(value) => updateForm({ color_id: value })}
          placeholder={t('filters.any')}
        />
      ) : null}

      <TextField
        label={t('announcement.vin')}
        value={form.vin}
        onChangeText={(value) => updateForm({ vin: value })}
        autoCapitalize="characters"
      />

      <TextField
        label={t('announcement.youtube_video')}
        value={form.youtube_video}
        onChangeText={(value) => updateForm({ youtube_video: value })}
        autoCapitalize="none"
        keyboardType="url"
      />

      {config.carFeatures.length > 0 ? (
        <View style={styles.featuresBlock}>
          <FieldLabel label={t('announcement.features')} showOptionalHint />
          {config.carFeatures.map((feature: CarFeatureDefinition) => {
            const enabled = Boolean(form.features[feature.key]);
            return (
              <View key={feature.key} style={styles.featureRow}>
                <Text style={styles.featureLabel}>{getFeatureLabel(feature, i18n.language)}</Text>
                <Switch
                  value={enabled}
                  onValueChange={(value) => toggleFeature(feature.key, value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      <AnnouncementPriceSuggestionModal
        visible={priceSuggestionVisible}
        loading={generatingPriceSuggestion}
        suggestion={priceSuggestion}
        error={priceSuggestionError}
        onClose={closePriceSuggestion}
        onUsePrice={applyPriceSuggestion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  legend: {
    ...typography.caption,
    color: colors.textSubtle,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  aiPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: -spacing.xs,
  },
  aiPriceButtonText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  priceChangeLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  flex: {
    flex: 2,
  },
  unitField: {
    flex: 1,
  },
  featuresBlock: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  featureLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
});
