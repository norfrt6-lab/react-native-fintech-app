export const APP_NAME = 'FinTrack';
export const APP_VERSION = '1.0.0';

export const API = {
  COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const MARKET = {
  DEFAULT_CURRENCY: 'usd',
  DEFAULT_PER_PAGE: 50,
  MAX_SPARKLINE_POINTS: 168, // 7 days hourly
  PRICE_UPDATE_INTERVAL: 30000, // 30 seconds
  MARKET_DATA_STALE_TIME: 60000, // 1 minute
} as const;

export const AUTH = {
  AUTO_LOCK_OPTIONS: [1, 5, 15, 30, 60], // minutes
  DEFAULT_AUTO_LOCK: 5,
  PIN_LENGTH: 6,
  MAX_PIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300000, // 5 minutes
} as const;

export const TRADE = {
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MAX_SLIPPAGE: 5,
  FEE_PERCENTAGE: 0.1, // 0.1%
} as const;

export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
{ code: 'btc', symbol: '₿', name: 'Bitcoin' },
  { code: 'eth', symbol: 'Ξ', name: 'Ethereum' },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
{ code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
] as const;
