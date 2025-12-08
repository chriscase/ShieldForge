import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, decodeToken } from '../src/jwt';
import type { JwtPayload } from '@shieldforge/types';

describe('jwt', () => {
  const secret = 'test-secret-key';
  const payload: JwtPayload = {
    userId: '123',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('should generate a token', () => {
      const token = generateToken(payload, secret);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate tokens with expiration', () => {
      const token = generateToken(payload, secret, '1h');
      
      expect(token).toBeDefined();
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(payload, secret);
      const token2 = generateToken({ ...payload, userId: '456' }, secret);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(payload, secret);
      const decoded = verifyToken(token, secret);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid secret', () => {
      const token = generateToken(payload, secret);
      
      expect(() => verifyToken(token, 'wrong-secret')).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('invalid.token.here', secret)).toThrow();
    });

    it('should include iat and exp in decoded token', () => {
      const token = generateToken(payload, secret, '1h');
      const decoded = verifyToken(token, secret);
      
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateToken(payload, secret);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should decode expired token', () => {
      const token = generateToken(payload, secret, '1ms');
      
      // Wait for token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const decoded = decodeToken(token);
          expect(decoded).toBeDefined();
          expect(decoded?.userId).toBe(payload.userId);
          resolve(undefined);
        }, 10);
      });
    });
  });
});
