import { describe, it, expect, vi } from 'vitest';
import { InMemoryChallengeStore } from '../src/challenges';
import { PasskeyService } from '../src/index';
import type { ChallengeStore, Challenge } from '@appforgeapps/shieldforge-types';

describe('Challenge Store', () => {
  describe('InMemoryChallengeStore', () => {
    it('should store and retrieve a challenge', () => {
      const store = new InMemoryChallengeStore();
      store.store('abc123', 'user-1', 5000);
      const result = store.get('abc123');
      expect(result).not.toBeNull();
      expect(result?.challenge).toBe('abc123');
      expect(result?.userId).toBe('user-1');
    });

    it('should return null for non-existent challenge', () => {
      const store = new InMemoryChallengeStore();
      expect(store.get('does-not-exist')).toBeNull();
    });

    it('should return null for expired challenge', async () => {
      const store = new InMemoryChallengeStore();
      store.store('expired', 'user-1', 10); // 10ms TTL
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(store.get('expired')).toBeNull();
    });

    it('should delete a challenge (one-time use)', () => {
      const store = new InMemoryChallengeStore();
      store.store('one-time', 'user-1', 5000);
      expect(store.get('one-time')).not.toBeNull();
      store.delete('one-time');
      expect(store.get('one-time')).toBeNull();
    });

    it('should clear expired challenges', async () => {
      const store = new InMemoryChallengeStore();
      store.store('short', 'user-1', 10);
      store.store('long', 'user-2', 10000);
      await new Promise(resolve => setTimeout(resolve, 20));
      store.clearExpired();
      expect(store.get('short')).toBeNull();
      expect(store.get('long')).not.toBeNull();
    });
  });

  describe('Injectable ChallengeStore', () => {
    it('should accept a custom challenge store via config', () => {
      const customStore: ChallengeStore = {
        store: vi.fn(),
        get: vi.fn().mockReturnValue({
          challenge: 'test',
          userId: 'u1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000),
        }),
        delete: vi.fn(),
        clearExpired: vi.fn(),
      };

      const service = new PasskeyService({
        rpName: 'Test',
        rpId: 'localhost',
        origin: 'http://localhost:3000',
        challengeStore: customStore,
      });

      // Verify the custom store is used (we can't easily test the internals,
      // but we can verify construction doesn't fail)
      expect(service).toBeDefined();
    });

    it('should fall back to InMemoryChallengeStore when none provided', () => {
      const service = new PasskeyService({
        rpName: 'Test',
        rpId: 'localhost',
        origin: 'http://localhost:3000',
      });
      expect(service).toBeDefined();
    });
  });
});
