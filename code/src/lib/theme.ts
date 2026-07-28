export const Colors = {
  white: '#FFFFFF',
  cream: '#FAF7F2',
  bone: '#F5F0EB',
  brownDark: '#3D2B1F',
  brownMedium: '#7A6555',
  brownLight: '#A89585',
  greenAccent: '#4A7C59',
  greenDark: '#3A6247',
  greenLight: '#E8F5E9',
  border: '#E0D5C8',
  error: '#D32F2F',
  success: '#4CAF50',
  warning: '#FFA000',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const BorderRadius = {
  card: 12,
  button: 8,
  input: 8,
  avatarSmall: 16,
  avatarLarge: 24,
  tag: 16,
} as const;

export const FontSize = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 14,
  small: 12,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof Breakpoints;
