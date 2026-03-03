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

import { useTradeStore } from '../../src/store/trade.store';
import type { Transaction } from '../../src/types';

const defaultFormData = {
  coinId: '',
  side: 'buy' as const,
  type: 'market' as const,
  amount: '',
  limitPrice: '',
  stopPrice: '',
};

function resetStore() {
  useTradeStore.setState({
    orders: [],
    transactions: [],
    formData: { ...defaultFormData },
    isSubmitting: false,
    error: null,
  });
}

describe('TradeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useTradeStore.getState();
      expect(state.orders).toEqual([]);
      expect(state.transactions).toEqual([]);
      expect(state.formData).toEqual(defaultFormData);
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setFormData', () => {
    it('partially updates form data', () => {
      useTradeStore.getState().setFormData({ coinId: 'bitcoin', amount: '100' });

      const form = useTradeStore.getState().formData;
      expect(form.coinId).toBe('bitcoin');
      expect(form.amount).toBe('100');
      expect(form.side).toBe('buy'); // unchanged
    });

    it('updates order side', () => {
      useTradeStore.getState().setFormData({ side: 'sell' });
      expect(useTradeStore.getState().formData.side).toBe('sell');
    });

    it('updates order type with limit price', () => {
      useTradeStore.getState().setFormData({
        type: 'limit',
        limitPrice: '45000',
      });

      const form = useTradeStore.getState().formData;
      expect(form.type).toBe('limit');
      expect(form.limitPrice).toBe('45000');
    });
  });

  describe('resetForm', () => {
    it('resets form to defaults and clears error', () => {
      useTradeStore.setState({
        formData: { coinId: 'bitcoin', side: 'sell', type: 'limit', amount: '500', limitPrice: '45000', stopPrice: '' },
        error: 'Some error',
      });

      useTradeStore.getState().resetForm();

      expect(useTradeStore.getState().formData).toEqual(defaultFormData);
      expect(useTradeStore.getState().error).toBeNull();
    });
  });

  describe('executeTrade', () => {
    it('creates a buy order with correct calculations', () => {
      useTradeStore.getState().setFormData({
        coinId: 'bitcoin',
        side: 'buy',
        type: 'market',
        amount: '1000',
      });

      const order = useTradeStore.getState().executeTrade(50000);

      expect(order.coinId).toBe('bitcoin');
      expect(order.side).toBe('buy');
      expect(order.type).toBe('market');
      expect(order.price).toBe(50000);
      expect(order.quantity).toBeCloseTo(0.02, 4); // 1000 / 50000
      expect(order.fee).toBeCloseTo(1, 2); // 0.1% of 1000
      expect(order.totalAmount).toBeCloseTo(1001, 0); // 1000 + 1 fee
      expect(order.status).toBe('filled');
      expect(order.id).toMatch(/^order_/);
    });

    it('creates a sell order with fee subtracted', () => {
      useTradeStore.getState().setFormData({
        coinId: 'bitcoin',
        side: 'sell',
        type: 'market',
        amount: '1000',
      });

      const order = useTradeStore.getState().executeTrade(50000);

      expect(order.side).toBe('sell');
      expect(order.totalAmount).toBeCloseTo(999, 0); // 1000 - 1 fee
    });

    it('adds order to orders list (most recent first)', () => {
      useTradeStore.getState().setFormData({ coinId: 'bitcoin', side: 'buy', amount: '100' });
      useTradeStore.getState().executeTrade(50000);

      useTradeStore.getState().setFormData({ coinId: 'ethereum', side: 'buy', amount: '200' });
      useTradeStore.getState().executeTrade(3000);

      const orders = useTradeStore.getState().orders;
      expect(orders).toHaveLength(2);
      expect(orders[0].coinId).toBe('ethereum'); // most recent first
      expect(orders[1].coinId).toBe('bitcoin');
    });

    it('creates a transaction alongside the order', () => {
      useTradeStore.getState().setFormData({
        coinId: 'bitcoin',
        side: 'buy',
        amount: '500',
      });

      useTradeStore.getState().executeTrade(50000);

      const txns = useTradeStore.getState().transactions;
      expect(txns).toHaveLength(1);
      expect(txns[0].coinId).toBe('bitcoin');
      expect(txns[0].type).toBe('buy');
      expect(txns[0].status).toBe('filled');
    });

    it('includes limit price when order type is limit', () => {
      useTradeStore.getState().setFormData({
        coinId: 'bitcoin',
        side: 'buy',
        type: 'limit',
        amount: '1000',
        limitPrice: '45000',
      });

      const order = useTradeStore.getState().executeTrade(50000);
      expect(order.limitPrice).toBe(45000);
      expect(order.stopPrice).toBeUndefined();
    });

    it('includes stop price when order type is stop', () => {
      useTradeStore.getState().setFormData({
        coinId: 'bitcoin',
        side: 'sell',
        type: 'stop',
        amount: '1000',
        stopPrice: '48000',
      });

      const order = useTradeStore.getState().executeTrade(50000);
      expect(order.stopPrice).toBe(48000);
    });
  });

  describe('addTransaction', () => {
    it('adds a transaction to the front of the list', () => {
      const txn: Transaction = {
        id: 'txn_1',
        type: 'deposit',
        coinId: '',
        symbol: 'USD',
        name: 'US Dollar',
        quantity: 1,
        price: 10000,
        totalAmount: 10000,
        fee: 0,
        status: 'filled',
        createdAt: new Date().toISOString(),
      };

      useTradeStore.getState().addTransaction(txn);

      expect(useTradeStore.getState().transactions).toHaveLength(1);
      expect(useTradeStore.getState().transactions[0].id).toBe('txn_1');
    });
  });

  describe('getTransactionsByCoin', () => {
    it('filters transactions by coinId', () => {
      useTradeStore.getState().setFormData({ coinId: 'bitcoin', side: 'buy', amount: '100' });
      useTradeStore.getState().executeTrade(50000);

      useTradeStore.getState().setFormData({ coinId: 'ethereum', side: 'buy', amount: '100' });
      useTradeStore.getState().executeTrade(3000);

      const btcTxns = useTradeStore.getState().getTransactionsByCoin('bitcoin');
      expect(btcTxns).toHaveLength(1);
      expect(btcTxns[0].coinId).toBe('bitcoin');
    });

    it('returns empty array for unknown coin', () => {
      const txns = useTradeStore.getState().getTransactionsByCoin('unknown');
      expect(txns).toEqual([]);
    });
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      useTradeStore.setState({ error: 'Something went wrong' });
      useTradeStore.getState().clearError();
      expect(useTradeStore.getState().error).toBeNull();
    });
  });
});
