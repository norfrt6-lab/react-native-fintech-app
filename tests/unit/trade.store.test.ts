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

  describe('clearError', () => {
    it('clears the error state', () => {
      useTradeStore.setState({ error: 'Something went wrong' });
      useTradeStore.getState().clearError();
      expect(useTradeStore.getState().error).toBeNull();
    });
  });
});
