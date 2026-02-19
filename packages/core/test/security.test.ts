import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateResetCode, generateSecureToken, hashResetCode, verifyResetCode } from '../src/utils';
import { generateToken, verifyToken } from '../src/jwt';
import { ShieldForge } from '../src/index';
import type { JwtPayload } from '@appforgeapps/shieldforge-types';

describe('Security', () => {
  describe('Reset code cryptographic randomness', () => {
    it('should generate codes using crypto, not Math.random()', () => {
      // Generate many codes and verify they have reasonable distribution
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateResetCode(6));
      }
      // With CSPRNG, 100 6-digit codes should almost all be unique
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should only contain digits 0-9', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateResetCode(8);
        expect(code).toMatch(/^\d+$/);
        expect(code.length).toBe(8);
      }
    });

    it('should respect custom length', () => {
      expect(generateResetCode(4).length).toBe(4);
      expect(generateResetCode(10).length).toBe(10);
    });
  });

  describe('Reset code hashing', () => {
    it('should produce a SHA-256 hex hash', () => {
      const hash = hashResetCode('123456');
      // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce consistent hashes', () => {
      const hash1 = hashResetCode('123456');
      const hash2 = hashResetCode('123456');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different codes', () => {
      const hash1 = hashResetCode('123456');
      const hash2 = hashResetCode('654321');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Reset code constant-time verification', () => {
    it('should verify matching code and hash', () => {
      const code = '123456';
      const hash = hashResetCode(code);
      expect(verifyResetCode(code, hash)).toBe(true);
    });

    it('should reject non-matching code', () => {
      const hash = hashResetCode('123456');
      expect(verifyResetCode('654321', hash)).toBe(false);
    });

    it('should reject invalid hash format', () => {
      expect(verifyResetCode('123456', 'not-a-valid-hex-hash')).toBe(false);
    });
  });

  describe('JWT algorithm enforcement', () => {
    const secret = 'test-secret-key-for-jwt-security';
    const payload: JwtPayload = { userId: '123', email: 'test@example.com' };

    it('should sign with HS256 by default', () => {
      const token = generateToken(payload, secret);
      const decoded = jwt.decode(token, { complete: true }) as any;
      expect(decoded.header.alg).toBe('HS256');
    });

    it('should verify tokens signed with HS256', () => {
      const token = generateToken(payload, secret);
      const result = verifyToken(token, secret);
      expect(result.userId).toBe('123');
    });

    it('should reject tokens with "none" algorithm', () => {
      // Create a token with 'none' algorithm (attack vector)
      const noneToken = jwt.sign(payload, '', { algorithm: 'none' as any });
      expect(() => verifyToken(noneToken, secret)).toThrow();
    });

    it('should reject tokens signed with a different algorithm than allowed', () => {
      // Sign with HS384 but verify with HS256-only allow list
      const token = jwt.sign(payload, secret, { algorithm: 'HS384' });
      expect(() => verifyToken(token, secret, { algorithms: ['HS256'] })).toThrow();
    });
  });

  describe('JWT issuer/audience validation', () => {
    const secret = 'test-secret-for-iss-aud';
    const payload: JwtPayload = { userId: '123', email: 'test@example.com' };

    it('should include issuer in token when specified', () => {
      const token = generateToken(payload, secret, '1h', { issuer: 'my-app' });
      const decoded = jwt.decode(token) as any;
      expect(decoded.iss).toBe('my-app');
    });

    it('should include audience in token when specified', () => {
      const token = generateToken(payload, secret, '1h', { audience: 'my-api' });
      const decoded = jwt.decode(token) as any;
      expect(decoded.aud).toBe('my-api');
    });

    it('should verify tokens with matching issuer', () => {
      const token = generateToken(payload, secret, '1h', { issuer: 'my-app' });
      const result = verifyToken(token, secret, { issuer: 'my-app' });
      expect(result.userId).toBe('123');
    });

    it('should reject tokens with wrong issuer', () => {
      const token = generateToken(payload, secret, '1h', { issuer: 'my-app' });
      expect(() => verifyToken(token, secret, { issuer: 'other-app' })).toThrow();
    });

    it('should verify tokens with matching audience', () => {
      const token = generateToken(payload, secret, '1h', { audience: 'my-api' });
      const result = verifyToken(token, secret, { audience: 'my-api' });
      expect(result.userId).toBe('123');
    });

    it('should reject tokens with wrong audience', () => {
      const token = generateToken(payload, secret, '1h', { audience: 'my-api' });
      expect(() => verifyToken(token, secret, { audience: 'other-api' })).toThrow();
    });
  });

  describe('ShieldForge class JWT integration', () => {
    it('should enforce issuer/audience when configured', () => {
      const sf = new ShieldForge({
        jwtSecret: 'test-secret',
        jwtIssuer: 'my-service',
        jwtAudience: 'my-app',
      });

      const token = sf.generateToken({ userId: '1', email: 'a@b.com' });
      const decoded = jwt.decode(token) as any;
      expect(decoded.iss).toBe('my-service');
      expect(decoded.aud).toBe('my-app');

      // Verification should succeed
      const result = sf.verifyToken(token);
      expect(result.userId).toBe('1');
    });

    it('should reject forged tokens with different issuer', () => {
      const sf = new ShieldForge({
        jwtSecret: 'test-secret',
        jwtIssuer: 'trusted-service',
      });

      // Forge a token with wrong issuer
      const forgedToken = jwt.sign(
        { userId: '1', email: 'a@b.com', iss: 'evil-service' },
        'test-secret',
        { algorithm: 'HS256' }
      );

      expect(() => sf.verifyToken(forgedToken)).toThrow();
    });
  });

  describe('ShieldForge hashResetCode and verifyResetCode', () => {
    it('should expose hash and verify through the class', () => {
      const sf = new ShieldForge({ jwtSecret: 'test' });
      const code = sf.generateResetCode();
      const hash = sf.hashResetCode(code);
      expect(sf.verifyResetCode(code, hash)).toBe(true);
      expect(sf.verifyResetCode('wrong', hash)).toBe(false);
    });
  });
});
