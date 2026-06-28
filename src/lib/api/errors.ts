import type { ApiErrorResponse, FieldErrors } from '@/types';
import { ApiClientError, ApiNetworkError } from '@/lib/api/client';

export function mapApiErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiClientError)) {
    return {};
  }

  if (!error.errors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [field, messages[0] ?? 'Invalid value']),
  );
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiClientError) {
    return error.message || fallback;
  }

  if (error instanceof ApiNetworkError) {
    return error.message;
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('network')) {
    return 'Network request failed. Check your API URL and connection.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function firstFieldError(errors: FieldErrors, field: string): string | undefined {
  return errors[field];
}

export type { ApiErrorResponse };
