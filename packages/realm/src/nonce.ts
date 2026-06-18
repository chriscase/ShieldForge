import { randomBytes } from 'node:crypto';

/**
 * CSPRNG base64url token for realm handshake `state` / `nonce` values (and the
 * login-CSRF nonce on the cookie transport).
 */
export function generateRealmNonce(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}
