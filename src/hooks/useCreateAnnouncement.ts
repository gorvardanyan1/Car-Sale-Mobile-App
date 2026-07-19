import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_ENGINE_TYPE } from '@/constants/createAnnouncement';
import { getErrorMessage } from '@/lib/api/errors';
import { shouldHideEngineCapacity } from '@/lib/announcements/engineType';
import { mapAnnouncementToEditForm } from '@/lib/announcements/mapAnnouncementToEditForm';
import {
  validateCreateAnnouncementStep1,
  validateCreateAnnouncementStep2,
} from '@/lib/announcements/validateCreateAnnouncement';
import { fetchBrandModels, fetchPlaces } from '@/services/announcementService';
import {
  createAnnouncement,
  fetchCreateFormConfig,
  fetchEditFormConfig,
  generateAnnouncementDescription,
  generateAnnouncementPriceSuggestion,
  translateAnnouncementDescription,
  updateAnnouncement,
} from '@/services/createAnnouncementService';
import type {
  AiPriceSuggestion,
  CarBrand,
  CarModel,
  CreateAnnouncementFormState,
  CreateFormConfig,
  PlaceOption,
} from '@/types/announcement';

type TranslationLanguage = 'am' | 'ru';

const emptyForm = (): CreateAnnouncementFormState => ({
  subcategory_slug: '',
  car_brand_id: '',
  car_model_id: '',
  country_id: '',
  place_id: '',
  vin: '',
  year: '',
  price: '',
  currency_id: '',
  drive_type: '',
  transmission: '',
  horsepower: '',
  mileage: '',
  mileage_unit: 'km',
  engine_capacity: '',
  engine_type: DEFAULT_ENGINE_TYPE,
  color_id: '',
  youtube_video: '',
  description: '',
  features: {},
  mainImage: null,
  additionalImages: [],
  existingMainImagePath: null,
  existingAdditionalImagePaths: [],
  translationsEnabled: false,
  translations: { am: '', ru: '' },
  storePriceChange: false,
});

export function useCreateAnnouncement(announcementId?: number) {
  const isEdit = announcementId != null;
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<CreateFormConfig | null>(null);
  const [form, setForm] = useState<CreateAnnouncementFormState>(emptyForm);
  const [models, setModels] = useState<CarModel[]>([]);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [generatingPriceSuggestion, setGeneratingPriceSuggestion] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<AiPriceSuggestion | null>(null);
  const [priceSuggestionError, setPriceSuggestionError] = useState<string | null>(null);
  const [priceSuggestionVisible, setPriceSuggestionVisible] = useState(false);
  const [translating, setTranslating] = useState<Partial<Record<TranslationLanguage, boolean>>>({});

  useEffect(() => {
    let cancelled = false;
    setLoadingConfig(true);

    async function load() {
      try {
        if (isEdit && announcementId != null) {
          const data = await fetchEditFormConfig(announcementId);
          if (cancelled) {
            return;
          }

          const { announcement, ...formConfig } = data;
          setConfig(formConfig);
          setForm(mapAnnouncementToEditForm(announcement));
          return;
        }

        const data = await fetchCreateFormConfig();
        if (cancelled) {
          return;
        }

        setConfig(data);
        setForm((prev) => ({
          ...prev,
          currency_id: data.defaultCurrencyId ?? prev.currency_id,
          country_id: data.countries[0]?.id ?? prev.country_id,
          engine_type: data.engineTypeOptions[0]?.value ?? DEFAULT_ENGINE_TYPE,
        }));
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingConfig(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [announcementId, isEdit]);

  const selectedSubcategory = useMemo(
    () => config?.subcategoryOptions.find((option) => option.path === form.subcategory_slug),
    [config?.subcategoryOptions, form.subcategory_slug],
  );

  const hideEngineCapacity = useMemo(
    () => shouldHideEngineCapacity(form.engine_type, selectedSubcategory?.hidden_fields),
    [form.engine_type, selectedSubcategory?.hidden_fields],
  );

  const loadModels = useCallback(async (brandId: number | '') => {
    if (!brandId) {
      setModels([]);
      return;
    }

    setLoadingModels(true);
    try {
      const nextModels = await fetchBrandModels(brandId);
      setModels(nextModels);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const loadPlaces = useCallback(async (countryId: number | '', search = '') => {
    if (!countryId) {
      setPlaces([]);
      return;
    }

    setLoadingPlaces(true);
    try {
      const nextPlaces = await fetchPlaces({ countryId, search });
      setPlaces(nextPlaces);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  useEffect(() => {
    void loadModels(form.car_brand_id);
  }, [form.car_brand_id, loadModels]);

  useEffect(() => {
    void loadPlaces(form.country_id);
  }, [form.country_id, loadPlaces]);

  const updateForm = useCallback(
    (patch: Partial<CreateAnnouncementFormState>) => {
      if (isEdit && Object.prototype.hasOwnProperty.call(patch, 'price')) {
        setPriceChanged(true);
      }

      setForm((prev) => ({ ...prev, ...patch }));
    },
    [isEdit],
  );

  const updateTranslation = useCallback((language: TranslationLanguage, value: string) => {
    setForm((prev) => ({
      ...prev,
      translations: { ...prev.translations, [language]: value },
    }));
  }, []);

  const setBrand = useCallback((brandId: number | '') => {
    setForm((prev) => ({
      ...prev,
      car_brand_id: brandId,
      car_model_id: '',
    }));
  }, []);

  const setCountry = useCallback((countryId: number | '') => {
    setForm((prev) => ({
      ...prev,
      country_id: countryId,
      place_id: '',
    }));
  }, []);

  const toggleFeature = useCallback((featureKey: string, enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: enabled,
      },
    }));
  }, []);

  const brandOptions = useMemo(
    () => (config?.brands ?? []).map((brand: CarBrand) => ({ value: brand.id, label: brand.brand })),
    [config?.brands],
  );

  const modelOptions = useMemo(
    () => models.map((model) => ({ value: model.id, label: model.model })),
    [models],
  );

  const countryOptions = useMemo(
    () =>
      (config?.countries ?? []).map((country) => ({
        value: country.id,
        label: country.country,
      })),
    [config?.countries],
  );

  const currencyOptions = useMemo(
    () =>
      (config?.currencies ?? []).map((currency) => ({
        value: currency.id,
        label: `${currency.code}${currency.symbol ? ` (${currency.symbol})` : ''}`,
      })),
    [config?.currencies],
  );

  const subcategoryOptions = useMemo(
    () =>
      (config?.subcategoryOptions ?? []).map((option) => ({
        value: option.path,
        label: option.name,
      })),
    [config?.subcategoryOptions],
  );

  const colorOptions = useMemo(
    () =>
      (config?.colors ?? []).map((color) => ({
        value: color.id,
        label: color.name,
      })),
    [config?.colors],
  );

  const engineTypeOptions = useMemo(
    () =>
      (config?.engineTypeOptions ?? []).map((option) => ({
        value: option.value,
        label: t(`announcement.engine_type.${option.value}`, { defaultValue: option.label }),
      })),
    [config?.engineTypeOptions, t],
  );

  const goNext = useCallback(() => {
    if (!config) {
      return false;
    }

    const validation = validateCreateAnnouncementStep1(form, config, t);
    if (!validation.ok) {
      setError(`${validation.message}: ${validation.fieldLabel}`);
      return false;
    }

    setError(null);
    setStep(2);
    return true;
  }, [config, form, t]);

  const goBack = useCallback(() => {
    setError(null);
    setStep((value) => Math.max(1, value - 1));
  }, []);

  const runGenerateDescription = useCallback(async () => {
    if (!config) {
      return;
    }

    const brand = brandOptions.find((option) => option.value === form.car_brand_id)?.label;
    const model = modelOptions.find((option) => option.value === form.car_model_id)?.label;

    setGeneratingDescription(true);
    setError(null);

    try {
      const description = await generateAnnouncementDescription({
        brand,
        model,
        year: form.year,
        price: form.price,
        mileage: form.mileage,
        mileage_unit: form.mileage_unit,
        transmission: form.transmission,
        drive_type: form.drive_type,
        engine_capacity: hideEngineCapacity ? null : form.engine_capacity,
        engine_type: form.engine_type,
      });
      updateForm({ description });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingDescription(false);
    }
  }, [
    brandOptions,
    config,
    form,
    hideEngineCapacity,
    modelOptions,
    updateForm,
  ]);

  const runGeneratePriceSuggestion = useCallback(async () => {
    if (!config) {
      return;
    }

    const brand = brandOptions.find((option) => option.value === form.car_brand_id)?.label;
    const model = modelOptions.find((option) => option.value === form.car_model_id)?.label;

    setPriceSuggestionVisible(true);
    setGeneratingPriceSuggestion(true);
    setPriceSuggestionError(null);
    setPriceSuggestion(null);

    try {
      const prices = await generateAnnouncementPriceSuggestion({
        brand,
        model,
        year: form.year,
        price: form.price,
        mileage: form.mileage,
        mileage_unit: form.mileage_unit,
        transmission: form.transmission,
        drive_type: form.drive_type,
        engine_capacity: hideEngineCapacity ? null : form.engine_capacity,
        engine_type: form.engine_type,
        description: form.description,
      });

      if (
        prices &&
        (prices.recommended_price != null || prices.min_price != null || prices.max_price != null)
      ) {
        setPriceSuggestion(prices);
      } else {
        setPriceSuggestionError(t('announcement.no_price_suggestion'));
      }
    } catch (err) {
      setPriceSuggestionError(getErrorMessage(err));
    } finally {
      setGeneratingPriceSuggestion(false);
    }
  }, [brandOptions, config, form, hideEngineCapacity, modelOptions, t]);

  const closePriceSuggestion = useCallback(() => {
    setPriceSuggestionVisible(false);
  }, []);

  const applyPriceSuggestion = useCallback(
    (price: number | string) => {
      updateForm({ price: String(price) });
      setPriceSuggestionVisible(false);
    },
    [updateForm],
  );

  const runTranslate = useCallback(
    async (language: TranslationLanguage) => {
      if (!form.description.trim()) {
        return;
      }

      setTranslating((prev) => ({ ...prev, [language]: true }));
      setError(null);

      try {
        const translated = await translateAnnouncementDescription(form.description, language);
        updateTranslation(language, translated);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setTranslating((prev) => ({ ...prev, [language]: false }));
      }
    },
    [form.description, updateTranslation],
  );

  const submit = useCallback(async () => {
    if (!config) {
      return false;
    }

    const step1 = validateCreateAnnouncementStep1(form, config, t);
    if (!step1.ok) {
      setError(`${step1.message}: ${step1.fieldLabel}`);
      setStep(1);
      return false;
    }

    const step2 = validateCreateAnnouncementStep2(form, t);
    if (!step2.ok) {
      setError(`${step2.message}: ${step2.fieldLabel}`);
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && announcementId != null) {
        await updateAnnouncement({
          announcementId,
          form,
          subcategoryOptions: config.subcategoryOptions,
        });
        router.replace('/settings/my-announcements');
        return true;
      }

      const announcement = await createAnnouncement({
        form,
        subcategoryOptions: config.subcategoryOptions,
      });
      router.replace({
        pathname: '/announcement/[id]',
        params: { id: String(announcement.id), from: 'create' },
      });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [announcementId, config, form, isEdit, router, t]);

  const reset = useCallback(() => {
    setStep(1);
    setForm(emptyForm());
    setError(null);
    setPriceChanged(false);
    setPriceSuggestion(null);
    setPriceSuggestionError(null);
    setPriceSuggestionVisible(false);
    setTranslating({});
  }, []);

  return {
    isEdit,
    step,
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
    loadingConfig,
    loadingModels,
    loadingPlaces,
    submitting,
    generatingDescription,
    error,
    setError,
    updateForm,
    updateTranslation,
    setBrand,
    setCountry,
    toggleFeature,
    loadPlaces,
    goNext,
    goBack,
    runGenerateDescription,
    priceChanged,
    generatingPriceSuggestion,
    priceSuggestion,
    priceSuggestionError,
    priceSuggestionVisible,
    runGeneratePriceSuggestion,
    closePriceSuggestion,
    applyPriceSuggestion,
    translating,
    runTranslate,
    submit,
    reset,
  };
}
