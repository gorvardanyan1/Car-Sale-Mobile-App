import { TextStyle } from 'react-native';

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const typography = {
  screenTitle: {
    fontSize: 20,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
  } satisfies TextStyle,
  body: {
    fontSize: 14,
    fontWeight: fontWeight.normal,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
  } satisfies TextStyle,
  tabLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  } satisfies TextStyle,
} as const;
