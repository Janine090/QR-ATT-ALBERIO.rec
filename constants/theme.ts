import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const TYPOGRAPHY = {
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  } satisfies TextStyle,
  section: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 17,
  } satisfies TextStyle,
} as const;

export const FONT_MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  } satisfies ViewStyle,
  cyan: {
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
  violet: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,
} as const;
