import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch, apiFormData } from '@/lib/api/client';
import {
  createAnnouncement,
  generateAnnouncementPriceSuggestion,
  translateAnnouncementDescription,
  updateAnnouncement,
} from '@/services/createAnnouncementService';
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
      translationsEnabled: false,
      translations: { am: '', ru: '' },
      storePriceChange: false,
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
      translationsEnabled: false,
      translations: { am: '', ru: '' },
      storePriceChange: false,
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

describe('generateAnnouncementPriceSuggestion', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns the AI-suggested price range from the price-suggestion endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        prices: {
          recommended_price: 18000,
          min_price: 16000,
          max_price: 20000,
          confidence: 'high',
          reason: 'Based on similar listings.',
        },
      },
    });

    const result = await generateAnnouncementPriceSuggestion({ brand: 'Toyota', model: 'Camry', year: '2020' });

    expect(result).toEqual({
      recommended_price: 18000,
      min_price: 16000,
      max_price: 20000,
      confidence: 'high',
      reason: 'Based on similar listings.',
    });
    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('/announcements/ai/price-suggestion?'),
      { auth: true },
    );
  });

  it('returns null when the API responds without a suggestion', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ data: { prices: null } });

    const result = await generateAnnouncementPriceSuggestion({ brand: 'Toyota' });

    expect(result).toBeNull();
  });
});

describe('translateAnnouncementDescription', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('posts the description text and target language and returns the translated text', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { translated_text: 'Լավ մեքենա', target_language: 'am' },
    });

    const result = await translateAnnouncementDescription('Great car', 'am');

    expect(result).toBe('Լավ մեքենա');
    expect(apiFetch).toHaveBeenCalledWith('/announcements/ai/translate', {
      auth: true,
      method: 'POST',
      body: { text: 'Great car', target_language: 'am' },
    });
  });
});
