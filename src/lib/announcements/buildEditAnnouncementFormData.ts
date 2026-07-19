import type { ApiFormDataInput } from '@/lib/api/client';
import { buildAnnouncementDescriptionPayload } from '@/lib/announcements/buildAnnouncementDescription';
import { shouldHideEngineCapacity } from '@/lib/announcements/engineType';
import type { CreateAnnouncementFormState, SubcategoryOption } from '@/types/announcement';

type BuildEditFormDataOptions = {
  announcementId: number;
  form: CreateAnnouncementFormState;
  subcategoryOptions: SubcategoryOption[];
};

export function buildEditAnnouncementFormData({
  announcementId,
  form,
  subcategoryOptions,
}: BuildEditFormDataOptions): ApiFormDataInput {
  const selectedSubcategory = subcategoryOptions.find(
    (option) => option.path === form.subcategory_slug,
  );
  const hideEngineCapacity = shouldHideEngineCapacity(
    form.engine_type,
    selectedSubcategory?.hidden_fields,
  );

  const fields: ApiFormDataInput = {
    id: announcementId,
    car_brand_id: form.car_brand_id,
    car_model_id: form.car_model_id,
    country_id: form.country_id,
    place_id: form.place_id,
    year: form.year,
    price: form.price,
    currency_id: form.currency_id,
    drive_type: form.drive_type,
    transmission: form.transmission,
    description: buildAnnouncementDescriptionPayload(form),
    horsepower: form.horsepower,
    engine_type: form.engine_type,
    additional_images_url: form.existingAdditionalImagePaths,
  };

  if (form.storePriceChange) {
    fields.store_price_change = '1';
  }

  if (form.subcategory_slug) {
    fields.subcategory_slug = form.subcategory_slug;
  }

  if (form.vin.trim()) {
    fields.vin = form.vin.trim();
  }

  if (form.color_id) {
    fields.color_id = form.color_id;
  }

  if (form.youtube_video.trim()) {
    fields.youtube_video = form.youtube_video.trim();
  }

  if (!hideEngineCapacity && form.engine_capacity.trim()) {
    fields.engine_capacity = form.engine_capacity.trim();
  }

  if (form.mileage.trim()) {
    fields['mileage[value]'] = form.mileage.trim();
    fields['mileage[unit]'] = form.mileage_unit;
  }

  if (form.mainImage) {
    fields.main_image_path = form.mainImage;
  }

  if (form.additionalImages.length > 0) {
    fields.additional_images_path = form.additionalImages;
  }

  for (const [featureKey, enabled] of Object.entries(form.features)) {
    if (enabled) {
      fields[`feature_${featureKey}`] = 'on';
    }
  }

  return fields;
}
