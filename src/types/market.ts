export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athChangePercentage: number;
  athDate: string;
  lastUpdated: string;
  sparklineIn7d?: {
    price: number[];
  };
}

export interface CoinDetail extends CoinMarketData {
  description: string;
  homepage: string;
  categories: string[];
  genesisDate: string | null;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TimeRange = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export type MarketSortBy =
  | 'market_cap'
  | 'price'
  | 'price_change_24h'
  | 'volume';

export type SortOrder = 'asc' | 'desc';

export interface MarketFilters {
  sortBy: MarketSortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  watchlistOnly: boolean;
}
