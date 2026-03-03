import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { lightColors, darkColors, ThemeColors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedTheme?: 'light' | 'dark';
}

export function AppThemeProvider({ children, forcedTheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const colorScheme = forcedTheme ?? systemColorScheme ?? 'light';

  const theme = useMemo<Theme>(
    () => ({
      colors: colorScheme === 'dark' ? darkColors : lightColors,
      spacing,
      borderRadius,
      typography,
      shadows,
      isDark: colorScheme === 'dark',
    }),
    [colorScheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within AppThemeProvider');
  }
  return theme;
}
