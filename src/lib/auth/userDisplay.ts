import type { User } from '@/types';

export function getUserDisplayName(user: User): string {
  if (user.last_name) {
    return `${user.name} ${user.last_name}`.trim();
  }

  return user.name;
}

export function getUserInitials(user: User): string {
  const parts = getUserDisplayName(user).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
