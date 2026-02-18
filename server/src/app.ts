import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config';
import { requestLogger, errorHandler, notFoundHandler } from './middleware';
import { apiRouter } from './api/v1';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1', apiRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
