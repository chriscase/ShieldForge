import { SignJWT, importPKCS8, exportJWK, calculateJwkThumbprint } from 'jose';
import { randomUUID } from 'node:crypto';
import type { RealmIssuerConfig, IssueTokenInput, RealmPublicJwk } from './types.js';

const DEFAULT_TTL_SEC = 120;
const MAX_TTL_SEC = 300;

export interface RealmIssuer {
  /** Mint a short-lived, single-use realm bootstrap token (RS256 JWS). */
  issueToken(input: IssueTokenInput): Promise<string>;
  /** This member's public JWKS, for peers to pin or fetch. */
  jwks(): { keys: RealmPublicJwk[] };
}

/**
 * Build an issuer for ONE member. The member signs with its OWN private key(s);
 * the token's `iss` is this member's id and its `aud` is the realm (never a
 * peer), so any peer can verify without any member being a master.
 */
export async function createRealmIssuer(config: RealmIssuerConfig): Promise<RealmIssuer> {
  if (!config.keys.length) throw new Error('realm issuer needs at least one signing key');
  const ttl = Math.min(config.tokenTtlSec ?? DEFAULT_TTL_SEC, MAX_TTL_SEC);
  const aud = `urn:sfrealm:${config.realmId}`;

  const prepared = await Promise.all(
    config.keys.map(async (k) => {
      const key = await importPKCS8(k.privateKeyPem, 'RS256');
      const full = (await exportJWK(key)) as RealmPublicJwk;
      // Public params only (drop d/p/q/…); kid is the canonical RFC-7638 thumbprint.
      const pub: RealmPublicJwk = { kty: full.kty, n: full.n, e: full.e, alg: 'RS256', use: 'sig' };
      const kid = await calculateJwkThumbprint(pub as Parameters<typeof calculateJwkThumbprint>[0], 'sha256');
      pub.kid = kid;
      return { key, kid, pub };
    }),
  );
  const signer = prepared[prepared.length - 1]; // newest key signs

  return {
    async issueToken(input: IssueTokenInput): Promise<string> {
      if (!input.email) throw new Error('issueToken requires an email');
      const now = Math.floor(Date.now() / 1000);
      const claims: Record<string, unknown> = {
        realm: config.realmId,
        email: input.email.toLowerCase(),
        email_verified: input.emailVerified === true,
      };
      if (input.sub) claims.sub = input.sub;
      if (input.name) claims.name = input.name;
      if (input.amr) claims.amr = input.amr;
      if (typeof input.authTime === 'number') claims.auth_time = input.authTime;
      if (input.nonce) claims.nonce = input.nonce; // redirect-transport handshake binding

      return new SignJWT(claims)
        .setProtectedHeader({ alg: 'RS256', kid: signer.kid })
        .setIssuer(config.memberId)
        .setAudience(aud)
        .setIssuedAt(now)
        .setExpirationTime(now + ttl)
        .setJti(randomUUID())
        .sign(signer.key);
    },
    jwks() {
      return { keys: prepared.map((p) => p.pub) };
    },
  };
}
