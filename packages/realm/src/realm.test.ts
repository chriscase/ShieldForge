import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, importPKCS8 } from 'jose';
import { generateRealmKeypair } from './keys.js';
import { createRealmIssuer } from './issuer.js';
import { createRealmVerifier } from './verifier.js';
import { bootstrapRealmSession } from './bootstrap.js';
import { InMemoryReplayStore } from './replay.js';
import {
  RealmEmailUnverifiedError,
  RealmVerifyError,
  type RealmBootstrapDeps,
  type RealmIdentity,
} from './types.js';
import {
  realmCookieDomain,
  buildRealmSetCookie,
  buildRealmClearCookie,
  readRealmCookie,
} from './cookie.js';

const REALM = 'msm-test';
const AUD = `urn:sfrealm:${REALM}`;
const MEMBER_A = 'urn:sfrealm:msm:A';
const MEMBER_B = 'urn:sfrealm:msm:B';
const now = () => Math.floor(Date.now() / 1000);

let A: Awaited<ReturnType<typeof generateRealmKeypair>>;
let B: Awaited<ReturnType<typeof generateRealmKeypair>>;

beforeAll(async () => {
  A = await generateRealmKeypair();
  B = await generateRealmKeypair();
});

function verifierForA() {
  return createRealmVerifier({
    realmId: REALM,
    roster: [{ id: MEMBER_A, publicJwks: [A.publicJwk] }],
    replayStore: new InMemoryReplayStore(),
  });
}

describe('round-trip (two members)', () => {
  it('A issues, a peer verifies with A’s pinned public JWK', async () => {
    const issuer = await createRealmIssuer({ realmId: REALM, memberId: MEMBER_A, keys: [{ privateKeyPem: A.privateKeyPem }] });
    const token = await issuer.issueToken({ email: 'Chris@Example.com', emailVerified: true, name: 'Chris' });
    const id = await verifierForA().verifyToken(token);
    expect(id.email).toBe('chris@example.com'); // normalized
    expect(id.emailVerified).toBe(true);
    expect(id.issuer).toBe(MEMBER_A);
    expect(id.realm).toBe(REALM);
    expect(id.name).toBe('Chris');
    expect(id.jti).toBeTruthy();
  });

  it('issuer.jwks() publishes the public key with the matching kid', async () => {
    const issuer = await createRealmIssuer({ realmId: REALM, memberId: MEMBER_A, keys: [{ privateKeyPem: A.privateKeyPem }] });
    const jwks = issuer.jwks();
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0].kid).toBe(A.kid);
    expect(jwks.keys[0]).not.toHaveProperty('d'); // public only
  });
});

describe('security', () => {
  it('rejects algorithm confusion (HS256 token presented to an RS256 verifier)', async () => {
    const hs = await new SignJWT({ realm: REALM, email: 'x@y.com', email_verified: true })
      .setProtectedHeader({ alg: 'HS256', kid: A.kid })
      .setIssuer(MEMBER_A)
      .setAudience(AUD)
      .setIssuedAt(now())
      .setExpirationTime(now() + 120)
      .setJti('hs-jti')
      .sign(new TextEncoder().encode('an-attacker-controlled-symmetric-secret'));
    await expect(verifierForA().verifyToken(hs)).rejects.toBeInstanceOf(RealmVerifyError);
  });

  it('rejects a token that claims iss=A but was signed by another member’s key (kid spoof)', async () => {
    const bKey = await importPKCS8(B.privateKeyPem, 'RS256');
    const forged = await new SignJWT({ realm: REALM, email: 'x@y.com', email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: A.kid }) // claims A's kid…
      .setIssuer(MEMBER_A)
      .setAudience(AUD)
      .setIssuedAt(now())
      .setExpirationTime(now() + 120)
      .setJti('forge-jti')
      .sign(bKey); // …but signed with B's key
    await expect(verifierForA().verifyToken(forged)).rejects.toBeInstanceOf(RealmVerifyError);
  });

  it('rejects a token for a different realm (aud mismatch)', async () => {
    const otherIssuer = await createRealmIssuer({ realmId: 'other-realm', memberId: MEMBER_A, keys: [{ privateKeyPem: A.privateKeyPem }] });
    const token = await otherIssuer.issueToken({ email: 'x@y.com', emailVerified: true });
    await expect(verifierForA().verifyToken(token)).rejects.toBeInstanceOf(RealmVerifyError);
  });

  it('rejects a token from an issuer not in the roster', async () => {
    const issuerC = await createRealmIssuer({ realmId: REALM, memberId: 'urn:sfrealm:msm:C', keys: [{ privateKeyPem: B.privateKeyPem }] });
    const token = await issuerC.issueToken({ email: 'x@y.com', emailVerified: true });
    await expect(verifierForA().verifyToken(token)).rejects.toThrow(/issuer/i);
  });

  it('rejects an expired token', async () => {
    const aKey = await importPKCS8(A.privateKeyPem, 'RS256');
    const expired = await new SignJWT({ realm: REALM, email: 'x@y.com', email_verified: true })
      .setProtectedHeader({ alg: 'RS256', kid: A.kid })
      .setIssuer(MEMBER_A)
      .setAudience(AUD)
      .setIssuedAt(now() - 1000)
      .setExpirationTime(now() - 900)
      .setJti('expired-jti')
      .sign(aKey);
    await expect(verifierForA().verifyToken(expired)).rejects.toBeInstanceOf(RealmVerifyError);
  });

  it('rejects a replayed token (single-use jti)', async () => {
    const issuer = await createRealmIssuer({ realmId: REALM, memberId: MEMBER_A, keys: [{ privateKeyPem: A.privateKeyPem }] });
    const token = await issuer.issueToken({ email: 'x@y.com', emailVerified: true });
    const verifier = verifierForA(); // one verifier == one replay store
    await expect(verifier.verifyToken(token)).resolves.toBeTruthy();
    await expect(verifier.verifyToken(token)).rejects.toThrow(/replay/i);
  });
});

describe('bootstrap (email_verified gate + 3a/3b/3c)', () => {
  const identity = (over: Partial<RealmIdentity> = {}): RealmIdentity => ({
    email: 'user@example.com',
    emailVerified: true,
    issuer: MEMBER_A,
    realm: REALM,
    jti: 'j',
    ...over,
  });
  const deps = (over: Partial<RealmBootstrapDeps> = {}): RealmBootstrapDeps => ({
    findUserByEmail: async () => null,
    createUserFromRealm: async () => ({ id: 99 }),
    ...over,
  });

  it('refuses when email is not verified', async () => {
    await expect(bootstrapRealmSession(identity({ emailVerified: false }), deps())).rejects.toBeInstanceOf(
      RealmEmailUnverifiedError,
    );
  });

  it('3a: links an existing verified account (firstLink=true)', async () => {
    const r = await bootstrapRealmSession(identity(), deps({ findUserByEmail: async () => ({ id: 1, emailVerified: true }) }));
    expect(r).toEqual({ status: 'ok', userId: 1, isNew: false, firstLink: true });
  });

  it('3a: already realm-originated account has firstLink=false', async () => {
    const r = await bootstrapRealmSession(
      identity(),
      deps({ findUserByEmail: async () => ({ id: 2, emailVerified: false, realmOriginated: true }) }),
    );
    expect(r).toEqual({ status: 'ok', userId: 2, isNew: false, firstLink: false });
  });

  it('3b: existing UNVERIFIED account → needsVerification (no auto-merge)', async () => {
    const r = await bootstrapRealmSession(identity(), deps({ findUserByEmail: async () => ({ id: 3, emailVerified: false }) }));
    expect(r).toEqual({ status: 'needsVerification', email: 'user@example.com' });
  });

  it('3c: creates a new user from the verified identity', async () => {
    let created: unknown;
    const r = await bootstrapRealmSession(
      identity({ name: 'New' }),
      deps({ createUserFromRealm: async (input) => { created = input; return { id: 42 }; } }),
    );
    expect(r).toEqual({ status: 'ok', userId: 42, isNew: true, firstLink: true });
    expect(created).toEqual({ email: 'user@example.com', emailVerified: true, name: 'New' });
  });
});

describe('cookie transport (a)', () => {
  it('widens to the dotted parent only for the apex or a subdomain of base', () => {
    expect(realmCookieDomain('www.mystrangemind.com', 'mystrangemind.com')).toBe('.mystrangemind.com');
    expect(realmCookieDomain('wiki.mystrangemind.com', 'mystrangemind.com')).toBe('.mystrangemind.com');
    expect(realmCookieDomain('mystrangemind.com', 'mystrangemind.com')).toBe('.mystrangemind.com');
    expect(realmCookieDomain('www.mystrangemind.com:3040', 'mystrangemind.com')).toBe('.mystrangemind.com');
  });

  it('stays host-only for custom/foreign domains, localhost, *.local and IPs', () => {
    expect(realmCookieDomain('evil.com', 'mystrangemind.com')).toBeUndefined();
    expect(realmCookieDomain('notmystrangemind.com', 'mystrangemind.com')).toBeUndefined();
    expect(realmCookieDomain('localhost', 'mystrangemind.com')).toBeUndefined();
    expect(realmCookieDomain('app.local', 'mystrangemind.com')).toBeUndefined();
    expect(realmCookieDomain('127.0.0.1', 'mystrangemind.com')).toBeUndefined();
  });

  it('builds and reads a parent-domain cookie, and clears it', () => {
    const setC = buildRealmSetCookie('the-token', { realmId: REALM, host: 'www.mystrangemind.com', base: 'mystrangemind.com' });
    expect(setC).toContain(`sfr_${REALM}=the-token`);
    expect(setC).toContain('Domain=.mystrangemind.com');
    expect(setC).toContain('HttpOnly');
    expect(setC).toContain('SameSite=Lax');
    expect(setC).toContain('Secure');

    expect(readRealmCookie(`a=1; sfr_${REALM}=the-token; b=2`, REALM)).toBe('the-token');
    expect(readRealmCookie('a=1; b=2', REALM)).toBeNull();

    const clear = buildRealmClearCookie({ realmId: REALM, host: 'www.mystrangemind.com', base: 'mystrangemind.com' });
    expect(clear).toContain('Max-Age=0');
  });
});
