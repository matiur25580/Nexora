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
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')
}).superRefine((value, context) => {
  if (value.NODE_ENV === 'production' && value.ACCESS_TOKEN_SECRET === developmentSecret) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ACCESS_TOKEN_SECRET must be set to a unique production secret',
      path: ['ACCESS_TOKEN_SECRET']
    });
  }
  if (value.NODE_ENV === 'production' && !value.COOKIE_SECURE) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'COOKIE_SECURE must be true in production so refresh cookies are sent only over HTTPS',
      path: ['COOKIE_SECURE']
    });
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}
export const env = parsed.data;
