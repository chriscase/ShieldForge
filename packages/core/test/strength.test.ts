import { describe, it, expect } from 'vitest';
import { calculatePasswordStrength } from '../src/strength';

describe('strength', () => {
  describe('calculatePasswordStrength', () => {
    it('should return weak score for short password', () => {
      const result = calculatePasswordStrength('abc');
      
      expect(result.score).toBeLessThan(2);
      expect(result.feedback).toContain('Password should be at least 8 characters long');
    });

    it('should return weak score for password without variety', () => {
      const result = calculatePasswordStrength('abcdefgh');
      
      expect(result.score).toBeLessThan(3);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should return strong score for complex password', () => {
      const result = calculatePasswordStrength('MyP@ssw0rd123!');
      
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.feedback).toEqual(['Strong password']);
    });

    it('should detect common patterns', () => {
      const result = calculatePasswordStrength('password123');
      
      expect(result.score).toBeLessThan(2);
      expect(result.feedback.some(f => f.includes('common patterns'))).toBe(true);
    });

    it('should require lowercase letters', () => {
      const result = calculatePasswordStrength('PASSWORD123!');
      
      expect(result.feedback).toContain('Password should contain lowercase letters');
    });

    it('should require uppercase letters', () => {
      const result = calculatePasswordStrength('password123!');
      
      expect(result.feedback).toContain('Password should contain uppercase letters');
    });

    it('should require numbers', () => {
      const result = calculatePasswordStrength('Password!');
      
      expect(result.feedback).toContain('Password should contain numbers');
    });

    it('should require special characters', () => {
      const result = calculatePasswordStrength('Password123');
      
      expect(result.feedback).toContain('Password should contain special characters');
    });

    it('should return score between 0 and 4', () => {
      const passwords = ['a', 'abc123', 'Password1', 'P@ssw0rd', 'MyV3ry$ecur3P@ss!'];
      
      passwords.forEach(pwd => {
        const result = calculatePasswordStrength(pwd);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(4);
      });
    });

    it('should give higher score for longer passwords', () => {
      const short = calculatePasswordStrength('P@ss1');
      const medium = calculatePasswordStrength('P@ssw0rd1');
      const long = calculatePasswordStrength('MyV3ry$ecur3P@ssw0rd!');
      
      expect(long.score).toBeGreaterThanOrEqual(medium.score);
      expect(medium.score).toBeGreaterThan(short.score);
    });
  });
});
