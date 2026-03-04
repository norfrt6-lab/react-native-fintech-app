import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import { logger } from '../lib/logger';
import { getAnalytics } from '../lib/analytics';
import {
  createAlert,
  evaluateAlerts,
  processTriggeredAlerts,
  requestPermissions,
  configureAndroidChannel,
  registerForPushNotifications,
} from '../core/notification';
import type { PriceAlert, NotificationRecord, CoinMarketData } from '../types';

const TAG = 'NotificationStore';
const MAX_HISTORY = 100;

interface NotificationStore {
  alerts: PriceAlert[];
  history: NotificationRecord[];
  hasPermission: boolean;
  isInitialized: boolean;
  pushToken: string | null;

  initialize: () => Promise<void>;
  registerPushToken: () => Promise<void>;
  addAlert: (coin: CoinMarketData, condition: 'above' | 'below', targetPrice: number) => PriceAlert;
  removeAlert: (alertId: string) => void;
  checkAlerts: (marketData: CoinMarketData[]) => Promise<void>;
  clearTriggeredAlerts: () => void;
  addToHistory: (record: NotificationRecord) => void;
  markAsRead: (recordId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
  clearHistory: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    immer((set, get) => ({
      alerts: [],
      history: [],
      hasPermission: false,
      isInitialized: false,
      pushToken: null,

      initialize: async () => {
        if (get().isInitialized) return;

        configureAndroidChannel();
        const granted = await requestPermissions();

        set((state) => {
          state.hasPermission = granted;
          state.isInitialized = true;
        });

        logger.info(TAG, `Initialized, permission: ${granted}`);
      },

      registerPushToken: async () => {
        const token = await registerForPushNotifications();
        if (token) {
          set((state) => {
            state.pushToken = token;
          });
          logger.info(TAG, 'Push token registered');
        }
      },

      addAlert: (coin, condition, targetPrice) => {
        const alert = createAlert(coin, condition, targetPrice);

        set((state) => {
          state.alerts.push(alert);
        });

        getAnalytics().track({
          name: 'price_alert_created',
          properties: { coinId: coin.id, targetPrice, condition },
        });
        logger.info(TAG, `Alert created: ${coin.symbol} ${condition} $${targetPrice}`);
        return alert;
      },

      removeAlert: (alertId) => {
        set((state) => {
          const index = state.alerts.findIndex((a) => a.id === alertId);
          if (index >= 0) {
            state.alerts.splice(index, 1);
          }
        });
      },

      checkAlerts: async (marketData) => {
        const { alerts, hasPermission } = get();

        // Expire alerts older than 30 days
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const expiredIds: string[] = [];
        for (const alert of alerts) {
          if (alert.status === 'active' && now - new Date(alert.createdAt).getTime() > thirtyDaysMs) {
            expiredIds.push(alert.id);
          }
        }
        if (expiredIds.length > 0) {
          set((state) => {
            for (const alert of state.alerts) {
              if (expiredIds.includes(alert.id)) {
                alert.status = 'expired';
              }
            }
          });
          logger.info(TAG, `Expired ${expiredIds.length} stale alert(s) older than 30 days`);
        }

        const activeAlerts = get().alerts.filter((a) => a.status === 'active');
        if (activeAlerts.length === 0 || !hasPermission) return;

        const { triggeredIds, updatedAlerts } = evaluateAlerts(get().alerts, marketData);

        if (triggeredIds.length > 0) {
          set((state) => {
            state.alerts = updatedAlerts;
          });

          await processTriggeredAlerts(updatedAlerts, triggeredIds, marketData);

          // Add triggered alerts to history
          for (const id of triggeredIds) {
            const alert = updatedAlerts.find((a) => a.id === id);
            if (!alert) continue;

            const record: NotificationRecord = {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              payload: {
                type: 'price_alert',
                title: `${alert.name} Price Alert`,
                body: `${alert.symbol.toUpperCase()} ${alert.condition === 'above' ? 'rose above' : 'dropped below'} $${alert.targetPrice.toLocaleString()}`,
              },
              read: false,
              receivedAt: new Date().toISOString(),
            };

            get().addToHistory(record);
          }

          logger.info(TAG, `${triggeredIds.length} alert(s) triggered`);
        }
      },

      clearTriggeredAlerts: () => {
        set((state) => {
          state.alerts = state.alerts.filter((a) => a.status === 'active');
        });
      },

      addToHistory: (record) => {
        set((state) => {
          state.history.unshift(record);
          if (state.history.length > MAX_HISTORY) {
            state.history = state.history.slice(0, MAX_HISTORY);
          }
        });
      },

      markAsRead: (recordId) => {
        set((state) => {
          const record = state.history.find((r) => r.id === recordId);
          if (record) {
            record.read = true;
          }
        });
      },

      markAllAsRead: () => {
        set((state) => {
          for (const record of state.history) {
            record.read = true;
          }
        });
      },

      getUnreadCount: () => {
        return get().history.filter((r) => !r.read).length;
      },

      clearHistory: () => {
        set((state) => {
          state.history = [];
        });
      },
    })),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        alerts: state.alerts,
        history: state.history,
      }),
    },
  ),
);
