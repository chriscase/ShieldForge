/**
 * Single-logout (opt-in, best-effort, NO central registry). A member that logs a
 * user out mints a signed `logout_token` and fans it out to its realm peers'
 * `/logout` endpoints; each peer verifies it and revokes ITS OWN native sessions
 * (e.g. OMS `destroyAllSessions`, a `tokenVersion` bump, a session-lease delete).
 * There is no shared session store — native sessions already own revocation.
 *
 * The cheap tier (clear the parent-domain `sfr_` cookie so no further silent
 * bootstraps) is `buildRealmClearCookie` in `./cookie`.
 *
 * The logout token uses a DISTINCT audience (`urn:sfrealm:<realmId>:logout`) so a
 * bootstrap token can never be used as a logout token, or vice-versa.
 */
import { SignJWT, importPKCS8, exportJWK, calculateJwkThumbprint, jwtVerify, decodeJwt } from 'jose';
import { randomUUID } from 'node:crypto';
import { buildRosterResolvers } from './internal/jwks';
import type { RealmRosterMember, ReplayStore, RealmPublicJwk } from './types';
import { RealmVerifyError } from './types';

const LOGOUT_TTL_SEC = 60;

export interface RealmLogoutIdentity {
  email?: string;
  sub?: string;
  issuer: string;
  realm: string;
  jti: string;
}

/** Build a signed logout assertion to fan out to realm peers. */
export async function buildLogoutToken(params: {
  realmId: string;
  memberId: string;
  privateKeyPem: string;
  email?: string;
  sub?: string;
  ttlSec?: number;
}): Promise<string> {
  if (!params.email && !params.sub) throw new Error('buildLogoutToken requires an email or sub');
  const key = await importPKCS8(params.privateKeyPem, 'RS256');
  const full = (await exportJWK(key)) as RealmPublicJwk;
  const pub: RealmPublicJwk = { kty: full.kty, n: full.n, e: full.e };
  const kid = await calculateJwkThumbprint(pub as Parameters<typeof calculateJwkThumbprint>[0], 'sha256');
  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = { realm: params.realmId };
  if (params.email) claims.email = params.email.toLowerCase();
  if (params.sub) claims.sub = params.sub;
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(params.memberId)
    .setAudience(`urn:sfrealm:${params.realmId}:logout`)
    .setIssuedAt(now)
    .setExpirationTime(now + (params.ttlSec ?? LOGOUT_TTL_SEC))
    .setJti(randomUUID())
    .sign(key);
}

/** Verify a peer's logout assertion → whose sessions THIS member should revoke. */
export async function verifyLogoutToken(
  token: string,
  config: {
    realmId: string;
    roster: RealmRosterMember[];
    replayStore: ReplayStore;
    clockToleranceSec?: number;
  },
): Promise<RealmLogoutIdentity> {
  const aud = `urn:sfrealm:${config.realmId}:logout`;
  const resolvers = buildRosterResolvers(config.roster);

  let iss: string | undefined;
  try {
    iss = decodeJwt(token).iss;
  } catch {
    throw new RealmVerifyError('malformed logout token');
  }
  if (!iss || !resolvers.has(iss)) throw new RealmVerifyError('unknown or untrusted issuer');

  let payload;
  try {
    ({ payload } = await jwtVerify(token, resolvers.get(iss)!, {
      algorithms: ['RS256'],
      audience: aud,
      issuer: iss,
      clockTolerance: config.clockToleranceSec ?? 5,
      maxTokenAge: 120,
    }));
  } catch (e) {
    throw new RealmVerifyError(`logout verification failed: ${(e as Error).message}`);
  }

  if (payload.realm !== config.realmId) throw new RealmVerifyError('realm mismatch');
  const jti = payload.jti;
  if (!jti) throw new RealmVerifyError('missing jti');
  if (await config.replayStore.seen(jti, typeof payload.exp === 'number' ? payload.exp : 0)) {
    throw new RealmVerifyError('logout token replay detected');
  }

  return {
    email: typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined,
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    issuer: iss,
    realm: config.realmId,
    jti,
  };
}
