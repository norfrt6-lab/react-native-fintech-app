import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';
import 'react-native-reanimated';

import { AppThemeProvider } from '@/src/ui/theme/ThemeContext';
import { useSettingsStore, useAuthStore } from '@/src/store';
import { LockScreen } from '@/src/ui/components/auth';
import '@/src/lib/i18n';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const theme = useSettingsStore((s) => s.theme);
  const {
    isAuthenticated,
    isLocked,
    setLocked,
    updateLastActive,
    lastActiveAt,
    securitySettings,
  } = useAuthStore();

  const appStateRef = useRef(AppState.currentState);

  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        updateLastActive();
      }

      if (
        nextAppState === 'active' &&
        appStateRef.current !== 'active' &&
        isAuthenticated &&
        securitySettings.biometricEnabled
      ) {
        const timeout = securitySettings.autoLockTimeout * 60 * 1000;
        if (lastActiveAt && Date.now() - lastActiveAt > timeout) {
          setLocked(true);
        }
      }

      appStateRef.current = nextAppState as typeof appStateRef.current;
    },
    [isAuthenticated, securitySettings, lastActiveAt, setLocked, updateLastActive],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  const handleUnlock = useCallback(() => {
    setLocked(false);
    updateLastActive();
  }, [setLocked, updateLastActive]);

  const isDark = theme === 'dark';
  const forcedTheme = theme === 'system' ? undefined : theme;

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppThemeProvider forcedTheme={forcedTheme}>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          {isLocked && isAuthenticated ? (
            <LockScreen onUnlock={handleUnlock} />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="coin/[id]"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="trade/[id]"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack>
          )}
        </ThemeProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
