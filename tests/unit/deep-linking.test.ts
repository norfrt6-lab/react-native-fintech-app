jest.mock('../../src/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('expo-linking', () => ({
  parse: jest.fn((url: string) => {
    try {
      // Simple URL parser for testing
      if (url.startsWith('fintrack://')) {
        const path = url.replace('fintrack://', '');
        return { scheme: 'fintrack', hostname: '', path };
      }
      if (url.startsWith('https://')) {
        const withoutScheme = url.replace('https://', '');
        const slashIndex = withoutScheme.indexOf('/');
        const hostname = slashIndex >= 0 ? withoutScheme.slice(0, slashIndex) : withoutScheme;
        const path = slashIndex >= 0 ? withoutScheme.slice(slashIndex) : '';
        return { scheme: 'https', hostname, path: path.replace(/^\//, '') };
      }
      if (url.startsWith('javascript:')) {
        return { scheme: 'javascript', hostname: '', path: '' };
      }
      return { scheme: '', hostname: '', path: url };
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }),
}));

import { parseDeepLink, isValidDeepLink } from '../../src/lib/deep-linking';

describe('DeepLinking', () => {
  describe('parseDeepLink', () => {
    it('parses fintrack://coin/bitcoin', () => {
      const result = parseDeepLink('fintrack://coin/bitcoin');
      expect(result).toEqual({
        screen: '/coin/[id]',
        params: { id: 'bitcoin' },
      });
    });

    it('parses fintrack://trade/ethereum', () => {
      const result = parseDeepLink('fintrack://trade/ethereum');
      expect(result).toEqual({
        screen: '/trade/[id]',
        params: { id: 'ethereum' },
      });
    });

    it('parses fintrack://markets', () => {
      const result = parseDeepLink('fintrack://markets');
      expect(result).toEqual({
        screen: '/(tabs)/markets',
        params: {},
      });
    });

    it('parses fintrack://portfolio', () => {
      const result = parseDeepLink('fintrack://portfolio');
      expect(result).toEqual({
        screen: '/(tabs)',
        params: {},
      });
    });

    it('parses fintrack://settings', () => {
      const result = parseDeepLink('fintrack://settings');
      expect(result).toEqual({
        screen: '/(tabs)/settings',
        params: {},
      });
    });

    it('returns null for unknown routes', () => {
      const result = parseDeepLink('fintrack://unknown');
      expect(result).toBeNull();
    });

    it('handles coin IDs with hyphens', () => {
      const result = parseDeepLink('fintrack://coin/shiba-inu');
      expect(result).toEqual({
        screen: '/coin/[id]',
        params: { id: 'shiba-inu' },
      });
    });
  });

  describe('isValidDeepLink', () => {
    it('allows fintrack scheme', () => {
      expect(isValidDeepLink('fintrack://coin/btc')).toBe(true);
    });

    it('allows https with fintrack.app host', () => {
      expect(isValidDeepLink('https://fintrack.app/coin/btc')).toBe(true);
    });

    it('blocks https with unauthorized host', () => {
      expect(isValidDeepLink('https://evil.com/coin/btc')).toBe(false);
    });

    it('blocks javascript scheme', () => {
      expect(isValidDeepLink('javascript://alert(1)')).toBe(false);
    });
  });
});
