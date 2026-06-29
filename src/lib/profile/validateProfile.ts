import type { TFunction } from 'i18next';

export type ProfileValidationResult =
  | { ok: true }
  | { ok: false; message: string; field: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEditProfile(
  values: { name: string; email: string },
  t: TFunction,
): ProfileValidationResult {
  if (!values.name.trim()) {
    return {
      ok: false,
      field: 'name',
      message: t('mobile.errors.name_required'),
    };
  }

  const email = values.email.trim();
  if (!email) {
    return {
      ok: false,
      field: 'email',
      message: t('mobile.errors.email_required'),
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      field: 'email',
      message: t('mobile.errors.email_invalid'),
    };
  }

  return { ok: true };
}

export function validateChangePassword(
  values: {
    old_password: string;
    password: string;
    password_confirmation: string;
  },
  t: TFunction,
): ProfileValidationResult {
  if (!values.old_password) {
    return {
      ok: false,
      field: 'old_password',
      message: t('mobile.errors.current_password_required'),
    };
  }

  if (!values.password) {
    return {
      ok: false,
      field: 'password',
      message: t('mobile.errors.password_required'),
    };
  }

  if (values.password.length < 8) {
    return {
      ok: false,
      field: 'password',
      message: t('mobile.errors.password_min_length'),
    };
  }

  if (values.password !== values.password_confirmation) {
    return {
      ok: false,
      field: 'password_confirmation',
      message: t('mobile.errors.password_confirmation_mismatch'),
    };
  }

  return { ok: true };
}
