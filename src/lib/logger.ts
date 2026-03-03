type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel = __DEV__ ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, tag: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${tag}] ${message}`;
}

export const logger = {
  debug(tag: string, message: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    console.info(formatMessage('debug', tag, message), data ?? '');
  },

  info(tag: string, message: string, data?: unknown) {
    if (!shouldLog('info')) return;
    console.info(formatMessage('info', tag, message), data ?? '');
  },

  warn(tag: string, message: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', tag, message), data ?? '');
  },

  error(tag: string, message: string, error?: unknown) {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error', tag, message), error ?? '');
  },
};
