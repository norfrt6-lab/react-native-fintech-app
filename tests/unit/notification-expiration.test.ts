jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockStorage = new Map<string, string>();
jest.mock('../../src/lib/storage', () => ({
  zustandStorage: {
    getItem: (name: string) => mockStorage.get(name) ?? null,
    setItem: (name: string, value: string) => mockStorage.set(name, value),
    removeItem: (name: string) => mockStorage.delete(name),
  },
  initializeStorage: jest.fn().mockResolvedValue(undefined),
  getStorage: jest.fn(),
  StorageKeys: {},
}));

jest.mock('../../src/lib/analytics', () => ({
  getAnalytics: () => ({ track: jest.fn() }),
}));

jest.mock('../../src/core/notification', () => ({
  createAlert: jest.fn(),
  evaluateAlerts: jest.fn().mockReturnValue({ triggeredIds: [], updatedAlerts: [] }),
  processTriggeredAlerts: jest.fn(),
  requestPermissions: jest.fn().mockResolvedValue(true),
  configureAndroidChannel: jest.fn(),
  registerForPushNotifications: jest.fn().mockResolvedValue(null),
}));

import { useNotificationStore } from '../../src/store/notification.store';
import type { PriceAlert } from '../../src/types';

function makeAlert(overrides: Partial<PriceAlert> = {}): PriceAlert {
  return {
    id: `alert_${Date.now()}_${Math.random()}`,
    coinId: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    condition: 'above',
    targetPrice: 60000,
    createdAt: new Date().toISOString(),
    triggeredAt: null,
    status: 'active',
    priceAtCreation: 50000,
    ...overrides,
  };
}

function resetStore() {
  useNotificationStore.setState({
    alerts: [],
    history: [],
    hasPermission: true,
    isInitialized: true,
    pushToken: null,
  });
}

describe('NotificationStore - Alert Expiration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('does not expire alerts younger than 30 days', async () => {
    const freshAlert = makeAlert({
      id: 'fresh-alert',
      createdAt: new Date().toISOString(),
    });

    useNotificationStore.setState({ alerts: [freshAlert] });

    await useNotificationStore.getState().checkAlerts([]);

    const alerts = useNotificationStore.getState().alerts;
    expect(alerts[0].status).toBe('active');
  });

  it('expires alerts older than 30 days', async () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const oldAlert = makeAlert({
      id: 'old-alert',
      createdAt: thirtyOneDaysAgo.toISOString(),
    });

    useNotificationStore.setState({ alerts: [oldAlert] });

    await useNotificationStore.getState().checkAlerts([]);

    const alerts = useNotificationStore.getState().alerts;
    expect(alerts[0].status).toBe('expired');
  });

  it('only expires active alerts, not triggered ones', async () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const triggeredAlert = makeAlert({
      id: 'triggered-alert',
      status: 'triggered',
      createdAt: thirtyOneDaysAgo.toISOString(),
    });

    useNotificationStore.setState({ alerts: [triggeredAlert] });

    await useNotificationStore.getState().checkAlerts([]);

    const alerts = useNotificationStore.getState().alerts;
    expect(alerts[0].status).toBe('triggered');
  });

  it('expires only old alerts in a mixed set', async () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const alerts = [
      makeAlert({ id: 'old', createdAt: thirtyOneDaysAgo.toISOString() }),
      makeAlert({ id: 'fresh', createdAt: new Date().toISOString() }),
    ];

    useNotificationStore.setState({ alerts });

    await useNotificationStore.getState().checkAlerts([]);

    const result = useNotificationStore.getState().alerts;
    expect(result.find((a) => a.id === 'old')?.status).toBe('expired');
    expect(result.find((a) => a.id === 'fresh')?.status).toBe('active');
  });
});
