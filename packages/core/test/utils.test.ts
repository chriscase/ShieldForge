import { describe, it, expect } from 'vitest';
import { sanitizeUser, generateResetCode, generateSecureToken } from '../src/utils';
import type { User } from '@shieldforge/types';

describe('utils', () => {
  describe('sanitizeUser', () => {
    it('should remove passwordHash from user object', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        passwordHash: 'hashed-password',
      };
      
      const sanitized = sanitizeUser(user);
      
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.username).toBe(user.username);
      expect(sanitized.name).toBe(user.name);
      expect('passwordHash' in sanitized).toBe(false);
    });

    it('should preserve all non-sensitive fields', () => {
      const user: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        passwordHash: 'hashed-password',
        accountStatus: 'ACTIVE' as any,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const sanitized = sanitizeUser(user);
      
      expect(sanitized.accountStatus).toBe(user.accountStatus);
      expect(sanitized.emailVerified).toBe(user.emailVerified);
      expect(sanitized.createdAt).toBe(user.createdAt);
      expect(sanitized.updatedAt).toBe(user.updatedAt);
    });
  });

  describe('generateResetCode', () => {
    it('should generate a code of specified length', () => {
      const code = generateResetCode(6);
      
      expect(code).toBeDefined();
      expect(code.length).toBe(6);
    });

    it('should generate numeric code', () => {
      const code = generateResetCode(8);
      
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('should generate different codes', () => {
      const code1 = generateResetCode(6);
      const code2 = generateResetCode(6);
      
      expect(code1).not.toBe(code2);
    });

    it('should use default length of 6', () => {
      const code = generateResetCode();
      
      expect(code.length).toBe(6);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a token of specified length', () => {
      const token = generateSecureToken(32);
      
      expect(token).toBeDefined();
      expect(token.length).toBe(32);
    });

    it('should generate alphanumeric token', () => {
      const token = generateSecureToken(32);
      
      expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
    });

    it('should generate different tokens', () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);
      
      expect(token1).not.toBe(token2);
    });

    it('should use default length of 32', () => {
      const token = generateSecureToken();
      
      expect(token.length).toBe(32);
    });
  });
});
