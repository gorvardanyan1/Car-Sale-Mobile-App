import { describe, expect, it } from 'vitest';

import { ApiClientError, ApiNetworkError } from '@/lib/api/client';
import { mapApiErrors, getErrorMessage } from '@/lib/api/errors';

describe('mapApiErrors', () => {
  it('maps Laravel validation errors to first message per field', () => {
    const error = new ApiClientError('Validation failed', 422, {
      email: ['The email field is required.'],
      password: ['The password field is required.'],
    });

    expect(mapApiErrors(error)).toEqual({
      email: 'The email field is required.',
      password: 'The password field is required.',
    });
  });

  it('returns empty object for non-api errors', () => {
    expect(mapApiErrors(new Error('network'))).toEqual({});
  });
});

describe('getErrorMessage', () => {
  it('returns api client message when available', () => {
    const error = new ApiClientError('Invalid credentials', 422);
    expect(getErrorMessage(error)).toBe('Invalid credentials');
  });

  it('returns network error message when api is unreachable', () => {
    const error = new ApiNetworkError('Cannot reach API', 'http://example.test/api/v1/auth/login');
    expect(getErrorMessage(error)).toBe('Cannot reach API');
  });
});
