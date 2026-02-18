import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    console[logLevel === 'error' ? 'error' : logLevel === 'warn' ? 'warn' : 'log'](
      `[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${duration}ms - ${ip}`
    );
  });

  next();
};

export const createLogger = (prefix: string) => ({
  info: (message: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] [${prefix}] INFO:`, message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[${new Date().toISOString()}] [${prefix}] WARN:`, message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] [${prefix}] ERROR:`, message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [${prefix}] DEBUG:`, message, ...args);
    }
  },
});

export default requestLogger;
