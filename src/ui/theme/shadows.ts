import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ShadowStyle =>
  Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  }) as ShadowStyle;

export const shadows = {
  none: createShadow(0, 0, 0, 0),
  sm: createShadow(1, 2, 0.08, 2),
  md: createShadow(2, 4, 0.12, 4),
  lg: createShadow(4, 8, 0.16, 8),
  xl: createShadow(8, 16, 0.2, 16),
} as const;

export type Shadow = keyof typeof shadows;
