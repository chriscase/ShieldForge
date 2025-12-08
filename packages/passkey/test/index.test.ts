import { describe, it, expect } from 'vitest';
import { PasskeyService } from '../src/index';

describe('PasskeyService', () => {
  const config = {
    rpName: 'Test App',
    rpId: 'test.example.com',
    origin: 'https://test.example.com',
    challengeTTL: 5000,
  };

  describe('initialization', () => {
    it('should create instance with config', () => {
      const service = new PasskeyService(config);
      expect(service).toBeDefined();
    });

    it('should use default TTL when not specified', () => {
      const service = new PasskeyService({
        rpName: 'Test App',
        rpId: 'test.example.com',
        origin: 'https://test.example.com',
      });
      expect(service).toBeDefined();
    });
  });

  describe('generateRegistrationOptions', () => {
    it('should generate registration options', async () => {
      const service = new PasskeyService(config);
      const user = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      const options = await service.generateRegistrationOptions(user);
      
      expect(options).toBeDefined();
      expect(options.challenge).toBeDefined();
      expect(options.rp.name).toBe(config.rpName);
      expect(options.rp.id).toBe(config.rpId);
      expect(options.user.id).toBe(user.id);
      expect(options.user.name).toBe(user.email);
      expect(options.user.displayName).toBe(user.name);
    });

    it('should use email as displayName when name not provided', async () => {
      const service = new PasskeyService(config);
      const user = {
        id: '123',
        email: 'test@example.com',
      };
      
      const options = await service.generateRegistrationOptions(user);
      
      expect(options.user.displayName).toBe(user.email);
    });
  });

  describe('generateAuthenticationOptions', () => {
    it('should generate authentication options', async () => {
      const service = new PasskeyService(config);
      
      const options = await service.generateAuthenticationOptions();
      
      expect(options).toBeDefined();
      expect(options.challenge).toBeDefined();
      expect(options.rpId).toBe(config.rpId);
    });

    it('should accept allow credentials', async () => {
      const service = new PasskeyService(config);
      const allowCredentials = [
        { id: 'credential-id-1', transports: ['internal'] as any[] },
      ];
      
      const options = await service.generateAuthenticationOptions(allowCredentials);
      
      expect(options).toBeDefined();
      expect(options.challenge).toBeDefined();
    });
  });

  describe('clearExpiredChallenges', () => {
    it('should clear expired challenges', () => {
      const service = new PasskeyService(config);
      
      expect(() => service.clearExpiredChallenges()).not.toThrow();
    });
  });
});
