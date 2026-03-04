import * as Linking from 'expo-linking';
import { logger } from './logger';

const TAG = 'DeepLinking';

export interface DeepLinkRoute {
  screen: string;
  params: Record<string, string>;
}

const ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  screen: string;
  paramNames: string[];
}> = [
  { pattern: /^\/coin\/([a-z0-9-]+)$/, screen: '/coin/[id]', paramNames: ['id'] },
  { pattern: /^\/trade\/([a-z0-9-]+)$/, screen: '/trade/[id]', paramNames: ['id'] },
  { pattern: /^\/markets\/?$/, screen: '/(tabs)/markets', paramNames: [] },
  { pattern: /^\/portfolio\/?$/, screen: '/(tabs)', paramNames: [] },
  { pattern: /^\/settings\/?$/, screen: '/(tabs)/settings', paramNames: [] },
  { pattern: /^\/activity\/?$/, screen: '/(tabs)/activity', paramNames: [] },
];

export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = Linking.parse(url);
    const path = `/${parsed.path ?? ''}`;

    for (const route of ROUTE_PATTERNS) {
      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        logger.info(TAG, `Parsed deep link: ${route.screen}`, params);
        return { screen: route.screen, params };
      }
    }

    logger.warn(TAG, `No matching route for: ${path}`);
    return null;
  } catch (error) {
    logger.error(TAG, 'Failed to parse deep link', error);
    return null;
  }
}

const ALLOWED_SCHEMES = ['fintrack', 'https', 'exp'];
const ALLOWED_HOSTS = ['fintrack.app', 'www.fintrack.app', ''];

/**
 * Validate that a deep link target is safe to navigate to.
 * Prevents open redirect attacks via malicious schemes or hosts.
 */
export function isValidDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const scheme = parsed.scheme ?? '';
    const hostname = parsed.hostname ?? '';

    if (!ALLOWED_SCHEMES.includes(scheme)) {
      logger.warn(TAG, `Blocked deep link with scheme: ${scheme}`);
      return false;
    }

    if (scheme === 'https' && !ALLOWED_HOSTS.includes(hostname)) {
      logger.warn(TAG, `Blocked deep link with host: ${hostname}`);
      return false;
    }

    return true;
  } catch {
    logger.debug(TAG, 'Invalid deep link URL');
    return false;
  }
}
