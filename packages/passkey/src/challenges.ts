import { Challenge } from '@shieldforge/types';

/**
 * In-memory challenge store (use a database in production)
 */
const challengeStore = new Map<string, Challenge>();

/**
 * Store a challenge with TTL
 */
export function storeChallenge(
  challenge: string,
  userId?: string,
  ttl: number = 5 * 60 * 1000
): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);

  challengeStore.set(challenge, {
    challenge,
    userId,
    createdAt: now,
    expiresAt,
  });

  // Auto-cleanup after TTL
  setTimeout(() => {
    challengeStore.delete(challenge);
  }, ttl);
}

/**
 * Get a challenge if it exists and is not expired
 */
export function getChallenge(challenge: string): Challenge | null {
  const stored = challengeStore.get(challenge);
  
  if (!stored) {
    return null;
  }

  if (new Date() > stored.expiresAt) {
    challengeStore.delete(challenge);
    return null;
  }

  return stored;
}

/**
 * Delete a challenge
 */
export function deleteChallenge(challenge: string): void {
  challengeStore.delete(challenge);
}

/**
 * Clear all expired challenges
 */
export function clearExpiredChallenges(): void {
  const now = new Date();
  for (const [key, value] of challengeStore.entries()) {
    if (now > value.expiresAt) {
      challengeStore.delete(key);
    }
  }
}
