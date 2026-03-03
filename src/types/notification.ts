export type AlertCondition = 'above' | 'below';
export type AlertStatus = 'active' | 'triggered' | 'expired';

export interface PriceAlert {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  condition: AlertCondition;
  targetPrice: number;
  createdAt: string;
  triggeredAt: string | null;
  status: AlertStatus;
  priceAtCreation: number;
}

export interface NotificationPayload {
  type: 'price_alert' | 'trade_filled' | 'deposit_confirmed' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationRecord {
  id: string;
  payload: NotificationPayload;
  read: boolean;
  receivedAt: string;
}
