import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';
import 'react-native-reanimated';

import { AppThemeProvider } from '@/src/ui/theme/ThemeContext';
import { useSettingsStore, useAuthStore, useConnectivityStore, useNotificationStore, useMarketStore } from '@/src/store';
import { addNotificationResponseListener } from '@/src/core/notification';
import { useRouter } from 'expo-router';
import { LockScreen } from '@/src/ui/components/auth';
import { OfflineBanner } from '@/src/ui/components/common';
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

  const initializeConnectivity = useConnectivityStore((s) => s.initialize);
  const initializeNotifications = useNotificationStore((s) => s.initialize);
  const checkAlerts = useNotificationStore((s) => s.checkAlerts);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const priceAlertsEnabled = useSettingsStore((s) => s.priceAlerts);
  const coins = useMarketStore((s) => s.coins);
  const router = useRouter();

  useEffect(() => {
    const cleanup = initializeConnectivity();
    return cleanup;
  }, [initializeConnectivity]);

  useEffect(() => {
    if (notificationsEnabled) {
      initializeNotifications();
    }
  }, [notificationsEnabled, initializeNotifications]);

  // Check price alerts whenever market data updates
  useEffect(() => {
    if (notificationsEnabled && priceAlertsEnabled && coins.length > 0) {
      checkAlerts(coins);
    }
  }, [coins, notificationsEnabled, priceAlertsEnabled, checkAlerts]);

  // Handle notification tap → deep link
  useEffect(() => {
    const subscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'price_alert' && data?.coinId) {
        router.push(`/coin/${data.coinId}`);
      }
    });
    return () => subscription.remove();
  }, [router]);

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
          <OfflineBanner />
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
