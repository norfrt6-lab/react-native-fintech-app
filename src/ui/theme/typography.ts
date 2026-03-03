import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  ios: 'SpaceMono',
  android: 'SpaceMono',
  default: 'SpaceMono',
});

export const typography = {
  h1: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,

  h4: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  body: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,

  label: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  } as TextStyle,

  button: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,

  mono: {
    fontFamily: fontFamilyMono,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  monoLarge: {
    fontFamily: fontFamilyMono,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  } as TextStyle,

  tabBar: {
    fontFamily,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  } as TextStyle,
} as const;

export type Typography = keyof typeof typography;
