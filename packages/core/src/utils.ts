import { User, AuthUser } from '@shieldforge/types';

/**
 * Sanitize user object by removing sensitive fields
 */
export function sanitizeUser(user: User): AuthUser {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

/**
 * Generate a random reset code
 */
export function generateResetCode(length: number = 6): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
