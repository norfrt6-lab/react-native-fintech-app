import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API } from '../lib/constants';
import { StorageKeys } from '../lib/storage';
import { logger } from '../lib/logger';
import { recordMetric } from '../lib/metrics';
import { getCrashReporter } from '../lib/crash-reporter';
import { apiRateLimiter } from './rate-limiter';
import { attachSSLValidation } from '../lib/ssl-pinning';

const TAG = 'ApiClient';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API.COINGECKO_BASE_URL,
    timeout: API.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      await apiRateLimiter.acquire();

      (config as InternalAxiosRequestConfig & { _requestStartTime?: number })._requestStartTime =
        Date.now();

      logger.debug(TAG, `${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
      });

      try {
        const token = await SecureStore.getItemAsync(StorageKeys.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        logger.debug(TAG, 'Could not read auth token from SecureStore');
      }

      return config;
    },
    (error: AxiosError) => {
      logger.error(TAG, 'Request interceptor error', error);
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      const startTime =
        (response.config as InternalAxiosRequestConfig & { _requestStartTime?: number })
          ._requestStartTime;
      if (startTime) {
        recordMetric('api_request_duration', Date.now() - startTime);
      }
      logger.debug(TAG, `Response ${response.status} ${response.config.url}`);
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config;

      if (!config) {
        return Promise.reject(error);
      }

      const retryCount =
        ((config as InternalAxiosRequestConfig & { _retryCount?: number })
          ._retryCount ?? 0);

      if (error.response?.status === 429 && retryCount < API.RETRY_ATTEMPTS) {
        (config as InternalAxiosRequestConfig & { _retryCount?: number })._retryCount =
          retryCount + 1;

        const delay = API.RETRY_DELAY * Math.pow(2, retryCount);
        logger.warn(TAG, `Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return client(config);
      }

      if (error.response?.status === 401) {
        logger.warn(TAG, 'Unauthorized - token may be expired');
        try {
          await SecureStore.deleteItemAsync(StorageKeys.AUTH_TOKEN);
        } catch (cleanupError) {
          logger.warn(TAG, 'Failed to clear auth token on 401', cleanupError);
        }
      }

      if (error.response) {
        const status = error.response.status;
        const context = { url: config.url, data: error.response.data };

        if (status === 400) {
          logger.warn(TAG, 'Bad request', context);
        } else if (status === 403) {
          logger.error(TAG, 'Forbidden', context);
          getCrashReporter().captureException(
            new Error(`API 403 Forbidden: ${config.url}`),
            context,
          );
        } else if (status === 404) {
          logger.warn(TAG, `Not found: ${config.url}`);
        } else if (status >= 500) {
          logger.error(TAG, `Server error ${status}`, context);
          getCrashReporter().captureException(
            new Error(`API ${status}: ${config.url}`),
            context,
          );
        } else if (status !== 401 && status !== 429) {
          logger.error(TAG, `API Error ${status}`, context);
        }
      } else if (error.request) {
        logger.error(TAG, 'Network error - no response received', {
          url: config.url,
        });
      }

      return Promise.reject(error);
    },
  );

  attachSSLValidation(client);

  return client;
}

export const apiClient = createApiClient();
