import { describe, expect, it } from 'vitest';

import { getUserDisplayName, getUserInitials } from '@/lib/auth/userDisplay';
import type { User } from '@/types';

const baseUser: User = {
  id: 1,
  name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  email_verified_at: null,
  is_dealer_verified: false,
  roles: ['user'],
  created_at: null,
};

describe('user display helpers', () => {
  it('builds full display name for individuals', () => {
    expect(getUserDisplayName(baseUser)).toBe('John Doe');
    expect(getUserInitials(baseUser)).toBe('JD');
  });

  it('uses company name for dealers without last name', () => {
    const dealer: User = {
      ...baseUser,
      name: 'Auto Dealer LLC',
      last_name: null,
      roles: ['dealer'],
    };

    expect(getUserDisplayName(dealer)).toBe('Auto Dealer LLC');
    expect(getUserInitials(dealer)).toBe('AD');
  });
});
