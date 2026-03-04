import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../../lib/logger';
import type { NotificationPayload } from '../../types';

const TAG = 'NotificationService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';

    if (!granted) {
      logger.warn(TAG, 'Notification permission denied');
    }

    return granted;
  } catch (error) {
    logger.error(TAG, 'Failed to request notification permissions', error);
    return false;
  }
}

export async function getPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function scheduleLocalNotification(
  payload: NotificationPayload,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: true,
      },
      trigger: null, // immediate
    });

    logger.info(TAG, `Notification scheduled: ${payload.title}`, { id });
    return id;
  } catch (error) {
    logger.error(TAG, 'Failed to schedule notification', error);
    return null;
  }
}

export async function schedulePriceAlertNotification(
  coinName: string,
  symbol: string,
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number,
): Promise<string | null> {
  const direction = condition === 'above' ? 'risen above' : 'dropped below';

  return scheduleLocalNotification({
    type: 'price_alert',
    title: `${coinName} Price Alert`,
    body: `${symbol.toUpperCase()} has ${direction} $${targetPrice.toLocaleString()} — now at $${currentPrice.toLocaleString()}`,
    data: {
      type: 'price_alert',
      coinId: coinName.toLowerCase(),
      symbol,
    },
  });
}

export async function scheduleTradeNotification(
  side: 'buy' | 'sell',
  coinName: string,
  quantity: string,
  totalAmount: string,
): Promise<string | null> {
  const action = side === 'buy' ? 'Purchased' : 'Sold';

  return scheduleLocalNotification({
    type: 'trade_filled',
    title: `Trade ${side === 'buy' ? 'Executed' : 'Executed'}`,
    body: `${action} ${quantity} ${coinName} for ${totalAmount}`,
    data: { type: 'trade_filled' },
  });
}

export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

export function configureAndroidChannel(): void {
  if (Platform.OS !== 'android') return;

  Notifications.setNotificationChannelAsync('price-alerts', {
    name: 'Price Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: null,
  });

  Notifications.setNotificationChannelAsync('trades', {
    name: 'Trade Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
  });

  Notifications.setNotificationChannelAsync('general', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  logger.info(TAG, 'Android notification channels configured');
}

export async function registerForPushNotifications(): Promise<string | null> {
  // Push tokens require Firebase (FCM) on Android — skip in dev builds without it
  if (__DEV__) {
    logger.info(TAG, 'Push token registration skipped in dev mode');
    return null;
  }

  try {
    const granted = await requestPermissions();
    if (!granted) {
      logger.warn(TAG, 'Push token registration skipped: permission denied');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'fintrack-portfolio-app',
    });

    logger.info(TAG, `Expo push token obtained: ${tokenData.data.slice(0, 20)}...`);
    return tokenData.data;
  } catch (error) {
    logger.error(TAG, 'Failed to get Expo push token', error);
    return null;
  }
}

export async function getDevicePushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    logger.info(TAG, `Device push token obtained (${tokenData.type})`);
    return tokenData.data as string;
  } catch (error) {
    logger.error(TAG, 'Failed to get device push token', error);
    return null;
  }
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
