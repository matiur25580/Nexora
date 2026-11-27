import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { logger } from './lib/logger.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: env.WEB_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: Date.now() - startedAt
    }, 'HTTP request completed');
  });
  next();
});

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    data: {
      name: 'Nexora API',
      version: 'v1',
      documentation: 'OpenAPI documentation will be added in the API documentation milestone.'
    }
  });
});
app.use('/api/v1/health', healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);
