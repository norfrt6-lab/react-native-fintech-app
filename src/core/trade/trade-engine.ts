import { TRADE } from '../../lib/constants';
import { logger } from '../../lib/logger';
import type { TradeOrder, OrderSide, OrderType, Transaction } from '../../types';

const TAG = 'TradeEngine';

export interface TradeInput {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  side: OrderSide;
  type: OrderType;
  amountUsd: number;
  currentPrice: number;
  limitPrice?: number;
  stopPrice?: number;
  availableBalance: number;
}

export interface TradeResult {
  success: boolean;
  order?: TradeOrder;
  transaction?: Transaction;
  error?: string;
}

export function validateTrade(input: TradeInput): string | null {
  if (input.amountUsd <= 0) {
    return 'Amount must be greater than 0';
  }

  if (input.currentPrice <= 0) {
    return 'Invalid price data';
  }

  const fee = input.amountUsd * (TRADE.FEE_PERCENTAGE / 100);
  const totalCost = input.side === 'buy' ? input.amountUsd + fee : 0;

  if (input.side === 'buy' && totalCost > input.availableBalance) {
    return `Insufficient balance. Need ${totalCost.toFixed(2)} but have ${input.availableBalance.toFixed(2)}`;
  }

  if (input.type === 'limit' && (!input.limitPrice || input.limitPrice <= 0)) {
    return 'Limit price is required';
  }

  if (input.type === 'stop' && (!input.stopPrice || input.stopPrice <= 0)) {
    return 'Stop price is required';
  }

  if (input.amountUsd < 1) {
    return 'Minimum trade amount is $1.00';
  }

  if (input.amountUsd > 1_000_000) {
    return 'Maximum trade amount is $1,000,000';
  }

  return null;
}

export function executeTrade(input: TradeInput): TradeResult {
  const validationError = validateTrade(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const fee = input.amountUsd * (TRADE.FEE_PERCENTAGE / 100);
  const effectivePrice = input.type === 'limit' && input.limitPrice
    ? input.limitPrice
    : input.currentPrice;
  const quantity = input.amountUsd / effectivePrice;
  const totalAmount = input.side === 'buy' ? input.amountUsd + fee : input.amountUsd - fee;

  const timestamp = new Date().toISOString();
  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Simulate slippage for market orders (0.01% - 0.05%)
  const slippage = input.type === 'market'
    ? effectivePrice * (0.0001 + Math.random() * 0.0004) * (input.side === 'buy' ? 1 : -1)
    : 0;
  const executedPrice = effectivePrice + slippage;

  const order: TradeOrder = {
    id: orderId,
    coinId: input.coinId,
    symbol: input.symbol,
    name: input.name,
    side: input.side,
    type: input.type,
    quantity,
    price: executedPrice,
    limitPrice: input.limitPrice,
    stopPrice: input.stopPrice,
    totalAmount,
    fee,
    status: 'filled',
    createdAt: timestamp,
    filledAt: timestamp,
  };

  const transaction: Transaction = {
    id: txnId,
    type: input.side,
    coinId: input.coinId,
    symbol: input.symbol,
    name: input.name,
    quantity,
    price: executedPrice,
    totalAmount,
    fee,
    status: 'filled',
    createdAt: timestamp,
  };

  logger.info(TAG, `Trade executed: ${input.side} ${quantity.toFixed(8)} ${input.symbol} @ $${executedPrice.toFixed(2)} (fee: $${fee.toFixed(2)})`);

  return { success: true, order, transaction };
}

export function calculateTradePreview(
  amountUsd: number,
  currentPrice: number,
  side: OrderSide,
) {
  const fee = amountUsd * (TRADE.FEE_PERCENTAGE / 100);
  const total = side === 'buy' ? amountUsd + fee : amountUsd - fee;
  const quantity = amountUsd / currentPrice;

  return { fee, total, quantity };
}
