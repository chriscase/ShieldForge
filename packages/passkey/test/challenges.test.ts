import { describe, it, expect, beforeEach } from 'vitest';
import {
  storeChallenge,
  getChallenge,
  deleteChallenge,
  clearExpiredChallenges,
} from '../src/challenges';

describe('challenges', () => {
  beforeEach(() => {
    // Clear any existing challenges
    clearExpiredChallenges();
  });

  describe('storeChallenge', () => {
    it('should store a challenge', () => {
      const challenge = 'test-challenge-123';
      
      storeChallenge(challenge, '456', 5000);
      
      const stored = getChallenge(challenge);
      expect(stored).toBeDefined();
      expect(stored?.challenge).toBe(challenge);
      expect(stored?.userId).toBe('456');
    });

    it('should store challenge without userId', () => {
      const challenge = 'test-challenge-456';
      
      storeChallenge(challenge, undefined, 5000);
      
      const stored = getChallenge(challenge);
      expect(stored).toBeDefined();
      expect(stored?.challenge).toBe(challenge);
      expect(stored?.userId).toBeUndefined();
    });
  });

  describe('getChallenge', () => {
    it('should retrieve stored challenge', () => {
      const challenge = 'test-challenge-789';
      storeChallenge(challenge, '789', 5000);
      
      const stored = getChallenge(challenge);
      
      expect(stored).toBeDefined();
      expect(stored?.challenge).toBe(challenge);
      expect(stored?.userId).toBe('789');
    });

    it('should return null for non-existent challenge', () => {
      const stored = getChallenge('non-existent');
      
      expect(stored).toBeNull();
    });

    it('should return null for expired challenge', async () => {
      const challenge = 'expired-challenge';
      storeChallenge(challenge, '999', 10); // 10ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const stored = getChallenge(challenge);
      expect(stored).toBeNull();
    });
  });

  describe('deleteChallenge', () => {
    it('should delete a challenge', () => {
      const challenge = 'delete-me';
      storeChallenge(challenge, '111', 5000);
      
      expect(getChallenge(challenge)).toBeDefined();
      
      deleteChallenge(challenge);
      
      expect(getChallenge(challenge)).toBeNull();
    });

    it('should not throw when deleting non-existent challenge', () => {
      expect(() => deleteChallenge('non-existent')).not.toThrow();
    });
  });

  describe('clearExpiredChallenges', () => {
    it('should clear expired challenges', async () => {
      const challenge1 = 'expires-soon';
      const challenge2 = 'expires-later';
      
      storeChallenge(challenge1, '222', 10); // 10ms TTL
      storeChallenge(challenge2, '333', 10000); // 10s TTL
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      clearExpiredChallenges();
      
      expect(getChallenge(challenge1)).toBeNull();
      expect(getChallenge(challenge2)).toBeDefined();
    });
  });
});
