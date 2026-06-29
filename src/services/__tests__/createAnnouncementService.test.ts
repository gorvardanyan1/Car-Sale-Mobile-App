import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFormData } from '@/lib/api/client';
import { createAnnouncement, updateAnnouncement } from '@/services/createAnnouncementService';
import type { CreateAnnouncementFormState } from '@/types/announcement';

vi.mock('@/lib/api/client', () => ({
  apiFormData: vi.fn(),
  apiFetch: vi.fn(),
}));

describe('createAnnouncement service', () => {
  beforeEach(() => {
    vi.mocked(apiFormData).mockReset();
  });

  it('posts multipart payload to announcements endpoint', async () => {
    vi.mocked(apiFormData).mockResolvedValueOnce({
      data: { id: 42, status: 'pending' },
    });

    const form: CreateAnnouncementFormState = {
      subcategory_slug: '',
      car_brand_id: 1,
      car_model_id: 2,
      country_id: 3,
      place_id: 4,
      vin: '',
      year: '2020',
      price: '15000',
      currency_id: 1,
      drive_type: 'fwd',
      transmission: 'automatic',
      horsepower: '150',
      mileage: '',
      mileage_unit: 'km',
      engine_capacity: '',
      engine_type: 'petrol',
      color_id: '',
      youtube_video: '',
      description: 'Test listing',
      features: {},
      mainImage: { uri: 'file://a.jpg', name: 'a.jpg', type: 'image/jpeg' },
      additionalImages: [],
      existingMainImagePath: null,
      existingAdditionalImagePaths: [],
    };

    const announcement = await createAnnouncement({ form, subcategoryOptions: [] });

    expect(announcement.id).toBe(42);
    expect(apiFormData).toHaveBeenCalledWith('/announcements', {
      auth: true,
      method: 'POST',
      fields: expect.objectContaining({
        car_brand_id: 1,
        description: 'Test listing',
        main_image: form.mainImage,
      }),
    });
  });

  it('puts multipart payload to announcement update endpoint', async () => {
    vi.mocked(apiFormData).mockResolvedValueOnce({
      data: { id: 42, status: 'active' },
    });

    const form: CreateAnnouncementFormState = {
      subcategory_slug: '',
      car_brand_id: 1,
      car_model_id: 2,
      country_id: 3,
      place_id: 4,
      vin: '',
      year: '2020',
      price: '15000',
      currency_id: 1,
      drive_type: 'fwd',
      transmission: 'automatic',
      horsepower: '150',
      mileage: '',
      mileage_unit: 'km',
      engine_capacity: '',
      engine_type: 'petrol',
      color_id: '',
      youtube_video: '',
      description: 'Updated listing',
      features: {},
      mainImage: null,
      additionalImages: [],
      existingMainImagePath: 'main_images/existing.jpg',
      existingAdditionalImagePaths: [],
    };

    const announcement = await updateAnnouncement({
      announcementId: 42,
      form,
      subcategoryOptions: [],
    });

    expect(announcement.id).toBe(42);
    expect(apiFormData).toHaveBeenCalledWith('/announcements/42', {
      auth: true,
      method: 'POST',
      fields: expect.objectContaining({
        id: 42,
        description: 'Updated listing',
        additional_images_url: [],
      }),
    });
  });
});
