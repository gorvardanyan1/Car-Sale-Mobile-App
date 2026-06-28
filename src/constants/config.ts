const rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api/v1';

/** Normalized API base URL without trailing slash (includes /v1). */
export const config = {
  apiUrl: rawApiUrl.replace(/\/$/, ''),
  deviceName: 'mobile',
} as const;
