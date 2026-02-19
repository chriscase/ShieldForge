import { Challenge, ChallengeStore } from '@appforgeapps/shieldforge-types';

/**
 * Default in-memory challenge store.
 * Suitable for single-instance deployments. For multi-instance or
 * production use, inject a persistent ChallengeStore (Redis, database, etc.).
 */
export class InMemoryChallengeStore implements ChallengeStore {
  private challenges = new Map<string, Challenge>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  store(challenge: string, userId?: string, ttl: number = 5 * 60 * 1000): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    this.challenges.set(challenge, {
      challenge,
      userId,
      createdAt: now,
      expiresAt,
    });

    // Auto-cleanup after TTL
    const timer = setTimeout(() => {
      this.challenges.delete(challenge);
      this.timers.delete(challenge);
    }, ttl);
    this.timers.set(challenge, timer);
  }

  get(challenge: string): Challenge | null {
    const stored = this.challenges.get(challenge);
    if (!stored) return null;

    if (new Date() > stored.expiresAt) {
      this.delete(challenge);
      return null;
    }

    return stored;
  }

  delete(challenge: string): void {
    this.challenges.delete(challenge);
    const timer = this.timers.get(challenge);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(challenge);
    }
  }

  clearExpired(): void {
    const now = new Date();
    for (const [key, value] of this.challenges.entries()) {
      if (now > value.expiresAt) {
        this.delete(key);
      }
    }
  }
}

// Singleton default store for backward compatibility
const defaultStore = new InMemoryChallengeStore();

/**
 * Store a challenge with TTL
 */
export function storeChallenge(
  challenge: string,
  userId?: string,
  ttl: number = 5 * 60 * 1000
): void {
  defaultStore.store(challenge, userId, ttl);
}

/**
 * Get a challenge if it exists and is not expired
 */
export function getChallenge(challenge: string): Challenge | null {
  return defaultStore.get(challenge);
}

/**
 * Delete a challenge
 */
export function deleteChallenge(challenge: string): void {
  defaultStore.delete(challenge);
}

/**
 * Clear all expired challenges
 */
export function clearExpiredChallenges(): void {
  defaultStore.clearExpired();
}
