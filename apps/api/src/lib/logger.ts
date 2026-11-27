import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'password', 'refreshToken', 'token'],
    censor: '[REDACTED]'
  },
  base: { service: 'nexora-api', environment: env.NODE_ENV }
});
