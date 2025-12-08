import { describe, it, expect, vi } from 'vitest';
import { ShieldForge } from '../src/index';

describe('ShieldForge', () => {
  const config = {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
    saltRounds: 4,
  };

  describe('initialization', () => {
    it('should create instance with config', () => {
      const auth = new ShieldForge(config);
      expect(auth).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const auth = new ShieldForge({ jwtSecret: 'test-secret' });
      expect(auth).toBeDefined();
    });
  });

  describe('password operations', () => {
    const auth = new ShieldForge(config);

    it('should hash and verify password', async () => {
      const password = 'testPassword123';
      const hash = await auth.hashPassword(password);
      
      const isValid = await auth.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should calculate password strength', () => {
      const result = auth.calculatePasswordStrength('MyP@ssw0rd123!');
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
      expect(result.feedback).toBeDefined();
    });
  });

  describe('JWT operations', () => {
    const auth = new ShieldForge(config);

    it('should generate and verify token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = auth.generateToken(payload);
      
      const decoded = auth.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should decode token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = auth.generateToken(payload);
      
      const decoded = auth.decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
    });
  });

  describe('utility operations', () => {
    const auth = new ShieldForge(config);

    it('should sanitize user', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'secret',
      };
      
      const sanitized = auth.sanitizeUser(user);
      expect('passwordHash' in sanitized).toBe(false);
      expect(sanitized.email).toBe(user.email);
    });

    it('should generate reset code', () => {
      const code = auth.generateResetCode();
      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('should generate secure token', () => {
      const token = auth.generateSecureToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(32);
    });
  });

  describe('email operations', () => {
    it('should throw error when sending email without SMTP config', async () => {
      const auth = new ShieldForge({ jwtSecret: 'test' });
      
      await expect(
        auth.sendPasswordResetEmail('test@example.com', '123456')
      ).rejects.toThrow('SMTP configuration is required');
    });

    it('should throw error when sending generic email without SMTP config', async () => {
      const auth = new ShieldForge({ jwtSecret: 'test' });
      
      await expect(
        auth.sendEmail('test@example.com', 'Subject', 'Body')
      ).rejects.toThrow('SMTP configuration is required');
    });
  });
});
