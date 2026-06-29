import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';

import {
  validateChangePassword,
  validateEditProfile,
} from '@/lib/profile/validateProfile';

const t = ((key: string) => key) as TFunction;

describe('validateEditProfile', () => {
  it('passes with valid name and email', () => {
    expect(validateEditProfile({ name: 'Jane', email: 'jane@example.com' }, t)).toEqual({ ok: true });
  });

  it('fails when name is empty', () => {
    const result = validateEditProfile({ name: ' ', email: 'jane@example.com' }, t);
    expect(result.ok).toBe(false);
  });

  it('fails when email is invalid', () => {
    const result = validateEditProfile({ name: 'Jane', email: 'not-an-email' }, t);
    expect(result.ok).toBe(false);
  });
});

describe('validateChangePassword', () => {
  it('passes with valid password fields', () => {
    expect(
      validateChangePassword(
        {
          old_password: 'Password1!',
          password: 'NewPassword1!',
          password_confirmation: 'NewPassword1!',
        },
        t,
      ),
    ).toEqual({ ok: true });
  });

  it('fails when confirmation does not match', () => {
    const result = validateChangePassword(
      {
        old_password: 'Password1!',
        password: 'NewPassword1!',
        password_confirmation: 'Mismatch1!',
      },
      t,
    );
    expect(result.ok).toBe(false);
  });
});
