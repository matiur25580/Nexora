import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';
import { createRefreshToken, hashRefreshToken } from './tokens.js';

describe('authentication cryptography', () => {
  it('hashes passwords and verifies only the correct password', async () => {
    const encoded = await hashPassword('Nexora-Secure-Password-2026!');
    expect(encoded).not.toContain('Nexora-Secure-Password-2026!');
    await expect(verifyPassword('Nexora-Secure-Password-2026!', encoded)).resolves.toBe(true);
    await expect(verifyPassword('incorrect-password', encoded)).resolves.toBe(false);
  });

  it('creates high-entropy refresh tokens and stores only a deterministic digest', () => {
    const first = createRefreshToken();
    const second = createRefreshToken();
    expect(first).not.toBe(second);
    expect(hashRefreshToken(first)).toHaveLength(64);
    expect(hashRefreshToken(first)).toBe(hashRefreshToken(first));
    expect(hashRefreshToken(first)).not.toBe(hashRefreshToken(second));
  });
});
