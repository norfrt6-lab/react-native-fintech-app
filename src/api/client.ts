import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { API } from '../lib/constants';
import { logger } from '../lib/logger';

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
    (config: InternalAxiosRequestConfig) => {
      logger.debug(TAG, `${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
      });
      return config;
    },
    (error: AxiosError) => {
      logger.error(TAG, 'Request interceptor error', error);
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
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

      if (error.response) {
        logger.error(TAG, `API Error ${error.response.status}`, {
          url: config.url,
          data: error.response.data,
        });
      } else if (error.request) {
        logger.error(TAG, 'Network error - no response received', {
          url: config.url,
        });
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
