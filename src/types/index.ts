export type AccountType = 'user' | 'dealer';

export type User = {
  id: number;
  name: string;
  last_name: string | null;
  email: string;
  email_verified_at: string | null;
  is_dealer_verified: boolean;
  roles: string[];
  created_at: string | null;
};

export type AuthCredentials = {
  user: User;
  token: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  device_name?: string;
};

export type RegisterPayload = {
  account_type: AccountType;
  name: string;
  last_name?: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
};

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  message: string;
  errors?: Record<string, string[]>;
};

export type FieldErrors = Record<string, string>;
