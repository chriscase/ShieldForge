/**
 * Transport (b): broker-less cross-domain redirect handshake for members on
 * DIFFERENT registrable domains (where a shared cookie is impossible). No third
 * party — a relying member R bounces the browser to an issuer member I; I (only
 * if it ALREADY has a native session) mints a realm token bound to the handshake
 * nonce and redirects back to R's allow-listed callback; R verifies + bootstraps.
 *
 * No member is privileged: I is interchangeable, R can federate against any
 * roster issuer, and there is no canonical/default issuer.
 *
 * Two hard rules enforced here:
 *  - `handleAuthorize` is session-gated BY CONSTRUCTION (you must pass the
 *    authenticated native identity), so it can never force a login or act as an
 *    open identity oracle.
 *  - `return_to` is validated against a PER-MEMBER allow-list, preventing
 *    open-redirect token exfiltration.
 */
import { generateRealmNonce } from './nonce';
import type { RealmIssuer } from './issuer';
import type { RealmVerifier } from './verifier';
import type { RealmIdentity } from './types';
import { RealmVerifyError } from './types';

export interface RealmAuthorizeRequest {
  realmId: string;
  returnTo: string;
  state: string;
  nonce: string;
}

type Query = URLSearchParams | Record<string, string | undefined>;
function q(query: Query, key: string): string | null {
  if (query instanceof URLSearchParams) return query.get(key);
  return query[key] ?? null;
}

/** R: build the URL to send the browser to an issuer's authorize endpoint. */
export function buildAuthorizeUrl(params: {
  authorizeEndpoint: string;
  realmId: string;
  returnTo: string;
}): { url: string; state: string; nonce: string } {
  const state = generateRealmNonce();
  const nonce = generateRealmNonce();
  const u = new URL(params.authorizeEndpoint);
  u.searchParams.set('realm', params.realmId);
  u.searchParams.set('return_to', params.returnTo);
  u.searchParams.set('state', state);
  u.searchParams.set('nonce', nonce);
  // R MUST persist {state, nonce} (e.g. a short-lived signed cookie) and check
  // them in handleCallback.
  return { url: u.toString(), state, nonce };
}

/** I: parse an inbound authorize request's query params. */
export function parseAuthorizeRequest(query: Query): RealmAuthorizeRequest {
  const realmId = q(query, 'realm');
  const returnTo = q(query, 'return_to');
  const state = q(query, 'state');
  const nonce = q(query, 'nonce');
  if (!realmId || !returnTo || !state || !nonce) {
    throw new RealmVerifyError('invalid authorize request');
  }
  return { realmId, returnTo, state, nonce };
}

function isCallbackAllowed(returnTo: string, allowList: string[]): boolean {
  return allowList.some((allowed) => returnTo === allowed || returnTo.startsWith(allowed));
}

/**
 * I (issuer) side. Session-gated by construction. Validates the callback against
 * the per-member allow-list, mints a nonce-bound token, and returns the redirect
 * back to R with `?token=…&state=…`.
 */
export async function handleAuthorize(params: {
  request: RealmAuthorizeRequest;
  realmId: string;
  issuer: RealmIssuer;
  authenticated: { email: string; emailVerified: boolean; sub?: string; name?: string };
  callbackAllowList: string[];
}): Promise<{ redirectTo: string }> {
  if (params.request.realmId !== params.realmId) throw new RealmVerifyError('realm mismatch');
  if (!isCallbackAllowed(params.request.returnTo, params.callbackAllowList)) {
    throw new RealmVerifyError('return_to is not allow-listed');
  }
  const token = await params.issuer.issueToken({
    email: params.authenticated.email,
    emailVerified: params.authenticated.emailVerified,
    sub: params.authenticated.sub,
    name: params.authenticated.name,
    nonce: params.request.nonce,
  });
  const u = new URL(params.request.returnTo);
  u.searchParams.set('token', token);
  u.searchParams.set('state', params.request.state);
  return { redirectTo: u.toString() };
}

/**
 * R (relying) side. `state` must match what R stored (CSRF), the token must
 * verify, and its `nonce` must match what R stored (binds the token to THIS
 * handshake). Returns the verified identity; the host then runs
 * `bootstrapRealmSession` and mints its own native session.
 */
export async function handleCallback(params: {
  query: Query;
  expectedState: string;
  expectedNonce: string;
  verifier: RealmVerifier;
}): Promise<RealmIdentity> {
  const token = q(params.query, 'token');
  const state = q(params.query, 'state');
  if (!token || !state) throw new RealmVerifyError('invalid callback');
  if (state !== params.expectedState) throw new RealmVerifyError('state mismatch (possible CSRF)');
  const identity = await params.verifier.verifyToken(token);
  if (!identity.nonce || identity.nonce !== params.expectedNonce) {
    throw new RealmVerifyError('nonce mismatch (token not bound to this handshake)');
  }
  return identity;
}
