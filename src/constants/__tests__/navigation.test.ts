import { describe, expect, it } from 'vitest';

import { getTabBadgeCount, TAB_ITEMS } from '@/constants/navigation';

describe('navigation constants', () => {
  it('defines five tabs in Figma order with create as fab', () => {
    expect(TAB_ITEMS).toHaveLength(5);
    expect(TAB_ITEMS.map((tab) => tab.name)).toEqual([
      'index',
      'messages',
      'create',
      'favorites',
      'settings',
    ]);
    expect(TAB_ITEMS.find((tab) => tab.isFab)?.name).toBe('create');
  });

  it('returns the caller-supplied unread count for the messages tab only', () => {
    expect(getTabBadgeCount('messages')).toBe(0);
    expect(getTabBadgeCount('messages', 5)).toBe(5);
    expect(getTabBadgeCount('favorites', 5)).toBe(0);
    expect(getTabBadgeCount('settings', 5)).toBe(0);
  });
});
