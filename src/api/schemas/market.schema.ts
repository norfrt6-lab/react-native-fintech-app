import { z } from 'zod';

/**
 * Zod schemas for CoinGecko API response validation.
 * Ensures malformed or unexpected data doesn't corrupt app state.
 */

export const coinGeckoMarketItemSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number().nullable().default(0),
  market_cap: z.number().nullable().default(0),
  market_cap_rank: z.number().nullable().default(0),
  total_volume: z.number().nullable().default(0),
  high_24h: z.number().nullable().default(0),
  low_24h: z.number().nullable().default(0),
  price_change_24h: z.number().nullable().default(0),
  price_change_percentage_24h: z.number().nullable().default(0),
  price_change_percentage_7d_in_currency: z.number().nullable().optional(),
  circulating_supply: z.number().nullable().default(0),
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: z.number().nullable().default(0),
  ath_change_percentage: z.number().nullable().default(0),
  ath_date: z.string().nullable().default(''),
  last_updated: z.string().nullable().default(''),
  sparkline_in_7d: z.object({
    price: z.array(z.number()),
  }).optional(),
});

export const coinGeckoMarketListSchema = z.array(coinGeckoMarketItemSchema);

export const coinGeckoDetailSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.object({
    large: z.string(),
  }),
  market_cap_rank: z.number().nullable().default(0),
  market_data: z.object({
    current_price: z.object({ usd: z.number() }),
    market_cap: z.object({ usd: z.number() }),
    total_volume: z.object({ usd: z.number() }),
    high_24h: z.object({ usd: z.number() }),
    low_24h: z.object({ usd: z.number() }),
    price_change_24h: z.number().nullable().default(0),
    price_change_percentage_24h: z.number().nullable().default(0),
    price_change_percentage_7d: z.number().nullable().default(0),
    circulating_supply: z.number().nullable().default(0),
    total_supply: z.number().nullable(),
    max_supply: z.number().nullable(),
    ath: z.object({ usd: z.number() }),
    ath_change_percentage: z.object({ usd: z.number() }),
    ath_date: z.object({ usd: z.string() }),
  }),
  description: z.object({ en: z.string().default('') }),
  links: z.object({
    homepage: z.array(z.string()).optional(),
  }).optional(),
  categories: z.array(z.string()).nullable().default([]),
  genesis_date: z.string().nullable(),
  last_updated: z.string().nullable().default(''),
});

export const priceHistorySchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

export const ohlcDataSchema = z.array(
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()]),
);

export const searchResultSchema = z.object({
  coins: z.array(z.object({
    id: z.string(),
  })),
});

export const trendingResultSchema = z.object({
  coins: z.array(z.object({
    item: z.object({
      id: z.string(),
    }),
  })),
});
