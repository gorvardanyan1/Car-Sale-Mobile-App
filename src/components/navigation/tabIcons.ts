import { Car, Heart, MessageCircle, Plus, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { TabConfig } from '@/constants/navigation';

const TAB_ICONS: Record<TabConfig['iconName'], LucideIcon> = {
  car: Car,
  'message-circle': MessageCircle,
  plus: Plus,
  heart: Heart,
  settings: Settings,
};

export function getTabIcon(iconName: TabConfig['iconName']): LucideIcon {
  return TAB_ICONS[iconName];
}
