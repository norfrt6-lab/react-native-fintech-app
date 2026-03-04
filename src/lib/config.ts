import { API } from './constants';

type AppEnv = 'development' | 'preview' | 'production';

interface AppConfig {
  env: AppEnv;
  apiBaseUrl: string;
  apiTimeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  sentryDsn: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
}

function getAppEnv(): AppEnv {
  const envVar = process.env.APP_ENV;
  if (envVar === 'production') return 'production';
  if (envVar === 'preview') return 'preview';
  return 'development';
}

const configs: Record<AppEnv, AppConfig> = {
  development: {
    env: 'development',
    apiBaseUrl: API.COINGECKO_BASE_URL,
    apiTimeout: API.TIMEOUT,
    logLevel: 'debug',
    enableAnalytics: false,
    enableCrashReporting: false,
    sentryDsn: '',
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseProjectId: '',
  },
  preview: {
    env: 'preview',
    apiBaseUrl: API.COINGECKO_BASE_URL,
    apiTimeout: API.TIMEOUT,
    logLevel: 'info',
    enableAnalytics: false,
    enableCrashReporting: true,
    sentryDsn: process.env.SENTRY_DSN ?? '',
    firebaseApiKey: process.env.FIREBASE_API_KEY ?? '',
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
  },
  production: {
    env: 'production',
    apiBaseUrl: API.COINGECKO_BASE_URL,
    apiTimeout: API.TIMEOUT,
    logLevel: 'warn',
    enableAnalytics: true,
    enableCrashReporting: true,
    sentryDsn: process.env.SENTRY_DSN ?? '',
    firebaseApiKey: process.env.FIREBASE_API_KEY ?? '',
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
  },
};

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    const env = __DEV__ ? 'development' : getAppEnv();
    cachedConfig = configs[env];
  }
  return cachedConfig;
}

export function isDev(): boolean {
  return getConfig().env === 'development';
}

export function isProd(): boolean {
  return getConfig().env === 'production';
}
