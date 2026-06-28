/** Design tokens from Beauty Car Sale App (Figma) */
export const colors = {
  background: '#0F1117',
  backgroundElevated: '#111827',
  surface: '#1A1D27',
  surfaceMuted: '#1F2937',

  card: '#111827',
  cardBorder: 'rgba(55, 65, 81, 0.6)',

  navBar: 'rgba(17, 24, 39, 0.95)',
  navBorder: 'rgba(31, 41, 55, 0.8)',

  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  primaryLight: '#60A5FA',

  text: '#FFFFFF',
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  textSubtle: '#6B7280',
  textDisabled: '#4B5563',

  border: '#374151',
  borderSubtle: '#1F2937',

  success: '#16A34A',
  successDark: '#059669',
  error: '#DC2626',
  errorMuted: 'rgba(127, 29, 29, 0.5)',
  warning: '#F97316',
  urgent: '#EF4444',

  badge: '#3B82F6',
  favorite: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.6)',

  inputBackground: 'rgba(31, 41, 55, 0.8)',
  inputBorder: '#374151',
  inputPlaceholder: '#6B7280',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const gradients = {
  primary: ['#3B82F6', '#1E40AF'] as const,
  urgent: ['#F97316', '#EF4444'] as const,
  success: ['#22C55E', '#059669'] as const,
} as const;
