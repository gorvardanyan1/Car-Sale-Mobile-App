import { Platform, ViewStyle } from 'react-native';

export const shadows = {
  fab: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
    },
    android: { elevation: 12 },
    default: {},
  }),
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
