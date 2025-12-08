import { describe, it, expect, beforeEach } from 'vitest';
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from '../src/webauthn';

describe('webauthn', () => {
  describe('isWebAuthnSupported', () => {
    it('should check if WebAuthn is supported', () => {
      const result = isWebAuthnSupported();
      
      expect(typeof result).toBe('boolean');
    });

    it('should return false in test environment without WebAuthn', () => {
      const result = isWebAuthnSupported();
      
      // In Node.js test environment, WebAuthn is not available
      expect(result).toBe(false);
    });
  });

  describe('isPlatformAuthenticatorAvailable', () => {
    it('should check platform authenticator availability', async () => {
      const result = await isPlatformAuthenticatorAvailable();
      
      expect(typeof result).toBe('boolean');
    });

    it('should return false in test environment', async () => {
      const result = await isPlatformAuthenticatorAvailable();
      
      // In Node.js test environment, platform authenticator is not available
      expect(result).toBe(false);
    });
  });
});
