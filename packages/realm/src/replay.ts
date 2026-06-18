import type { ReplayStore } from './types.js';

/**
 * Default in-memory ReplayStore. PER-INSTANCE only — fine for a single
 * long-lived server, NOT for serverless / multi-instance (each instance has its
 * own map, so the same jti could replay on a sibling instance within the token
 * TTL). Emits a one-time warning when used under NODE_ENV=production.
 */
export class InMemoryReplayStore implements ReplayStore {
  private seenJti = new Map<string, number>();
  private warned = false;

  async seen(jti: string, expSec: number): Promise<boolean> {
    this.gc();
    if (this.seenJti.has(jti)) return true;
    this.seenJti.set(jti, expSec);
    this.maybeWarn();
    return false;
  }

  private gc(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.seenJti) {
      if (exp && exp < now) this.seenJti.delete(jti);
    }
  }

  private maybeWarn(): void {
    if (this.warned) return;
    const isProd =
      typeof process !== 'undefined' && !!process.env && process.env.NODE_ENV === 'production';
    if (isProd) {
      this.warned = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[shieldforge-realm] InMemoryReplayStore is in use under NODE_ENV=production. ' +
          'jti replay protection is PER-INSTANCE only; inject a shared ReplayStore ' +
          '(Redis / Vercel KV) for serverless or multi-instance deployments.',
      );
    }
  }
}
