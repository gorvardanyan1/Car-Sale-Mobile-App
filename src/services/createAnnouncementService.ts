import { apiFetch, apiFormData } from '@/lib/api/client';
import { buildCreateAnnouncementFormData } from '@/lib/announcements/buildCreateAnnouncementFormData';
import { buildEditAnnouncementFormData } from '@/lib/announcements/buildEditAnnouncementFormData';
import type {
  Announcement,
  CreateAnnouncementFormState,
  CreateFormConfig,
  EditFormConfig,
  SubcategoryOption,
} from '@/types/announcement';
import type { ApiResponse } from '@/types';

export async function fetchCreateFormConfig(): Promise<CreateFormConfig> {
  const response = await apiFetch<ApiResponse<CreateFormConfig>>('/announcements/create/config');
  return response.data;
}

export async function fetchEditFormConfig(announcementId: number): Promise<EditFormConfig> {
  const response = await apiFetch<ApiResponse<EditFormConfig>>(
    `/announcements/${announcementId}/edit`,
    { auth: true },
  );
  return response.data;
}

type CreateAnnouncementOptions = {
  form: CreateAnnouncementFormState;
  subcategoryOptions: SubcategoryOption[];
};

export async function createAnnouncement({
  form,
  subcategoryOptions,
}: CreateAnnouncementOptions): Promise<Announcement> {
  const response = await apiFormData<ApiResponse<Announcement>>('/announcements', {
    auth: true,
    method: 'POST',
    fields: buildCreateAnnouncementFormData({ form, subcategoryOptions }),
  });

  return response.data;
}

type UpdateAnnouncementOptions = {
  announcementId: number;
  form: CreateAnnouncementFormState;
  subcategoryOptions: SubcategoryOption[];
};

export async function updateAnnouncement({
  announcementId,
  form,
  subcategoryOptions,
}: UpdateAnnouncementOptions): Promise<Announcement> {
  const response = await apiFormData<ApiResponse<Announcement>>(
    `/announcements/${announcementId}`,
    {
      auth: true,
      method: 'POST',
      fields: buildEditAnnouncementFormData({ announcementId, form, subcategoryOptions }),
    },
  );

  return response.data;
}

type GenerateDescriptionParams = {
  brand?: string;
  model?: string;
  year?: string;
  price?: string;
  mileage?: string;
  mileage_unit?: string;
  transmission?: string;
  drive_type?: string;
  engine_capacity?: string | null;
  engine_type?: string;
};

export async function generateAnnouncementDescription(
  params: GenerateDescriptionParams,
): Promise<string> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  }

  const response = await apiFetch<ApiResponse<{ description: string }>>(
    `/announcements/ai/description?${query.toString()}`,
    { auth: true },
  );

  return response.data.description ?? '';
}
