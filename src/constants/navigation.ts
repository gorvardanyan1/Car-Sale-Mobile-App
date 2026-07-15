export type TabRouteName = 'index' | 'messages' | 'create' | 'favorites' | 'settings';

export type TabConfig = {
  name: TabRouteName;
  labelKey: string;
  iconName: 'car' | 'message-circle' | 'plus' | 'heart' | 'settings';
  isFab?: boolean;
};

/** Bottom navigation items — matches Figma Beauty Car Sale App order */
export const TAB_ITEMS: TabConfig[] = [
  { name: 'index', labelKey: 'mobile.tabs.list', iconName: 'car' },
  { name: 'messages', labelKey: 'mobile.tabs.messages', iconName: 'message-circle' },
  { name: 'create', labelKey: 'mobile.tabs.create', iconName: 'plus', isFab: true },
  { name: 'favorites', labelKey: 'mobile.tabs.favorites', iconName: 'heart' },
  { name: 'settings', labelKey: 'mobile.tabs.settings', iconName: 'settings' },
];

export function getTabBadgeCount(routeName: TabRouteName, unreadMessages = 0): number {
  switch (routeName) {
    case 'messages':
      return unreadMessages;
    case 'favorites':
      return 0;
    default:
      return 0;
  }
}
