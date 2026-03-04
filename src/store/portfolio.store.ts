import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import { fetchPortfolio } from '../core/data';
import { logger } from '../lib/logger';
import type {
  Holding,
  PortfolioSummary,
  PortfolioHistoryPoint,
  PortfolioTimeRange,
} from '../types';

interface PortfolioStore {
  holdings: Holding[];
  summary: PortfolioSummary | null;
  history: PortfolioHistoryPoint[];
  selectedTimeRange: PortfolioTimeRange;
  isLoading: boolean;
  balance: number;
  hideBalance: boolean;

  addHolding: (holding: Omit<Holding, 'value' | 'costBasis' | 'profitLoss' | 'profitLossPercentage' | 'allocation'>) => void;
  updateHoldingPrice: (coinId: string, currentPrice: number, priceChange24h: number) => void;
  removeHolding: (coinId: string) => void;
  updatePortfolioSummary: () => void;
  setBalance: (balance: number) => void;
  setHideBalance: (hide: boolean) => void;
  setTimeRange: (range: PortfolioTimeRange) => void;
  addHistoryPoint: (point: PortfolioHistoryPoint) => void;
  loadFromRemote: (uid: string) => Promise<void>;
}

function calculateHoldingMetrics(holding: Holding): Holding {
  const value = holding.quantity * holding.currentPrice;
  const costBasis = holding.quantity * holding.averageBuyPrice;
  const profitLoss = value - costBasis;
  const profitLossPercentage = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
  return { ...holding, value, costBasis, profitLoss, profitLossPercentage };
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    immer((set, _get) => ({
      holdings: [],
      summary: null,
      history: [],
      selectedTimeRange: '1M' as PortfolioTimeRange,
      isLoading: false,
      balance: 10000,
      hideBalance: false,

      addHolding: (holdingData) =>
        set((state) => {
          const existing = state.holdings.find((h) => h.coinId === holdingData.coinId);
          if (existing) {
            const totalQuantity = existing.quantity + holdingData.quantity;
            const totalCost =
              existing.quantity * existing.averageBuyPrice +
              holdingData.quantity * holdingData.currentPrice;
            existing.quantity = totalQuantity;
            existing.averageBuyPrice = totalCost / totalQuantity;
            existing.currentPrice = holdingData.currentPrice;
            const updated = calculateHoldingMetrics(existing);
            Object.assign(existing, updated);
          } else {
            const newHolding = calculateHoldingMetrics({
              ...holdingData,
              value: 0,
              costBasis: 0,
              profitLoss: 0,
              profitLossPercentage: 0,
              allocation: 0,
            });
            state.holdings.push(newHolding);
          }

          // Recalculate allocations
          const totalValue = state.holdings.reduce((sum, h) => sum + h.value, 0);
          state.holdings.forEach((h) => {
            h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
          });
        }),

      updateHoldingPrice: (coinId, currentPrice, priceChange24h) =>
        set((state) => {
          const holding = state.holdings.find((h) => h.coinId === coinId);
          if (holding) {
            holding.currentPrice = currentPrice;
            holding.priceChangePercentage24h = priceChange24h;
            const updated = calculateHoldingMetrics(holding);
            Object.assign(holding, updated);

            const totalValue = state.holdings.reduce((sum, h) => sum + h.value, 0);
            state.holdings.forEach((h) => {
              h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
            });
          }
        }),

      removeHolding: (coinId) =>
        set((state) => {
          const index = state.holdings.findIndex((h) => h.coinId === coinId);
          if (index >= 0) {
            state.holdings.splice(index, 1);

            const totalValue = state.holdings.reduce((sum, h) => sum + h.value, 0);
            state.holdings.forEach((h) => {
              h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
            });
          }
        }),

      updatePortfolioSummary: () =>
        set((state) => {
          const totalValue = state.holdings.reduce((sum, h) => sum + h.value, 0);
          const totalCostBasis = state.holdings.reduce((sum, h) => sum + h.costBasis, 0);
          const totalProfitLoss = totalValue - totalCostBasis;
          const totalProfitLossPercentage =
            totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0;

          const dayChange = state.holdings.reduce((sum, h) => {
            const changeFactor = 1 + h.priceChangePercentage24h / 100;
            if (changeFactor === 0) return sum;
            const prevPrice = h.currentPrice / changeFactor;
            return sum + (h.currentPrice - prevPrice) * h.quantity;
          }, 0);

          const previousTotal = totalValue - dayChange;
          const dayChangePercentage =
            previousTotal > 0 ? (dayChange / previousTotal) * 100 : 0;

          state.summary = {
            totalValue,
            totalCostBasis,
            totalProfitLoss,
            totalProfitLossPercentage,
            dayChange,
            dayChangePercentage,
            holdings: state.holdings,
            lastUpdated: new Date().toISOString(),
          };
        }),

      setBalance: (balance) =>
        set((state) => {
          state.balance = balance;
        }),

      setHideBalance: (hide) =>
        set((state) => {
          state.hideBalance = hide;
        }),

      setTimeRange: (range) =>
        set((state) => {
          state.selectedTimeRange = range;
        }),

      addHistoryPoint: (point) =>
        set((state) => {
          state.history.push(point);
          if (state.history.length > 365) {
            state.history = state.history.slice(-365);
          }
        }),

      loadFromRemote: async (uid) => {
        try {
          const data = await fetchPortfolio(uid);
          if (data && Array.isArray(data.holdings) && data.holdings.length > 0) {
            set((state) => {
              state.holdings = data.holdings as Holding[];
              state.balance = (data.balance as number) ?? state.balance;
              if (Array.isArray(data.history)) {
                state.history = data.history as PortfolioHistoryPoint[];
              }
            });
            logger.info('PortfolioStore', 'Loaded portfolio from remote');
          }
        } catch (error) {
          logger.error('PortfolioStore', 'Failed to load remote portfolio', error);
        }
      },
    })),
    {
      name: 'portfolio-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        holdings: state.holdings,
        history: state.history,
        balance: state.balance,
        hideBalance: state.hideBalance,
      }),
    },
  ),
);
