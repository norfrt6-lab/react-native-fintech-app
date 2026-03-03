jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/lib/config', () => ({
  isProd: jest.fn().mockReturnValue(false),
}));

import { attachSSLValidation } from '../../src/lib/ssl-pinning';
import { isProd } from '../../src/lib/config';

describe('SSL Pinning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a no-op in development mode', () => {
    (isProd as jest.Mock).mockReturnValue(false);
    const interceptors: Array<(r: unknown) => unknown> = [];
    const mockClient = {
      interceptors: {
        response: {
          use: jest.fn((fn: (r: unknown) => unknown) => interceptors.push(fn)),
        },
      },
    };

    attachSSLValidation(mockClient as never);
    expect(mockClient.interceptors.response.use).not.toHaveBeenCalled();
  });

  it('attaches interceptor in production mode', () => {
    (isProd as jest.Mock).mockReturnValue(true);
    const mockClient = {
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };

    attachSSLValidation(mockClient as never);
    expect(mockClient.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('passes responses from expected hosts', () => {
    (isProd as jest.Mock).mockReturnValue(true);
    let interceptorFn: (r: unknown) => unknown;
    const mockClient = {
      interceptors: {
        response: {
          use: jest.fn((fn: (r: unknown) => unknown) => {
            interceptorFn = fn;
          }),
        },
      },
    };

    attachSSLValidation(mockClient as never);

    const response = {
      config: {
        baseURL: 'https://api.coingecko.com/api/v3',
        url: '/coins/markets',
      },
    };

    const result = interceptorFn!(response);
    expect(result).toBe(response);
  });

  it('rejects responses from unexpected hosts', async () => {
    (isProd as jest.Mock).mockReturnValue(true);
    let interceptorFn: (r: unknown) => unknown;
    const mockClient = {
      interceptors: {
        response: {
          use: jest.fn((fn: (r: unknown) => unknown) => {
            interceptorFn = fn;
          }),
        },
      },
    };

    attachSSLValidation(mockClient as never);

    const response = {
      config: {
        baseURL: '',
        url: 'https://evil.com/api/steal',
      },
    };

    await expect(interceptorFn!(response)).rejects.toThrow('SSL validation failed');
  });

  it('handles malformed URLs gracefully', () => {
    (isProd as jest.Mock).mockReturnValue(true);
    let interceptorFn: (r: unknown) => unknown;
    const mockClient = {
      interceptors: {
        response: {
          use: jest.fn((fn: (r: unknown) => unknown) => {
            interceptorFn = fn;
          }),
        },
      },
    };

    attachSSLValidation(mockClient as never);

    const response = {
      config: {
        baseURL: '',
        url: '/relative-only',
      },
    };

    // Should not throw, just warn and pass through
    const result = interceptorFn!(response);
    expect(result).toBe(response);
  });
});
