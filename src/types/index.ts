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

/**
 * A native Google sign-in, exchanged at `POST /auth/google`.
 *
 * Carries only the ID token: the email, name and Google user id are read
 * server-side out of the verified token, never sent by the client, so there is
 * nothing here an attacker could set to claim someone else's identity.
 */
export type GoogleLoginPayload = {
  idToken: string;
  deviceName?: string;
  /** Invite code, when the user arrived through a referral link. */
  referralCode?: string;
};

export type RegisterPayload = {
  account_type: AccountType;
  name: string;
  last_name?: string;
  email: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
  /** ISO `YYYY-MM-DD`. Optional; drives the yearly birthday points bonus. */
  birth_date?: string;
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
