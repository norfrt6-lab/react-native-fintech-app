import { apiClient } from './client';
import { MARKET } from '../lib/constants';
import type { CoinMarketData, CoinDetail, PricePoint, CandlestickData, TimeRange } from '../types';

interface CoinGeckoMarketItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

function mapMarketItem(item: CoinGeckoMarketItem): CoinMarketData {
  return {
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    image: item.image,
    currentPrice: item.current_price,
    marketCap: item.market_cap,
    marketCapRank: item.market_cap_rank,
    totalVolume: item.total_volume,
    high24h: item.high_24h,
    low24h: item.low_24h,
    priceChange24h: item.price_change_24h,
    priceChangePercentage24h: item.price_change_percentage_24h,
    priceChangePercentage7d: item.price_change_percentage_7d_in_currency ?? 0,
    circulatingSupply: item.circulating_supply,
    totalSupply: item.total_supply,
    maxSupply: item.max_supply,
    ath: item.ath,
    athChangePercentage: item.ath_change_percentage,
    athDate: item.ath_date,
    lastUpdated: item.last_updated,
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
    const { data } = await apiClient.get<CoinGeckoMarketItem[]>(
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
    return data.map(mapMarketItem);
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

    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image.large,
      currentPrice: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      marketCapRank: data.market_cap_rank,
      totalVolume: data.market_data.total_volume.usd,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
      priceChange24h: data.market_data.price_change_24h,
      priceChangePercentage24h: data.market_data.price_change_percentage_24h,
      priceChangePercentage7d: data.market_data.price_change_percentage_7d ?? 0,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      maxSupply: data.market_data.max_supply,
      ath: data.market_data.ath.usd,
      athChangePercentage: data.market_data.ath_change_percentage.usd,
      athDate: data.market_data.ath_date.usd,
      lastUpdated: data.last_updated,
      description: data.description.en,
      homepage: data.links?.homepage?.[0] ?? '',
      categories: data.categories ?? [],
      genesisDate: data.genesis_date,
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

    return data.prices.map(([timestamp, price]: [number, number]) => ({
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

    return data.map(
      ([timestamp, open, high, low, close]: [number, number, number, number, number]) => ({
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

    const coinIds = data.coins
      .slice(0, 20)
      .map((c: { id: string }) => c.id)
      .join(',');

    if (!coinIds) return [];

    const { data: marketData } = await apiClient.get<CoinGeckoMarketItem[]>(
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

    return marketData.map(mapMarketItem);
  },

  async getTrendingCoins(): Promise<CoinMarketData[]> {
    const { data } = await apiClient.get('/search/trending');

    const coinIds = data.coins
      .map((item: { item: { id: string } }) => item.item.id)
      .join(',');

    if (!coinIds) return [];

    const { data: marketData } = await apiClient.get<CoinGeckoMarketItem[]>(
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

    return marketData.map(mapMarketItem);
  },
};
