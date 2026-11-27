import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const developmentSecret = 'local-development-only-change-this-secret';
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/nexora'),
  ACCESS_TOKEN_SECRET: z.string().min(32).default(developmentSecret),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  COOKIE_SECURE: z.string().default('false').transform((value) => value === 'true'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')
}).refine((value) => value.NODE_ENV !== 'production' || value.ACCESS_TOKEN_SECRET !== developmentSecret, {
  message: 'ACCESS_TOKEN_SECRET must be set to a unique production secret',
  path: ['ACCESS_TOKEN_SECRET']
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}
export const env = parsed.data;
