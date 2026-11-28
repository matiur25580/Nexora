import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env.js';

const secret = new TextEncoder().encode(env.ACCESS_TOKEN_SECRET);

export const createAccessToken = async (userId: string): Promise<string> =>
  new SignJWT({ sub: userId, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .setIssuer('nexora-api')
    .setAudience('nexora-web')
    .sign(secret);

export const verifyAccessToken = async (token: string): Promise<string> => {
  const { payload } = await jwtVerify(token, secret, { issuer: 'nexora-api', audience: 'nexora-web' });
  if (payload.typ !== 'access' || typeof payload.sub !== 'string') throw new Error('Invalid access token');
  return payload.sub;
};

export const createRefreshToken = (): string => randomBytes(48).toString('base64url');
export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
