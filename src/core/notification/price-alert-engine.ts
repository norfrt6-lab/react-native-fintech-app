import { logger } from '../../lib/logger';
import { schedulePriceAlertNotification } from './notification-service';
import type { PriceAlert, CoinMarketData } from '../../types';

const TAG = 'PriceAlertEngine';

export function createAlert(
  coin: CoinMarketData,
  condition: 'above' | 'below',
  targetPrice: number,
): PriceAlert {
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coinId: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    condition,
    targetPrice,
    createdAt: new Date().toISOString(),
    triggeredAt: null,
    status: 'active',
    priceAtCreation: coin.currentPrice,
  };
}

export function evaluateAlerts(
  alerts: PriceAlert[],
  marketData: CoinMarketData[],
): { triggeredIds: string[]; updatedAlerts: PriceAlert[] } {
  const priceMap = new Map<string, number>();
  for (const coin of marketData) {
    priceMap.set(coin.id, coin.currentPrice);
  }

  const triggeredIds: string[] = [];

  const updatedAlerts = alerts.map((alert) => {
    if (alert.status !== 'active') return alert;

    const currentPrice = priceMap.get(alert.coinId);
    if (currentPrice === undefined) return alert;

    const triggered =
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);

    if (triggered) {
      triggeredIds.push(alert.id);
      logger.info(
        TAG,
        `Alert triggered: ${alert.symbol} ${alert.condition} $${alert.targetPrice} (current: $${currentPrice})`,
      );

      return {
        ...alert,
        status: 'triggered' as const,
        triggeredAt: new Date().toISOString(),
      };
    }

    return alert;
  });

  return { triggeredIds, updatedAlerts };
}

export async function processTriggeredAlerts(
  alerts: PriceAlert[],
  triggeredIds: string[],
  marketData: CoinMarketData[],
): Promise<void> {
  const priceMap = new Map<string, number>();
  for (const coin of marketData) {
    priceMap.set(coin.id, coin.currentPrice);
  }

  for (const id of triggeredIds) {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) continue;

    const currentPrice = priceMap.get(alert.coinId) ?? alert.targetPrice;

    await schedulePriceAlertNotification(
      alert.name,
      alert.symbol,
      alert.condition,
      alert.targetPrice,
      currentPrice,
    );
  }
}

export function getActiveAlertCount(alerts: PriceAlert[]): number {
  return alerts.filter((a) => a.status === 'active').length;
}

export function getAlertsForCoin(alerts: PriceAlert[], coinId: string): PriceAlert[] {
  return alerts.filter((a) => a.coinId === coinId);
}

export function validateAlertPrice(
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number,
): string | null {
  if (targetPrice <= 0) {
    return 'Target price must be greater than 0';
  }

  if (condition === 'above' && targetPrice <= currentPrice) {
    return 'Target price must be above current price';
  }

  if (condition === 'below' && targetPrice >= currentPrice) {
    return 'Target price must be below current price';
  }

  return null;
}
