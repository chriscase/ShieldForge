import type { RealmIdentity, RealmBootstrapDeps, RealmBootstrapResult } from './types.js';
import { RealmEmailUnverifiedError } from './types.js';

/**
 * Turn a VERIFIED realm identity into a local-user outcome the host can mint its
 * own native session from. The realm layer NEVER mints a native session.
 *
 * Anti-takeover branch (3a/3b/3c):
 *  - gate: email_verified must be true, else refuse (no link, no create).
 *  - 3a: existing local account that is itself verified (or already realm-linked)
 *        → link, return its id.
 *  - 3b: existing local account that is UNVERIFIED → do NOT auto-merge; the host
 *        must confirm ownership by email first (status: needsVerification).
 *  - 3c: no local account → create from the verified identity.
 *
 * `firstLink` is surfaced so the host can require a step-up (passkey/2FA) before
 * completing a high-value first link — `email_verified=true` is a TRANSITIVE
 * trust assertion bounded by the roster, not a guarantee the issuer was careful.
 */
export async function bootstrapRealmSession(
  identity: RealmIdentity,
  deps: RealmBootstrapDeps,
): Promise<RealmBootstrapResult> {
  if (identity.emailVerified !== true) {
    throw new RealmEmailUnverifiedError();
  }
  const email = identity.email.toLowerCase();

  const existing = await deps.findUserByEmail(email);
  if (existing) {
    if (existing.emailVerified || existing.realmOriginated) {
      // 3a
      const firstLink = !existing.realmOriginated;
      if (identity.sub && deps.linkRealmSubject) {
        await deps.linkRealmSubject(existing.id, identity.sub);
      }
      return { status: 'ok', userId: existing.id, isNew: false, firstLink };
    }
    // 3b
    return { status: 'needsVerification', email };
  }

  // 3c
  const created = await deps.createUserFromRealm({ email, emailVerified: true, name: identity.name });
  if (identity.sub && deps.linkRealmSubject) {
    await deps.linkRealmSubject(created.id, identity.sub);
  }
  return { status: 'ok', userId: created.id, isNew: true, firstLink: true };
}
