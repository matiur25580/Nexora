import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env.js';

export const refreshCookieName = 'nexora_refresh';
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
};

export const setRefreshCookie = (res: Response, token: string): void =>
  res.cookie(refreshCookieName, token, cookieOptions);

export const clearRefreshCookie = (res: Response): void =>
  res.clearCookie(refreshCookieName, { ...cookieOptions, maxAge: undefined });
