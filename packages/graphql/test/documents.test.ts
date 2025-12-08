import { describe, it, expect } from 'vitest';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  UPDATE_PROFILE_MUTATION,
  UPDATE_PASSWORD_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  CHECK_PASSWORD_STRENGTH_QUERY,
  USER_FIELDS_FRAGMENT,
  AUTH_PAYLOAD_FRAGMENT,
} from '../src/documents';

describe('documents', () => {
  describe('queries', () => {
    it('should export ME_QUERY', () => {
      expect(ME_QUERY).toBeDefined();
      expect(ME_QUERY).toContain('query Me');
      expect(ME_QUERY).toContain('me {');
    });

    it('should export CHECK_PASSWORD_STRENGTH_QUERY', () => {
      expect(CHECK_PASSWORD_STRENGTH_QUERY).toBeDefined();
      expect(CHECK_PASSWORD_STRENGTH_QUERY).toContain('query CheckPasswordStrength');
      expect(CHECK_PASSWORD_STRENGTH_QUERY).toContain('checkPasswordStrength');
    });
  });

  describe('mutations', () => {
    it('should export LOGIN_MUTATION', () => {
      expect(LOGIN_MUTATION).toBeDefined();
      expect(LOGIN_MUTATION).toContain('mutation Login');
      expect(LOGIN_MUTATION).toContain('login(input: $input)');
    });

    it('should export REGISTER_MUTATION', () => {
      expect(REGISTER_MUTATION).toBeDefined();
      expect(REGISTER_MUTATION).toContain('mutation Register');
      expect(REGISTER_MUTATION).toContain('register(input: $input)');
    });

    it('should export LOGOUT_MUTATION', () => {
      expect(LOGOUT_MUTATION).toBeDefined();
      expect(LOGOUT_MUTATION).toContain('mutation Logout');
      expect(LOGOUT_MUTATION).toContain('logout');
    });

    it('should export UPDATE_PROFILE_MUTATION', () => {
      expect(UPDATE_PROFILE_MUTATION).toBeDefined();
      expect(UPDATE_PROFILE_MUTATION).toContain('mutation UpdateProfile');
      expect(UPDATE_PROFILE_MUTATION).toContain('updateProfile');
    });

    it('should export UPDATE_PASSWORD_MUTATION', () => {
      expect(UPDATE_PASSWORD_MUTATION).toBeDefined();
      expect(UPDATE_PASSWORD_MUTATION).toContain('mutation UpdatePassword');
      expect(UPDATE_PASSWORD_MUTATION).toContain('updatePassword');
    });

    it('should export REQUEST_PASSWORD_RESET_MUTATION', () => {
      expect(REQUEST_PASSWORD_RESET_MUTATION).toBeDefined();
      expect(REQUEST_PASSWORD_RESET_MUTATION).toContain('mutation RequestPasswordReset');
      expect(REQUEST_PASSWORD_RESET_MUTATION).toContain('requestPasswordReset');
    });

    it('should export RESET_PASSWORD_MUTATION', () => {
      expect(RESET_PASSWORD_MUTATION).toBeDefined();
      expect(RESET_PASSWORD_MUTATION).toContain('mutation ResetPassword');
      expect(RESET_PASSWORD_MUTATION).toContain('resetPassword');
    });
  });

  describe('fragments', () => {
    it('should export USER_FIELDS_FRAGMENT', () => {
      expect(USER_FIELDS_FRAGMENT).toBeDefined();
      expect(USER_FIELDS_FRAGMENT).toContain('fragment UserFields on User');
      expect(USER_FIELDS_FRAGMENT).toContain('id');
      expect(USER_FIELDS_FRAGMENT).toContain('email');
    });

    it('should export AUTH_PAYLOAD_FRAGMENT', () => {
      expect(AUTH_PAYLOAD_FRAGMENT).toBeDefined();
      expect(AUTH_PAYLOAD_FRAGMENT).toContain('fragment AuthPayloadFields on AuthPayload');
      expect(AUTH_PAYLOAD_FRAGMENT).toContain('user {');
      expect(AUTH_PAYLOAD_FRAGMENT).toContain('...UserFields');
      expect(AUTH_PAYLOAD_FRAGMENT).toContain('token');
    });
  });
});
