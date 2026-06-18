import { jwtVerify, decodeJwt } from 'jose';
import { buildRosterResolvers } from './internal/jwks';
import type { RealmVerifierConfig, RealmIdentity } from './types';
import { RealmVerifyError } from './types';

export interface RealmVerifier {
  /** Verify a realm bootstrap token and return the trusted identity. */
  verifyToken(token: string): Promise<RealmIdentity>;
}

/**
 * Build a verifier for a member. Trust is PER-PEER: the verifier selects a key
 * resolver by the token's claimed `iss`, so a token claiming `iss=A` but signed
 * by B's key fails (A's resolver has none of B's keys). The algorithm allowlist
 * is RS256-only (never `none`/`HS*`), mirroring core's anti-confusion stance.
 */
export function createRealmVerifier(config: RealmVerifierConfig): RealmVerifier {
  if (!config.replayStore) throw new Error('realm verifier requires a replayStore');
  const aud = `urn:sfrealm:${config.realmId}`;
  const clockTolerance = config.clockToleranceSec ?? 5;
  const maxTokenAge = config.maxTokenAgeSec ?? 300;

  const resolvers = buildRosterResolvers(config.roster);

  return {
    async verifyToken(token: string): Promise<RealmIdentity> {
      if (!token || typeof token !== 'string') throw new RealmVerifyError('missing token');

      // Route by the (unverified) issuer claim; trust still comes from the
      // signature verifying against THAT peer's keys below.
      let iss: string | undefined;
      try {
        iss = decodeJwt(token).iss;
      } catch {
        throw new RealmVerifyError('malformed token');
      }
      if (!iss || !resolvers.has(iss)) throw new RealmVerifyError('unknown or untrusted issuer');
      const getKey = resolvers.get(iss)!;

      let payload;
      try {
        ({ payload } = await jwtVerify(token, getKey, {
          algorithms: ['RS256'], // hard allowlist — rejects none / HS*
          audience: aud,
          issuer: iss,
          clockTolerance,
          maxTokenAge,
        }));
      } catch (e) {
        throw new RealmVerifyError(`verification failed: ${(e as Error).message}`);
      }

      if (payload.realm !== config.realmId) throw new RealmVerifyError('realm mismatch');

      const jti = payload.jti;
      if (!jti) throw new RealmVerifyError('missing jti');
      const email = payload.email;
      if (typeof email !== 'string' || !email) throw new RealmVerifyError('missing email');

      // Single-use: reject a jti already accepted within its TTL window.
      const replayed = await config.replayStore.seen(jti, typeof payload.exp === 'number' ? payload.exp : 0);
      if (replayed) throw new RealmVerifyError('token replay detected');

      return {
        email: email.toLowerCase(),
        emailVerified: payload.email_verified === true,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        issuer: iss,
        realm: config.realmId,
        sub: typeof payload.sub === 'string' && payload.sub ? payload.sub : undefined,
        nonce: typeof payload.nonce === 'string' ? payload.nonce : undefined,
        jti,
      };
    },
  };
}
