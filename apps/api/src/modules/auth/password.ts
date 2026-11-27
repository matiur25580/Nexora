import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

const deriveKey = (password: string, salt: Buffer, keyLength: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey as Buffer);
      }
    );
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH);
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
};

export const verifyPassword = async (password: string, encoded: string): Promise<boolean> => {
  const [algorithm, n, r, p, saltValue, hashValue] = encoded.split('$');
  if (algorithm !== 'scrypt' || !n || !r || !p || !saltValue || !hashValue) return false;

  const cost = Number(n);
  const blockSize = Number(r);
  const parallelization = Number(p);
  if (
    !Number.isSafeInteger(cost) ||
    !Number.isSafeInteger(blockSize) ||
    !Number.isSafeInteger(parallelization) ||
    cost <= 0 ||
    blockSize <= 0 ||
    parallelization <= 0
  ) {
    return false;
  }

  const expected = Buffer.from(hashValue, 'base64url');
  if (expected.length === 0) return false;

  const salt = Buffer.from(saltValue, 'base64url');
  if (salt.length === 0) return false;

  const actual = await deriveKey(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
