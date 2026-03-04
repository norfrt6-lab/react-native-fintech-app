import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect, useRef, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';
import 'react-native-reanimated';

import { AppThemeProvider } from '@/src/ui/theme/ThemeContext';
import { useSettingsStore, useAuthStore, useConnectivityStore, useNotificationStore, useMarketStore, usePortfolioStore } from '@/src/store';
import { addNotificationResponseListener } from '@/src/core/notification';
import { useRouter, usePathname } from 'expo-router';
import { LockScreen } from '@/src/ui/components/auth';
import { OfflineBanner } from '@/src/ui/components/common';
import { initializeStorage } from '@/src/lib/storage';
import { getCrashReporter } from '@/src/lib/crash-reporter';
import { recordMetric } from '@/src/lib/metrics';
import { initAnalytics, getAnalytics } from '@/src/lib/analytics';
import { checkDeviceIntegrity, isDebuggerAttached } from '@/src/lib/security';
import * as ScreenCapture from 'expo-screen-capture';
import * as Linking from 'expo-linking';
import { parseDeepLink, isValidDeepLink } from '@/src/lib/deep-linking';
import { fetchTrades, fetchWatchlist, fetchSettings } from '@/src/core/data';
import '@/src/lib/i18n';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

const moduleLoadTime = Date.now();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    getCrashReporter().init();
    initAnalytics();

    checkDeviceIntegrity().then((result) => {
      if (!result.isSecure) {
        getCrashReporter().setTag('device_integrity', 'warning');
      }
    });

    if (isDebuggerAttached()) {
      getCrashReporter().addBreadcrumb({
        category: 'security',
        message: 'Debugger detected in production',
        level: 'warning',
      });
    }

    initializeStorage().then(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    if (loaded && storageReady) {
      recordMetric('app_cold_start_time', Date.now() - moduleLoadTime);
      SplashScreen.hideAsync();
    }
  }, [loaded, storageReady]);

  if (!loaded || !storageReady) {
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
    user,
  } = useAuthStore();

  const initializeConnectivity = useConnectivityStore((s) => s.initialize);
  const initializeNotifications = useNotificationStore((s) => s.initialize);
  const registerPushToken = useNotificationStore((s) => s.registerPushToken);
  const checkAlerts = useNotificationStore((s) => s.checkAlerts);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const priceAlertsEnabled = useSettingsStore((s) => s.priceAlerts);
  const coins = useMarketStore((s) => s.coins);
  const loadPortfolioFromRemote = usePortfolioStore((s) => s.loadFromRemote);
  const router = useRouter();
  const pathname = usePathname();

  // Track screen views
  useEffect(() => {
    if (pathname) {
      getAnalytics().trackScreenView(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated && securitySettings.screenshotPrevention) {
      ScreenCapture.preventScreenCaptureAsync();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
      };
    } else if (isAuthenticated) {
      ScreenCapture.allowScreenCaptureAsync();
    }
  }, [isAuthenticated, securitySettings.screenshotPrevention]);

  useEffect(() => {
    const cleanup = initializeConnectivity();
    return cleanup;
  }, [initializeConnectivity]);

  useEffect(() => {
    if (notificationsEnabled) {
      initializeNotifications();
    }
  }, [notificationsEnabled, initializeNotifications]);

  useEffect(() => {
    if (isAuthenticated && notificationsEnabled) {
      registerPushToken();
    }
  }, [isAuthenticated, notificationsEnabled, registerPushToken]);

  // Load remote data when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      loadPortfolioFromRemote(user.uid);
      fetchTrades(user.uid);
      fetchWatchlist(user.uid);
      fetchSettings(user.uid);
    }
  }, [isAuthenticated, user?.uid, loadPortfolioFromRemote]);

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

  // Handle incoming deep links (universal links / app links)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (!isValidDeepLink(event.url)) return;
      const route = parseDeepLink(event.url);
      if (route && isAuthenticated) {
        router.push(route.screen as never);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [router, isAuthenticated]);

  const appStateRef = useRef(AppState.currentState);

  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        updateLastActive();
        getAnalytics().track({ name: 'app_backgrounded' });
        getAnalytics().endSession();
      }

      if (nextAppState === 'active' && appStateRef.current !== 'active') {
        getAnalytics().track({ name: 'app_foregrounded' });
      }

      if (
        nextAppState === 'active' &&
        appStateRef.current !== 'active' &&
        isAuthenticated &&
        (securitySettings.biometricEnabled || securitySettings.pinEnabled)
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
