export type UpdateProfilePayload = {
  name: string;
  last_name?: string | null;
  email: string;
};

export type ChangePasswordPayload = {
  name: string;
  email: string;
  old_password: string;
  password: string;
  password_confirmation: string;
};
