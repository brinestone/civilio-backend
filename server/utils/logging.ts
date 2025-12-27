import Logger from './logger';

// Request logging middleware
export const requestLogger = (req: any, res: any, next?: () => void) => {
  const start = Date.now();

  // Log when request finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.url} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 500) {
      Logger.error(message);
    } else if (res.statusCode >= 400) {
      Logger.warn(message);
    } else {
      Logger.http(message);
    }
  });

  if (next) next();
};

// Error logging middleware
export const errorLogger = (error: any, req?: any, res?: any, next?: () => void) => {
  Logger.error(`${error.name}: ${error.message}`);
  Logger.error(`Stack: ${error.stack}`);

  if (next) next();
};

// Export logger for direct use
export { Logger };