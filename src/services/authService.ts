import { config } from '@/constants/config';
import { apiFetch, setAuthToken } from '@/lib/api/client';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth/tokenStorage';
import { unregisterStoredPushToken } from '@/lib/notifications/pushTokenStorage';
import type {
  ApiResponse,
  AuthCredentials,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types';

export async function login(payload: LoginPayload): Promise<AuthCredentials> {
  const response = await apiFetch<ApiResponse<AuthCredentials>>('/auth/login', {
    method: 'POST',
    body: {
      ...payload,
      device_name: payload.device_name ?? config.deviceName,
    },
  });

  return response.data;
}

export async function register(payload: RegisterPayload): Promise<AuthCredentials> {
  const response = await apiFetch<ApiResponse<AuthCredentials>>('/auth/register', {
    method: 'POST',
    body: {
      ...payload,
      device_name: payload.device_name ?? config.deviceName,
    },
  });

  return response.data;
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiFetch<ApiResponse<User>>('/auth/me', {
    method: 'GET',
    auth: true,
  });

  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', {
      method: 'POST',
      auth: true,
    });
  } catch {
    // Clear local session even when the revoke request fails (offline/network).
  } finally {
    await unregisterStoredPushToken().catch(() => undefined);
    setAuthToken(null);
    await clearStoredToken();
  }
}

export async function restoreSession(): Promise<User | null> {
  const token = await getStoredToken();

  if (!token) {
    setAuthToken(null);
    return null;
  }

  setAuthToken(token);

  try {
    return await fetchCurrentUser();
  } catch {
    setAuthToken(null);
    await clearStoredToken();
    return null;
  }
}

export async function persistSession(credentials: AuthCredentials): Promise<User> {
  setAuthToken(credentials.token);
  await setStoredToken(credentials.token);
  return credentials.user;
}
