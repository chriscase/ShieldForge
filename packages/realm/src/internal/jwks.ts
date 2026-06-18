import { createLocalJWKSet, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import type { RealmRosterMember } from '../types.js';

/**
 * Build a per-peer key resolver map keyed by member id. Selecting the resolver
 * by the token's claimed `iss` (done by the caller) binds the signature to THAT
 * peer's keys — the peer-trust core. Static pinned JWKs are preferred (no
 * runtime fetch); a `jwksUri` falls back to a cached remote set.
 */
export function buildRosterResolvers(roster: RealmRosterMember[]): Map<string, JWTVerifyGetKey> {
  const resolvers = new Map<string, JWTVerifyGetKey>();
  for (const m of roster) {
    if (m.publicJwks && m.publicJwks.length) {
      resolvers.set(
        m.id,
        createLocalJWKSet({ keys: m.publicJwks as Parameters<typeof createLocalJWKSet>[0]['keys'] }),
      );
    } else if (m.jwksUri) {
      resolvers.set(m.id, createRemoteJWKSet(new URL(m.jwksUri)));
    } else {
      throw new Error(`realm roster member ${m.id} needs publicJwks or jwksUri`);
    }
  }
  return resolvers;
}
