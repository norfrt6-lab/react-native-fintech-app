import { z } from 'zod';
import { apiClient } from './client';
import { MARKET } from '../lib/constants';
import { logger } from '../lib/logger';
import {
  coinGeckoMarketListSchema,
  coinGeckoDetailSchema,
  priceHistorySchema,
  ohlcDataSchema,
  searchResultSchema,
  trendingResultSchema,
} from './schemas';
import type { CoinMarketData, CoinDetail, PricePoint, CandlestickData, TimeRange } from '../types';

const TAG = 'MarketApi';

type MarketItem = z.infer<typeof coinGeckoMarketListSchema>[number];

function mapMarketItem(item: MarketItem): CoinMarketData {
  return {
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    image: item.image,
    currentPrice: item.current_price ?? 0,
    marketCap: item.market_cap ?? 0,
    marketCapRank: item.market_cap_rank ?? 0,
    totalVolume: item.total_volume ?? 0,
    high24h: item.high_24h ?? 0,
    low24h: item.low_24h ?? 0,
    priceChange24h: item.price_change_24h ?? 0,
    priceChangePercentage24h: item.price_change_percentage_24h ?? 0,
    priceChangePercentage7d: item.price_change_percentage_7d_in_currency ?? 0,
    circulatingSupply: item.circulating_supply ?? 0,
    totalSupply: item.total_supply,
    maxSupply: item.max_supply,
    ath: item.ath ?? 0,
    athChangePercentage: item.ath_change_percentage ?? 0,
    athDate: item.ath_date ?? '',
    lastUpdated: item.last_updated ?? '',
    sparklineIn7d: item.sparkline_in_7d,
  };
}

const TIME_RANGE_DAYS: Record<TimeRange, number | 'max'> = {
  '1H': 1,
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  ALL: 'max',
};

export const marketApi = {
  async getMarketData(
    page = 1,
    perPage = MARKET.DEFAULT_PER_PAGE,
    sparkline = true,
  ): Promise<CoinMarketData[]> {
    const { data } = await apiClient.get(
      '/coins/markets',
      {
        params: {
          vs_currency: MARKET.DEFAULT_CURRENCY,
          order: 'market_cap_desc',
          per_page: perPage,
          page,
          sparkline,
          price_change_percentage: '7d',
        },
      },
    );

    const parsed = coinGeckoMarketListSchema.safeParse(data);
    if (!parsed.success) {
      logger.error(TAG, 'Market data validation failed', parsed.error.flatten());
      return [];
    }

    return parsed.data.map(mapMarketItem);
  },

  async getCoinDetail(coinId: string): Promise<CoinDetail> {
    const { data } = await apiClient.get(`/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      },
    });

    const parsed = coinGeckoDetailSchema.safeParse(data);
    if (!parsed.success) {
      logger.error(TAG, 'Coin detail validation failed', parsed.error.flatten());
      throw new Error(`Invalid coin detail response for ${coinId}`);
    }

    const d = parsed.data;
    return {
      id: d.id,
      symbol: d.symbol,
      name: d.name,
      image: d.image.large,
      currentPrice: d.market_data.current_price.usd,
      marketCap: d.market_data.market_cap.usd,
      marketCapRank: d.market_cap_rank ?? 0,
      totalVolume: d.market_data.total_volume.usd,
      high24h: d.market_data.high_24h.usd,
      low24h: d.market_data.low_24h.usd,
      priceChange24h: d.market_data.price_change_24h ?? 0,
      priceChangePercentage24h: d.market_data.price_change_percentage_24h ?? 0,
      priceChangePercentage7d: d.market_data.price_change_percentage_7d ?? 0,
      circulatingSupply: d.market_data.circulating_supply ?? 0,
      totalSupply: d.market_data.total_supply,
      maxSupply: d.market_data.max_supply,
      ath: d.market_data.ath.usd,
      athChangePercentage: d.market_data.ath_change_percentage.usd,
      athDate: d.market_data.ath_date.usd,
      lastUpdated: d.last_updated ?? '',
      description: d.description.en,
      homepage: d.links?.homepage?.[0] ?? '',
      categories: d.categories ?? [],
      genesisDate: d.genesis_date,
    };
  },

  async getPriceHistory(
    coinId: string,
    timeRange: TimeRange,
  ): Promise<PricePoint[]> {
    const days = TIME_RANGE_DAYS[timeRange];
    const { data } = await apiClient.get(`/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: MARKET.DEFAULT_CURRENCY,
        days,
      },
    });

    const parsed = priceHistorySchema.safeParse(data);
    if (!parsed.success) {
      logger.error(TAG, 'Price history validation failed', parsed.error.flatten());
      return [];
    }

    return parsed.data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
    }));
  },

  async getOHLC(
    coinId: string,
    days: number,
  ): Promise<CandlestickData[]> {
    const { data } = await apiClient.get(`/coins/${coinId}/ohlc`, {
      params: {
        vs_currency: MARKET.DEFAULT_CURRENCY,
        days,
      },
    });

    const parsed = ohlcDataSchema.safeParse(data);
    if (!parsed.success) {
      logger.error(TAG, 'OHLC data validation failed', parsed.error.flatten());
      return [];
    }

    return parsed.data.map(
      ([timestamp, open, high, low, close]) => ({
        timestamp,
        open,
        high,
        low,
        close,
      }),
    );
  },

  async searchCoins(query: string): Promise<CoinMarketData[]> {
    const { data } = await apiClient.get('/search', {
      params: { query },
    });

    const parsed = searchResultSchema.safeParse(data);
    if (!parsed.success) {
      logger.error(TAG, 'Search validation failed', parsed.error.flatten());
      return [];
    }

    const coinIds = parsed.data.coins
      .slice(0, 20)
      .map((c) => c.id)
      .join(',');

    if (!coinIds) return [];

    const { data: marketData } = await apiClient.get(
      '/coins/markets',
      {
        params: {
          vs_currency: MARKET.DEFAULT_CURRENCY,
          ids: coinIds,
          order: 'market_cap_desc',
          sparkline: false,
        },
      },
    );

    const marketParsed = coinGeckoMarketListSchema.safeParse(marketData);
    if (!marketParsed.success) {
      logger.error(TAG, 'Search market data validation failed', marketParsed.error.flatten());
      return [];
    }

    return marketParsed.data.map(mapMarketItem);
  },

  async getTrendingCoins(): Promise<CoinMarketData[]> {
    const { data } = await apiClient.get('/search/trending');

    const parsed = trendingResultSchema.safeParse(data);
    if (!parsed.success) {
      logger.error(TAG, 'Trending validation failed', parsed.error.flatten());
      return [];
    }

    const coinIds = parsed.data.coins
      .map((item) => item.item.id)
      .join(',');

    if (!coinIds) return [];

    const { data: marketData } = await apiClient.get(
      '/coins/markets',
      {
        params: {
          vs_currency: MARKET.DEFAULT_CURRENCY,
          ids: coinIds,
          sparkline: true,
          price_change_percentage: '7d',
        },
      },
    );

    const marketParsed = coinGeckoMarketListSchema.safeParse(marketData);
    if (!marketParsed.success) {
      logger.error(TAG, 'Trending market data validation failed', marketParsed.error.flatten());
      return [];
    }

    return marketParsed.data.map(mapMarketItem);
  },
};
