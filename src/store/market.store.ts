import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandStorage } from '../lib/storage';
import { marketApi } from '../api/market';
import { logger } from '../lib/logger';
import type {
  CoinMarketData,
  CoinDetail,
  PricePoint,
  TimeRange,
  MarketFilters,
} from '../types';

const TAG = 'MarketStore';

interface MarketStore {
  coins: CoinMarketData[];
  trendingCoins: CoinMarketData[];
  watchlist: string[];
  selectedCoin: CoinDetail | null;
  priceHistory: PricePoint[];
  selectedTimeRange: TimeRange;
  filters: MarketFilters;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  lastFetchedAt: number | null;

  fetchMarketData: (refresh?: boolean) => Promise<void>;
  fetchMoreCoins: () => Promise<void>;
  fetchCoinDetail: (coinId: string) => Promise<void>;
  fetchPriceHistory: (coinId: string, timeRange: TimeRange) => Promise<void>;
  fetchTrendingCoins: () => Promise<void>;
  searchCoins: (query: string) => Promise<CoinMarketData[]>;
  toggleWatchlist: (coinId: string) => void;
  isInWatchlist: (coinId: string) => boolean;
  setFilters: (filters: Partial<MarketFilters>) => void;
  setTimeRange: (range: TimeRange) => void;
  clearError: () => void;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    immer((set, get) => ({
      coins: [],
      trendingCoins: [],
      watchlist: [],
      selectedCoin: null,
      priceHistory: [],
      selectedTimeRange: '1D' as TimeRange,
      filters: {
        sortBy: 'market_cap',
        sortOrder: 'desc',
        searchQuery: '',
        watchlistOnly: false,
      } as MarketFilters,
      isLoading: false,
      isRefreshing: false,
      error: null,
      currentPage: 1,
      hasMore: true,
      lastFetchedAt: null,

      fetchMarketData: async (refresh = false) => {
        try {
          set((state) => {
            if (refresh) {
              state.isRefreshing = true;
              state.currentPage = 1;
            } else {
              state.isLoading = true;
            }
            state.error = null;
          });

          const data = await marketApi.getMarketData(1);

          set((state) => {
            state.coins = data;
            state.currentPage = 1;
            state.hasMore = data.length >= 50;
            state.isLoading = false;
            state.isRefreshing = false;
            state.lastFetchedAt = Date.now();
          });
        } catch (error) {
          logger.error(TAG, 'Failed to fetch market data', error);
          set((state) => {
            state.error = 'Failed to load market data';
            state.isLoading = false;
            state.isRefreshing = false;
          });
        }
      },

      fetchMoreCoins: async () => {
        const { hasMore, isLoading, currentPage } = get();
        if (!hasMore || isLoading) return;

        try {
          set((state) => {
            state.isLoading = true;
          });

          const nextPage = currentPage + 1;
          const data = await marketApi.getMarketData(nextPage);

          set((state) => {
            state.coins = [...state.coins, ...data];
            state.currentPage = nextPage;
            state.hasMore = data.length >= 50;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error(TAG, 'Failed to fetch more coins', error);
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      fetchCoinDetail: async (coinId) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const detail = await marketApi.getCoinDetail(coinId);

          set((state) => {
            state.selectedCoin = detail;
            state.isLoading = false;
          });
        } catch (error) {
          logger.error(TAG, `Failed to fetch detail for ${coinId}`, error);
          set((state) => {
            state.error = 'Failed to load coin details';
            state.isLoading = false;
          });
        }
      },

      fetchPriceHistory: async (coinId, timeRange) => {
        try {
          const data = await marketApi.getPriceHistory(coinId, timeRange);
          set((state) => {
            state.priceHistory = data;
            state.selectedTimeRange = timeRange;
          });
        } catch (error) {
          logger.error(TAG, `Failed to fetch price history for ${coinId}`, error);
        }
      },

      fetchTrendingCoins: async () => {
        try {
          const data = await marketApi.getTrendingCoins();
          set((state) => {
            state.trendingCoins = data;
          });
        } catch (error) {
          logger.error(TAG, 'Failed to fetch trending coins', error);
        }
      },

      searchCoins: async (query) => {
        try {
          return await marketApi.searchCoins(query);
        } catch (error) {
          logger.error(TAG, 'Search failed', error);
          return [];
        }
      },

      toggleWatchlist: (coinId) =>
        set((state) => {
          const index = state.watchlist.indexOf(coinId);
          if (index >= 0) {
            state.watchlist.splice(index, 1);
          } else {
            state.watchlist.push(coinId);
          }
        }),

      isInWatchlist: (coinId) => get().watchlist.includes(coinId),

      setFilters: (filters) =>
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        }),

      setTimeRange: (range) =>
        set((state) => {
          state.selectedTimeRange = range;
        }),

      clearError: () =>
        set((state) => {
          state.error = null;
        }),
    })),
    {
      name: 'market-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        watchlist: state.watchlist,
        filters: state.filters,
      }),
    },
  ),
);
