import { describe, it, expect, beforeAll } from 'vitest';
import { generateRealmKeypair } from './keys.js';
import { createRealmIssuer } from './issuer.js';
import { createRealmVerifier } from './verifier.js';
import { InMemoryReplayStore } from './replay.js';
import { RealmVerifyError } from './types.js';
import { buildAuthorizeUrl, parseAuthorizeRequest, handleAuthorize, handleCallback } from './redirect.js';
import { buildLogoutToken, verifyLogoutToken } from './logout.js';

const REALM = 'xrealm';
const MEMBER_A = 'urn:sfrealm:x:A';
const CALLBACK = 'https://relying.example/auth/realm/callback';
const AUTHORIZE = 'https://issuer.example/realm/authorize';

let A: Awaited<ReturnType<typeof generateRealmKeypair>>;
beforeAll(async () => {
  A = await generateRealmKeypair();
});

const issuerA = () => createRealmIssuer({ realmId: REALM, memberId: MEMBER_A, keys: [{ privateKeyPem: A.privateKeyPem }] });
const verifierForA = () =>
  createRealmVerifier({ realmId: REALM, roster: [{ id: MEMBER_A, publicJwks: [A.publicJwk] }], replayStore: new InMemoryReplayStore() });
const rosterA = () => ({ realmId: REALM, roster: [{ id: MEMBER_A, publicJwks: [A.publicJwk] }], replayStore: new InMemoryReplayStore() });

describe('redirect transport (b)', () => {
  it('full handshake: authorize → callback yields the verified identity', async () => {
    const { url, state, nonce } = buildAuthorizeUrl({ authorizeEndpoint: AUTHORIZE, realmId: REALM, returnTo: CALLBACK });
    const req = parseAuthorizeRequest(new URL(url).searchParams);
    expect(req.returnTo).toBe(CALLBACK);

    const { redirectTo } = await handleAuthorize({
      request: req,
      realmId: REALM,
      issuer: await issuerA(),
      authenticated: { email: 'A@Example.com', emailVerified: true, name: 'Ada' },
      callbackAllowList: ['https://relying.example/auth/realm/'],
    });
    const id = await handleCallback({ query: new URL(redirectTo).searchParams, expectedState: state, expectedNonce: nonce, verifier: verifierForA() });
    expect(id.email).toBe('a@example.com');
    expect(id.emailVerified).toBe(true);
    expect(id.issuer).toBe(MEMBER_A);
  });

  it('rejects a callback whose state does not match (CSRF)', async () => {
    const { url, nonce } = buildAuthorizeUrl({ authorizeEndpoint: AUTHORIZE, realmId: REALM, returnTo: CALLBACK });
    const req = parseAuthorizeRequest(new URL(url).searchParams);
    const { redirectTo } = await handleAuthorize({ request: req, realmId: REALM, issuer: await issuerA(), authenticated: { email: 'a@example.com', emailVerified: true }, callbackAllowList: [CALLBACK] });
    await expect(handleCallback({ query: new URL(redirectTo).searchParams, expectedState: 'WRONG', expectedNonce: nonce, verifier: verifierForA() })).rejects.toThrow(/state/i);
  });

  it('rejects a token whose nonce does not bind to this handshake', async () => {
    const { url, state } = buildAuthorizeUrl({ authorizeEndpoint: AUTHORIZE, realmId: REALM, returnTo: CALLBACK });
    const req = parseAuthorizeRequest(new URL(url).searchParams);
    const { redirectTo } = await handleAuthorize({ request: req, realmId: REALM, issuer: await issuerA(), authenticated: { email: 'a@example.com', emailVerified: true }, callbackAllowList: [CALLBACK] });
    await expect(handleCallback({ query: new URL(redirectTo).searchParams, expectedState: state, expectedNonce: 'WRONG-NONCE', verifier: verifierForA() })).rejects.toThrow(/nonce/i);
  });

  it('rejects a return_to that is not allow-listed (open-redirect guard)', async () => {
    const req = { realmId: REALM, returnTo: 'https://evil.example/steal', state: 's', nonce: 'n' };
    await expect(
      handleAuthorize({ request: req, realmId: REALM, issuer: await issuerA(), authenticated: { email: 'a@example.com', emailVerified: true }, callbackAllowList: ['https://relying.example/'] }),
    ).rejects.toThrow(/allow-list/i);
  });

  it('rejects a realm mismatch at authorize', async () => {
    const req = { realmId: 'other', returnTo: CALLBACK, state: 's', nonce: 'n' };
    await expect(
      handleAuthorize({ request: req, realmId: REALM, issuer: await issuerA(), authenticated: { email: 'a@example.com', emailVerified: true }, callbackAllowList: [CALLBACK] }),
    ).rejects.toThrow(/realm/i);
  });
});

describe('single-logout', () => {
  it('build → verify round trip (by email)', async () => {
    const tok = await buildLogoutToken({ realmId: REALM, memberId: MEMBER_A, privateKeyPem: A.privateKeyPem, email: 'A@Example.com' });
    const out = await verifyLogoutToken(tok, rosterA());
    expect(out.email).toBe('a@example.com');
    expect(out.issuer).toBe(MEMBER_A);
  });

  it('a bootstrap token cannot be used as a logout token (aud separation)', async () => {
    const bootstrap = await (await issuerA()).issueToken({ email: 'a@example.com', emailVerified: true });
    await expect(verifyLogoutToken(bootstrap, rosterA())).rejects.toBeInstanceOf(RealmVerifyError);
  });

  it('rejects a replayed logout token', async () => {
    const tok = await buildLogoutToken({ realmId: REALM, memberId: MEMBER_A, privateKeyPem: A.privateKeyPem, sub: 'sub-1' });
    const cfg = rosterA();
    await expect(verifyLogoutToken(tok, cfg)).resolves.toBeTruthy();
    await expect(verifyLogoutToken(tok, cfg)).rejects.toThrow(/replay/i);
  });
});
