import { TRADE } from '../../lib/constants';
import { logger } from '../../lib/logger';
import { divide, multiply, percentOf, toFixed } from '../../lib/decimal';
import { secureRandom, secureRandomId } from '../../lib/crypto-utils';
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

  const fee = percentOf(input.amountUsd, TRADE.FEE_PERCENTAGE);
  const totalCost = input.side === 'buy' ? input.amountUsd + fee : 0;

  if (input.side === 'buy' && totalCost > input.availableBalance) {
    return `Insufficient balance. Need ${toFixed(totalCost, 2)} but have ${toFixed(input.availableBalance, 2)}`;
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

export async function executeTrade(input: TradeInput): Promise<TradeResult> {
  const validationError = validateTrade(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const fee = percentOf(input.amountUsd, TRADE.FEE_PERCENTAGE);
  const effectivePrice = input.type === 'limit' && input.limitPrice
    ? input.limitPrice
    : input.currentPrice;
  const quantity = divide(input.amountUsd, effectivePrice);
  const totalAmount = input.side === 'buy'
    ? toFixed(input.amountUsd + fee, 8)
    : toFixed(input.amountUsd - fee, 8);

  const timestamp = new Date().toISOString();
  const orderId = await secureRandomId('order');
  const txnId = await secureRandomId('txn');

  // Simulate slippage for market orders (0.01% - 0.05%) using crypto-secure random
  let executedPrice = effectivePrice;
  if (input.type === 'market') {
    const slippagePct = await secureRandom(0.0001, 0.0005);
    const slippage = multiply(effectivePrice, slippagePct);
    executedPrice = input.side === 'buy'
      ? toFixed(effectivePrice + slippage, 8)
      : toFixed(effectivePrice - slippage, 8);
  }

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
  const fee = percentOf(amountUsd, TRADE.FEE_PERCENTAGE);
  const total = side === 'buy' ? toFixed(amountUsd + fee, 8) : toFixed(amountUsd - fee, 8);
  const quantity = divide(amountUsd, currentPrice);

  return { fee, total, quantity };
}
