export type OrderType = 'market' | 'limit' | 'stop';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'failed';

export interface TradeOrder {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  limitPrice?: number;
  stopPrice?: number;
  totalAmount: number;
  fee: number;
  status: OrderStatus;
  createdAt: string;
  filledAt?: string;
}

export interface TradeFormData {
  coinId: string;
  side: OrderSide;
  type: OrderType;
  amount: string;
  limitPrice: string;
  stopPrice: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'fee';
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fee: number;
  status: OrderStatus;
  createdAt: string;
  note?: string;
}
