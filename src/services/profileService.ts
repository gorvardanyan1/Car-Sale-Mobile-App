import { apiFetch } from '@/lib/api/client';
import type { ApiResponse, User } from '@/types';
import type { ChangePasswordPayload, UpdateProfilePayload } from '@/types/profile';

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const response = await apiFetch<ApiResponse<User>>('/profile', {
    method: 'PUT',
    auth: true,
    body: payload,
  });

  return response.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<User> {
  const response = await apiFetch<ApiResponse<User>>('/profile', {
    method: 'PUT',
    auth: true,
    body: payload,
  });

  return response.data;
}
