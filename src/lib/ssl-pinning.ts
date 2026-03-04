import { AxiosInstance } from 'axios';
import { logger } from './logger';
import { isProd } from './config';

const TAG = 'SSLPinning';

const EXPECTED_API_HOSTS = ['api.coingecko.com'] as const;

/**
 * Attaches a response interceptor that validates response URLs match expected hosts.
 * Defense-in-depth against MITM — only active in production.
 */
export function attachSSLValidation(client: AxiosInstance): void {
  if (!isProd()) return;

  client.interceptors.response.use((response) => {
    const baseURL = response.config.baseURL ?? '';
    const requestUrl = response.config.url ?? '';
    const fullUrl = requestUrl.startsWith('http') ? requestUrl : baseURL + requestUrl;

    try {
      const url = new URL(fullUrl);
      const host = url.hostname;

      if (!EXPECTED_API_HOSTS.some((h) => host.endsWith(h))) {
        logger.error(TAG, `Unexpected response host: ${host}`);
        return Promise.reject(new Error('SSL validation failed: unexpected host'));
      }
    } catch {
      logger.warn(TAG, `Could not parse URL: ${fullUrl}`);
    }

    return response;
  });
}
