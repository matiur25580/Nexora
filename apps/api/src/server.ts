import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const start = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connection established');
  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    logger.info({ host: env.API_HOST, port: env.API_PORT }, 'Nexora API listening');
  });
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Graceful shutdown started');
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start Nexora API');
  process.exit(1);
});
