import { config } from '@/constants/config';
import type { ApiErrorResponse } from '@/types';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class ApiNetworkError extends Error {
  constructor(
    message: string,
    public url: string,
  ) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, auth = false, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (auth && authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const url = `${config.apiUrl}${path}`;

  if (__DEV__) {
    console.log(`[api] ${rest.method ?? 'GET'} ${url}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiNetworkError(
      'Cannot reach the API server. Check EXPO_PUBLIC_API_URL, Wi‑Fi, and that Laravel is running.',
      url,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | undefined;

    if (__DEV__) {
      console.warn(`[api] ${response.status} ${rest.method ?? 'GET'} ${url}`, errorPayload?.message);
    }

    throw new ApiClientError(
      errorPayload?.message ?? response.statusText,
      response.status,
      errorPayload?.errors,
    );
  }

  return payload as T;
}
