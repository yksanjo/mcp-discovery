type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): LogLevel {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : 'info';
}

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (data !== undefined) {
    return `${baseMessage} ${JSON.stringify(data)}`;
  }

  return baseMessage;
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.error(formatMessage('debug', message, data));
    }
  },

  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.error(formatMessage('info', message, data));
    }
  },

  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.error(formatMessage('warn', message, data));
    }
  },

  error(message: string, data?: unknown): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, data));
    }
  },
};
