import { createHash, timingSafeEqual } from 'crypto';
import { User, AuthUser } from '@appforgeapps/shieldforge-types';

/**
 * Sanitize user object by removing sensitive fields
 */
export function sanitizeUser(user: User): AuthUser {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

/**
 * Generate a cryptographically secure random reset code.
 * Uses crypto.getRandomValues (browser) or Node.js crypto.randomBytes
 * to ensure unpredictable codes.
 */
export function generateResetCode(length: number = 6): string {
  const chars = '0123456789';
  let code = '';
  const randomValues = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Node.js fallback
    const nodeCrypto = require('crypto');
    const buffer = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      randomValues[i] = buffer[i];
    }
  }

  for (let i = 0; i < length; i++) {
    code += chars.charAt(randomValues[i] % chars.length);
  }
  return code;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  
  // Use crypto.getRandomValues for secure randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      token += chars.charAt(randomValues[i] % chars.length);
    }
  } else {
    // Fallback for Node.js environments
    const nodeCrypto = require('crypto');
    const buffer = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      token += chars.charAt(buffer[i] % chars.length);
    }
  }
  
  return token;
}

/**
 * Hash a reset code using SHA-256.
 * Reset codes should be hashed before storage so a database leak
 * does not expose valid reset secrets.
 */
export function hashResetCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * Constant-time comparison of a plaintext reset code against a stored hash.
 * Prevents timing attacks on reset code verification.
 */
export function verifyResetCode(code: string, storedHash: string): boolean {
  const codeHash = hashResetCode(code);
  const a = Buffer.from(codeHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
