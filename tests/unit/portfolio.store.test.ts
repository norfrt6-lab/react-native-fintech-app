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

import { usePortfolioStore } from '../../src/store/portfolio.store';
import type { Holding, PortfolioHistoryPoint } from '../../src/types';

function makeHoldingInput(overrides: Partial<Holding> = {}) {
  return {
    id: 'btc-1',
    coinId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: 'https://example.com/btc.png',
    quantity: 0.5,
    averageBuyPrice: 40000,
    currentPrice: 50000,
    priceChangePercentage24h: 2.5,
    ...overrides,
  };
}

function resetStore() {
  usePortfolioStore.setState({
    holdings: [],
    summary: null,
    history: [],
    selectedTimeRange: '1M',
    isLoading: false,
    balance: 10000,
    hideBalance: false,
  });
}

describe('PortfolioStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = usePortfolioStore.getState();
      expect(state.holdings).toEqual([]);
      expect(state.summary).toBeNull();
      expect(state.balance).toBe(10000);
      expect(state.hideBalance).toBe(false);
      expect(state.selectedTimeRange).toBe('1M');
    });
  });

  describe('addHolding', () => {
    it('adds a new holding with calculated metrics', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput());

      const holdings = usePortfolioStore.getState().holdings;
      expect(holdings).toHaveLength(1);

      const h = holdings[0];
      expect(h.coinId).toBe('bitcoin');
      expect(h.quantity).toBe(0.5);
      expect(h.value).toBe(25000); // 0.5 * 50000
      expect(h.costBasis).toBe(20000); // 0.5 * 40000
      expect(h.profitLoss).toBe(5000); // 25000 - 20000
      expect(h.profitLossPercentage).toBe(25); // (5000/20000)*100
      expect(h.allocation).toBe(100); // only holding
    });

    it('merges into existing holding with weighted average price', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        quantity: 1,
        averageBuyPrice: 40000,
        currentPrice: 50000,
      }));

      // Add more of same coin at different price
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        quantity: 1,
        averageBuyPrice: 60000,
        currentPrice: 60000,
      }));

      const holdings = usePortfolioStore.getState().holdings;
      expect(holdings).toHaveLength(1);
      expect(holdings[0].quantity).toBe(2);
      // Weighted avg: (1*40000 + 1*60000) / 2 = 50000
      expect(holdings[0].averageBuyPrice).toBe(50000);
    });

    it('calculates allocations across multiple holdings', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        coinId: 'bitcoin',
        quantity: 1,
        currentPrice: 50000,
      }));
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        id: 'eth-1',
        coinId: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        averageBuyPrice: 3000,
        currentPrice: 5000,
      }));

      const holdings = usePortfolioStore.getState().holdings;
      expect(holdings).toHaveLength(2);
      // BTC value: 50000, ETH value: 50000, total: 100000
      expect(holdings[0].allocation).toBe(50);
      expect(holdings[1].allocation).toBe(50);
    });

    it('handles single holding as 100% allocation', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput());

      expect(usePortfolioStore.getState().holdings[0].allocation).toBe(100);
    });
  });

  describe('updateHoldingPrice', () => {
    it('recalculates metrics when price changes', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        quantity: 1,
        averageBuyPrice: 40000,
        currentPrice: 40000,
      }));

      usePortfolioStore.getState().updateHoldingPrice('bitcoin', 60000, 5.0);

      const h = usePortfolioStore.getState().holdings[0];
      expect(h.currentPrice).toBe(60000);
      expect(h.value).toBe(60000);
      expect(h.profitLoss).toBe(20000);
      expect(h.priceChangePercentage24h).toBe(5.0);
    });

    it('does nothing for unknown coinId', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput());
      const before = usePortfolioStore.getState().holdings[0].value;

      usePortfolioStore.getState().updateHoldingPrice('unknown-coin', 99999, 10);

      expect(usePortfolioStore.getState().holdings[0].value).toBe(before);
    });

    it('recalculates allocations after price update', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        coinId: 'bitcoin',
        quantity: 1,
        currentPrice: 50000,
      }));
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        id: 'eth-1',
        coinId: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        quantity: 10,
        currentPrice: 5000,
      }));

      // BTC doubles, allocations shift
      usePortfolioStore.getState().updateHoldingPrice('bitcoin', 100000, 10);

      const holdings = usePortfolioStore.getState().holdings;
      // BTC: 100000, ETH: 50000, total: 150000
      expect(holdings[0].allocation).toBeCloseTo(66.67, 1);
      expect(holdings[1].allocation).toBeCloseTo(33.33, 1);
    });
  });

  describe('removeHolding', () => {
    it('removes a holding by coinId', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput({ coinId: 'bitcoin' }));
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        id: 'eth-1', coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum',
        quantity: 10, currentPrice: 5000,
      }));

      usePortfolioStore.getState().removeHolding('bitcoin');

      const holdings = usePortfolioStore.getState().holdings;
      expect(holdings).toHaveLength(1);
      expect(holdings[0].coinId).toBe('ethereum');
      expect(holdings[0].allocation).toBe(100);
    });

    it('does nothing for unknown coinId', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput());
      usePortfolioStore.getState().removeHolding('nonexistent');
      expect(usePortfolioStore.getState().holdings).toHaveLength(1);
    });
  });

  describe('updatePortfolioSummary', () => {
    it('calculates summary from holdings', () => {
      usePortfolioStore.getState().addHolding(makeHoldingInput({
        quantity: 1,
        averageBuyPrice: 40000,
        currentPrice: 50000,
        priceChangePercentage24h: 5,
      }));

      usePortfolioStore.getState().updatePortfolioSummary();

      const summary = usePortfolioStore.getState().summary!;
      expect(summary.totalValue).toBe(50000);
      expect(summary.totalCostBasis).toBe(40000);
      expect(summary.totalProfitLoss).toBe(10000);
      expect(summary.totalProfitLossPercentage).toBe(25);
      expect(summary.lastUpdated).toBeDefined();
    });

    it('handles empty holdings', () => {
      usePortfolioStore.getState().updatePortfolioSummary();

      const summary = usePortfolioStore.getState().summary!;
      expect(summary.totalValue).toBe(0);
      expect(summary.totalProfitLoss).toBe(0);
      expect(summary.dayChange).toBe(0);
    });
  });

  describe('setBalance', () => {
    it('updates balance', () => {
      usePortfolioStore.getState().setBalance(50000);
      expect(usePortfolioStore.getState().balance).toBe(50000);
    });
  });

  describe('setHideBalance', () => {
    it('toggles hide balance', () => {
      usePortfolioStore.getState().setHideBalance(true);
      expect(usePortfolioStore.getState().hideBalance).toBe(true);

      usePortfolioStore.getState().setHideBalance(false);
      expect(usePortfolioStore.getState().hideBalance).toBe(false);
    });
  });

  describe('setTimeRange', () => {
    it('updates selected time range', () => {
      usePortfolioStore.getState().setTimeRange('1Y');
      expect(usePortfolioStore.getState().selectedTimeRange).toBe('1Y');
    });
  });

  describe('addHistoryPoint', () => {
    it('appends a history point', () => {
      const point: PortfolioHistoryPoint = { timestamp: Date.now(), value: 50000 };
      usePortfolioStore.getState().addHistoryPoint(point);

      expect(usePortfolioStore.getState().history).toHaveLength(1);
      expect(usePortfolioStore.getState().history[0]).toEqual(point);
    });

    it('caps history at 365 entries', () => {
      // Add 370 points
      for (let i = 0; i < 370; i++) {
        usePortfolioStore.getState().addHistoryPoint({ timestamp: i, value: i * 100 });
      }

      const history = usePortfolioStore.getState().history;
      expect(history.length).toBeLessThanOrEqual(365);
      // Should keep the last 365 entries (5-369)
      expect(history[0].timestamp).toBe(5);
      expect(history[history.length - 1].timestamp).toBe(369);
    });
  });
});
