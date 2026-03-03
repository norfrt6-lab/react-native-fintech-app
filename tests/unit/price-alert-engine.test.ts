import {
  createAlert,
  evaluateAlerts,
  getActiveAlertCount,
  getAlertsForCoin,
  validateAlertPrice,
} from '../../src/core/notification/price-alert-engine';
import type { PriceAlert, CoinMarketData } from '../../src/types';

jest.mock('../../src/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../src/core/notification/notification-service', () => ({
  schedulePriceAlertNotification: jest.fn().mockResolvedValue('notif-id'),
}));

const mockCoin: CoinMarketData = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/btc.png',
  currentPrice: 50000,
  marketCap: 1000000000000,
  marketCapRank: 1,
  totalVolume: 30000000000,
  high24h: 51000,
  low24h: 49000,
  priceChange24h: 500,
  priceChangePercentage24h: 1.0,
  priceChangePercentage7d: 5.0,
  circulatingSupply: 19000000,
  totalSupply: 21000000,
  maxSupply: 21000000,
  ath: 69000,
  athChangePercentage: -27.5,
  athDate: '2021-11-10',
  lastUpdated: new Date().toISOString(),
};

describe('createAlert', () => {
  it('creates an alert with correct fields', () => {
    const alert = createAlert(mockCoin, 'above', 55000);
    expect(alert.coinId).toBe('bitcoin');
    expect(alert.symbol).toBe('btc');
    expect(alert.name).toBe('Bitcoin');
    expect(alert.condition).toBe('above');
    expect(alert.targetPrice).toBe(55000);
    expect(alert.status).toBe('active');
    expect(alert.triggeredAt).toBeNull();
    expect(alert.priceAtCreation).toBe(50000);
    expect(alert.id).toMatch(/^alert-/);
  });

  it('creates unique IDs', () => {
    const a1 = createAlert(mockCoin, 'above', 55000);
    const a2 = createAlert(mockCoin, 'below', 45000);
    expect(a1.id).not.toBe(a2.id);
  });
});

describe('evaluateAlerts', () => {
  it('triggers alert when price goes above target', () => {
    const alert: PriceAlert = {
      ...createAlert(mockCoin, 'above', 49000),
    };

    const { triggeredIds, updatedAlerts } = evaluateAlerts([alert], [mockCoin]);
    expect(triggeredIds).toContain(alert.id);
    expect(updatedAlerts[0].status).toBe('triggered');
    expect(updatedAlerts[0].triggeredAt).toBeDefined();
  });

  it('triggers alert when price drops below target', () => {
    const alert = createAlert(mockCoin, 'below', 51000);

    const { triggeredIds } = evaluateAlerts([alert], [mockCoin]);
    expect(triggeredIds).toContain(alert.id);
  });

  it('does not trigger when condition is not met', () => {
    const alert = createAlert(mockCoin, 'above', 60000);

    const { triggeredIds } = evaluateAlerts([alert], [mockCoin]);
    expect(triggeredIds).toHaveLength(0);
  });

  it('skips already triggered alerts', () => {
    const alert: PriceAlert = {
      ...createAlert(mockCoin, 'above', 49000),
      status: 'triggered',
      triggeredAt: new Date().toISOString(),
    };

    const { triggeredIds } = evaluateAlerts([alert], [mockCoin]);
    expect(triggeredIds).toHaveLength(0);
  });

  it('handles missing market data for a coin', () => {
    const alert = createAlert(mockCoin, 'above', 49000);

    const { triggeredIds } = evaluateAlerts([alert], []);
    expect(triggeredIds).toHaveLength(0);
  });

  it('evaluates multiple alerts', () => {
    const above = createAlert(mockCoin, 'above', 49000); // should trigger (50k >= 49k)
    const below = createAlert(mockCoin, 'below', 51000); // should trigger (50k <= 51k)
    const notYet = createAlert(mockCoin, 'above', 60000); // not yet

    const { triggeredIds } = evaluateAlerts([above, below, notYet], [mockCoin]);
    expect(triggeredIds).toHaveLength(2);
    expect(triggeredIds).toContain(above.id);
    expect(triggeredIds).toContain(below.id);
  });
});

describe('validateAlertPrice', () => {
  it('rejects zero or negative price', () => {
    expect(validateAlertPrice('above', 0, 50000)).toBe('Target price must be greater than 0');
    expect(validateAlertPrice('above', -100, 50000)).toBe('Target price must be greater than 0');
  });

  it('rejects above alert with target <= current', () => {
    expect(validateAlertPrice('above', 50000, 50000)).toBe('Target price must be above current price');
    expect(validateAlertPrice('above', 49000, 50000)).toBe('Target price must be above current price');
  });

  it('rejects below alert with target >= current', () => {
    expect(validateAlertPrice('below', 50000, 50000)).toBe('Target price must be below current price');
    expect(validateAlertPrice('below', 51000, 50000)).toBe('Target price must be below current price');
  });

  it('accepts valid above alert', () => {
    expect(validateAlertPrice('above', 55000, 50000)).toBeNull();
  });

  it('accepts valid below alert', () => {
    expect(validateAlertPrice('below', 45000, 50000)).toBeNull();
  });
});

describe('getActiveAlertCount', () => {
  it('counts only active alerts', () => {
    const alerts: PriceAlert[] = [
      { ...createAlert(mockCoin, 'above', 55000), status: 'active' },
      { ...createAlert(mockCoin, 'below', 45000), status: 'triggered', triggeredAt: new Date().toISOString() },
      { ...createAlert(mockCoin, 'above', 60000), status: 'active' },
    ];
    expect(getActiveAlertCount(alerts)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(getActiveAlertCount([])).toBe(0);
  });
});

describe('getAlertsForCoin', () => {
  it('filters by coinId', () => {
    const btcAlert = createAlert(mockCoin, 'above', 55000);
    const ethCoin = { ...mockCoin, id: 'ethereum', symbol: 'eth', name: 'Ethereum' };
    const ethAlert = createAlert(ethCoin, 'below', 3000);

    const result = getAlertsForCoin([btcAlert, ethAlert], 'bitcoin');
    expect(result).toHaveLength(1);
    expect(result[0].coinId).toBe('bitcoin');
  });
});
