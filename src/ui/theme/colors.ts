export const palette = {
  // Brand
  primary: '#0052FF',
  primaryLight: '#3377FF',
  primaryDark: '#003ACC',

  // Accent
  accent: '#00D4AA',
  accentLight: '#33DDBB',
  accentDark: '#00A888',

  // Status
  success: '#00C853',
  successLight: '#E8F5E9',
  warning: '#FFB300',
  warningLight: '#FFF8E1',
  error: '#FF3D00',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Chart colors
  chartGreen: '#00C853',
  chartRed: '#FF3D00',
  chartBlue: '#2196F3',
  chartOrange: '#FF9800',
  chartPurple: '#9C27B0',
  chartTeal: '#009688',
} as const;

export type PaletteColor = keyof typeof palette;

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  headerBackground: string;
  statusBar: 'light' | 'dark';
  skeleton: string;
  chartPositive: string;
  chartNegative: string;
}

export const lightColors: ThemeColors = {
  primary: palette.primary,
  primaryLight: palette.primaryLight,
  primaryDark: palette.primaryDark,
  accent: palette.accent,
  background: palette.white,
  backgroundSecondary: palette.gray50,
  surface: palette.white,
  surfaceElevated: palette.white,
  text: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  border: palette.gray300,
  borderLight: palette.gray200,
  divider: palette.gray200,
  success: palette.success,
  successLight: palette.successLight,
  warning: palette.warning,
  warningLight: palette.warningLight,
  error: palette.error,
  errorLight: palette.errorLight,
  info: palette.info,
  infoLight: palette.infoLight,
  tabBar: palette.white,
  tabBarActive: palette.primary,
  tabBarInactive: palette.gray500,
  headerBackground: palette.white,
  statusBar: 'dark',
  skeleton: palette.gray200,
  chartPositive: palette.chartGreen,
  chartNegative: palette.chartRed,
};

export const darkColors: ThemeColors = {
  primary: palette.primaryLight,
  primaryLight: palette.primary,
  primaryDark: palette.primaryLight,
  accent: palette.accentLight,
  background: '#0A0A0A',
  backgroundSecondary: '#141414',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  text: palette.gray100,
  textSecondary: palette.gray400,
  textTertiary: palette.gray600,
  textInverse: palette.gray900,
  border: '#333333',
  borderLight: '#2A2A2A',
  divider: '#1F1F1F',
  success: palette.success,
  successLight: '#1A3A1A',
  warning: palette.warning,
  warningLight: '#3A3A1A',
  error: palette.error,
  errorLight: '#3A1A1A',
  info: palette.info,
  infoLight: '#1A2A3A',
  tabBar: '#0A0A0A',
  tabBarActive: palette.primaryLight,
  tabBarInactive: palette.gray600,
  headerBackground: '#0A0A0A',
  statusBar: 'light',
  skeleton: '#2A2A2A',
  chartPositive: palette.chartGreen,
  chartNegative: palette.chartRed,
};
