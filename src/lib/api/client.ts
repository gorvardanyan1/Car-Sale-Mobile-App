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

  return parseApiResponse<T>(response, url, rest.method);
}

type FormDataFile = {
  uri: string;
  name: string;
  type: string;
};

type FormDataValue = string | number | boolean | null | undefined | Blob | FormDataFile;

export type ApiFormDataInput = Record<string, FormDataValue | FormDataValue[]>;

export async function apiFormData<T>(path: string, options: {
  method?: 'POST' | 'PUT' | 'PATCH';
  fields: ApiFormDataInput;
  auth?: boolean;
}): Promise<T> {
  const { fields, auth = false, method = 'POST' } = options;
  const formData = buildMultipartFormData(fields);
  const url = `${config.apiUrl}${path}`;

  if (__DEV__) {
    console.log(`[api] ${method} ${url} (multipart)`);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    return await sendMultipartRequest<T>(url, method, formData, headers);
  } catch (error) {
    if (__DEV__) {
      console.warn(`[api] multipart failed ${method} ${url}`, error);
    }

    if (error instanceof ApiClientError || error instanceof ApiNetworkError) {
      throw error;
    }

    throw new ApiNetworkError(
      error instanceof Error
        ? error.message
        : 'Cannot reach the API server. Check EXPO_PUBLIC_API_URL, Wi‑Fi, and that Laravel is running.',
      url,
    );
  }
}

function buildMultipartFormData(fields: ApiFormDataInput): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        appendFormDataValue(formData, `${key}[]`, item);
      }
      continue;
    }

    appendFormDataValue(formData, key, value);
  }

  return formData;
}

function sendMultipartRequest<T>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH',
  formData: FormData,
  headers: Record<string, string>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.timeout = 120_000;

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.onload = () => {
      void (async () => {
        try {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            headers: { 'content-type': xhr.getResponseHeader('content-type') ?? 'application/json' },
          });
          resolve(await parseApiResponse<T>(response, url, method));
        } catch (error) {
          reject(error);
        }
      })();
    };

    xhr.onerror = () => {
      reject(
        new ApiNetworkError(
          'Network request failed while uploading. Check your connection and try a smaller photo.',
          url,
        ),
      );
    };

    xhr.ontimeout = () => {
      reject(
        new ApiNetworkError(
          'Upload timed out. Try a smaller photo or check that the API server is running.',
          url,
        ),
      );
    };

    xhr.send(formData);
  });
}

function appendFormDataValue(formData: FormData, key: string, value: FormDataValue): void {
  if (value === undefined || value === null) {
    return;
  }

  if (isFormDataFile(value)) {
    // React Native expects { uri, name, type } — not a web Blob.
    formData.append(key, {
      uri: value.uri,
      name: value.name,
      type: value.type,
    } as unknown as Blob);
    return;
  }

  formData.append(key, String(value));
}

function isFormDataFile(value: FormDataValue): value is FormDataFile {
  return typeof value === 'object' && value !== null && 'uri' in value && 'name' in value && 'type' in value;
}

async function parseApiResponse<T>(response: Response, url: string, method?: string): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | undefined;

    if (__DEV__) {
      console.warn(`[api] ${response.status} ${method ?? 'GET'} ${url}`, errorPayload?.message);
    }

    throw new ApiClientError(
      errorPayload?.message ?? response.statusText,
      response.status,
      errorPayload?.errors,
    );
  }

  return payload as T;
}
