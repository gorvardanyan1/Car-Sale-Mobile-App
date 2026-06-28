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

  it('returns message badge count for messages tab', () => {
    expect(getTabBadgeCount('messages')).toBe(3);
    expect(getTabBadgeCount('favorites')).toBe(0);
    expect(getTabBadgeCount('settings')).toBe(0);
  });
});
