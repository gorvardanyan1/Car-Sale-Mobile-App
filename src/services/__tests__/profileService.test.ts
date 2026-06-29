import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { changePassword, updateProfile } from '@/services/profileService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('profileService', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('updates profile via PUT /profile', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { id: 1, name: 'Jane', email: 'jane@example.com' },
    });

    const user = await updateProfile({
      name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
    });

    expect(user.name).toBe('Jane');
    expect(apiFetch).toHaveBeenCalledWith('/profile', {
      method: 'PUT',
      auth: true,
      body: {
        name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      },
    });
  });

  it('changes password via PUT /profile with confirmation fields', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: { id: 1, name: 'Jane', email: 'jane@example.com' },
    });

    await changePassword({
      name: 'Jane',
      email: 'jane@example.com',
      old_password: 'Password1!',
      password: 'NewPassword1!',
      password_confirmation: 'NewPassword1!',
    });

    expect(apiFetch).toHaveBeenCalledWith('/profile', {
      method: 'PUT',
      auth: true,
      body: {
        name: 'Jane',
        email: 'jane@example.com',
        old_password: 'Password1!',
        password: 'NewPassword1!',
        password_confirmation: 'NewPassword1!',
      },
    });
  });
});
