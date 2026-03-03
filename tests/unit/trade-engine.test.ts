import { validateTrade, executeTrade, calculateTradePreview, TradeInput } from '../../src/core/trade/trade-engine';

const baseInput: TradeInput = {
  coinId: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/btc.png',
  side: 'buy',
  type: 'market',
  amountUsd: 100,
  currentPrice: 50000,
  availableBalance: 10000,
};

describe('validateTrade', () => {
  it('returns null for valid buy order', () => {
    expect(validateTrade(baseInput)).toBeNull();
  });

  it('returns null for valid sell order', () => {
    expect(validateTrade({ ...baseInput, side: 'sell' })).toBeNull();
  });

  it('rejects amount <= 0', () => {
    expect(validateTrade({ ...baseInput, amountUsd: 0 })).toBe('Amount must be greater than 0');
    expect(validateTrade({ ...baseInput, amountUsd: -10 })).toBe('Amount must be greater than 0');
  });

  it('rejects invalid price', () => {
    expect(validateTrade({ ...baseInput, currentPrice: 0 })).toBe('Invalid price data');
    expect(validateTrade({ ...baseInput, currentPrice: -1 })).toBe('Invalid price data');
  });

  it('rejects insufficient balance for buy', () => {
    const result = validateTrade({
      ...baseInput,
      amountUsd: 10000,
      availableBalance: 100,
    });
    expect(result).toContain('Insufficient balance');
  });

  it('does not check balance for sell orders', () => {
    const result = validateTrade({
      ...baseInput,
      side: 'sell',
      amountUsd: 50000,
      availableBalance: 100,
    });
    expect(result).toBeNull();
  });

  it('requires limit price for limit orders', () => {
    expect(validateTrade({ ...baseInput, type: 'limit' })).toBe('Limit price is required');
    expect(validateTrade({ ...baseInput, type: 'limit', limitPrice: 0 })).toBe('Limit price is required');
    expect(validateTrade({ ...baseInput, type: 'limit', limitPrice: 49000 })).toBeNull();
  });

  it('requires stop price for stop orders', () => {
    expect(validateTrade({ ...baseInput, type: 'stop' })).toBe('Stop price is required');
    expect(validateTrade({ ...baseInput, type: 'stop', stopPrice: 0 })).toBe('Stop price is required');
    expect(validateTrade({ ...baseInput, type: 'stop', stopPrice: 48000 })).toBeNull();
  });

  it('rejects amounts below $1 minimum', () => {
    expect(validateTrade({ ...baseInput, amountUsd: 0.5 })).toBe('Minimum trade amount is $1.00');
  });

  it('rejects amounts above $1M maximum', () => {
    expect(validateTrade({ ...baseInput, amountUsd: 1_000_001, availableBalance: 2_000_000 })).toBe('Maximum trade amount is $1,000,000');
  });

  it('accepts exactly $1 and $1M', () => {
    expect(validateTrade({ ...baseInput, amountUsd: 1 })).toBeNull();
    expect(validateTrade({ ...baseInput, amountUsd: 1_000_000, availableBalance: 2_000_000 })).toBeNull();
  });
});

describe('executeTrade', () => {
  it('returns success for valid trade', async () => {
    const result = await executeTrade(baseInput);
    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
    expect(result.transaction).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('returns error for invalid trade', async () => {
    const result = await executeTrade({ ...baseInput, amountUsd: 0 });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Amount must be greater than 0');
    expect(result.order).toBeUndefined();
  });

  it('calculates correct fee (0.1%)', async () => {
    const result = await executeTrade(baseInput);
    expect(result.order!.fee).toBeCloseTo(0.1, 4); // $100 * 0.001 = $0.10
  });

  it('calculates correct quantity', async () => {
    const result = await executeTrade(baseInput);
    expect(result.order!.quantity).toBeCloseTo(100 / 50000, 8); // 0.002 BTC
  });

  it('sets total amount including fee for buy', async () => {
    const result = await executeTrade(baseInput);
    // Buy: amountUsd + fee = 100 + 0.1 = 100.1
    expect(result.order!.totalAmount).toBeCloseTo(100.1, 2);
  });

  it('sets total amount minus fee for sell', async () => {
    const result = await executeTrade({ ...baseInput, side: 'sell' });
    // Sell: amountUsd - fee = 100 - 0.1 = 99.9
    expect(result.order!.totalAmount).toBeCloseTo(99.9, 2);
  });

  it('uses limit price when available', async () => {
    const result = await executeTrade({
      ...baseInput,
      type: 'limit',
      limitPrice: 45000,
    });
    // Quantity should use limit price: 100 / 45000
    expect(result.order!.quantity).toBeCloseTo(100 / 45000, 8);
  });

  it('applies slippage for market orders', async () => {
    const result = await executeTrade(baseInput);
    // Price should be close but not exactly the current price due to slippage
    expect(result.order!.price).not.toBe(baseInput.currentPrice);
    expect(Math.abs(result.order!.price - baseInput.currentPrice)).toBeLessThan(50); // max ~0.05% slippage
  });

  it('does not apply slippage for limit orders', async () => {
    const result = await executeTrade({
      ...baseInput,
      type: 'limit',
      limitPrice: 45000,
    });
    expect(result.order!.price).toBe(45000);
  });

  it('generates unique order and transaction IDs', async () => {
    const result1 = await executeTrade(baseInput);
    const result2 = await executeTrade(baseInput);
    expect(result1.order!.id).not.toBe(result2.order!.id);
    expect(result1.transaction!.id).not.toBe(result2.transaction!.id);
  });

  it('sets correct order status and timestamps', async () => {
    const result = await executeTrade(baseInput);
    expect(result.order!.status).toBe('filled');
    expect(result.order!.createdAt).toBeDefined();
    expect(result.order!.filledAt).toBeDefined();
    expect(result.order!.createdAt).toBe(result.order!.filledAt);
  });

  it('creates matching transaction', async () => {
    const result = await executeTrade(baseInput);
    expect(result.transaction!.coinId).toBe(baseInput.coinId);
    expect(result.transaction!.symbol).toBe(baseInput.symbol);
    expect(result.transaction!.type).toBe(baseInput.side);
    expect(result.transaction!.status).toBe('filled');
  });
});

describe('calculateTradePreview', () => {
  it('calculates preview for buy', () => {
    const preview = calculateTradePreview(100, 50000, 'buy');
    expect(preview.fee).toBeCloseTo(0.1, 4);
    expect(preview.total).toBeCloseTo(100.1, 2);
    expect(preview.quantity).toBeCloseTo(0.002, 6);
  });

  it('calculates preview for sell', () => {
    const preview = calculateTradePreview(100, 50000, 'sell');
    expect(preview.fee).toBeCloseTo(0.1, 4);
    expect(preview.total).toBeCloseTo(99.9, 2);
    expect(preview.quantity).toBeCloseTo(0.002, 6);
  });

  it('handles zero amount', () => {
    const preview = calculateTradePreview(0, 50000, 'buy');
    expect(preview.fee).toBe(0);
    expect(preview.total).toBe(0);
    expect(preview.quantity).toBe(0);
  });

  it('handles small crypto prices', () => {
    const preview = calculateTradePreview(100, 0.0001, 'buy');
    expect(preview.quantity).toBe(1_000_000);
    expect(preview.fee).toBeCloseTo(0.1, 4);
  });

  it('handles large amounts', () => {
    const preview = calculateTradePreview(1_000_000, 50000, 'buy');
    expect(preview.quantity).toBe(20);
    expect(preview.fee).toBe(1000);
  });
});
