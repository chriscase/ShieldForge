# @appforgeapps/shieldforge-realm

Opt-in **cross-site SSO "realm"** (trust group) for ShieldForge.

A *realm* lets a **defined collection of sites share login**. It is:

- **Opt-in by config** — a site that installs this package but sets no realm config is **unchanged**. There is no behavior change for non-realm sites.
- **Peer-trust, no master / no hub** — each member holds its **own RS256 key(s)** and any member can both **issue** and **verify**. The token's `aud` is the *realm* (`urn:sfrealm:<realmId>`), never a member, so no member is privileged.
- **A bootstrap, not a session** — the realm token is a short-lived (≈120s), single-use RS256 JWS. Each member **mints its own native session** after verifying it (`verify → upsert-by-verified-email → your own createSession`). Per-site passkeys / 2FA stay intact because they gate the *native* session.

This package is **self-contained**: it imports nothing from a host's auth and depends on no other `@appforgeapps/shieldforge-*` package, so it drops onto any consumer version. Its only runtime dep is [`jose`](https://github.com/panva/jose).

## Contract

```ts
import {
  generateRealmKeypair, createRealmIssuer, createRealmVerifier,
  bootstrapRealmSession, InMemoryReplayStore,
} from '@appforgeapps/shieldforge-realm';

// once, per signing member — store privateKeyPem as a secret, share publicJwk:
const { privateKeyPem, publicJwk } = await generateRealmKeypair();

// ISSUER (a member that just authenticated a user natively):
const issuer = await createRealmIssuer({
  realmId: 'mystrangemind',
  memberId: 'urn:sfrealm:mystrangemind:www',
  keys: [{ privateKeyPem }],
});
const token = await issuer.issueToken({ email: user.email, emailVerified: true });

// VERIFIER (any peer):
const verifier = createRealmVerifier({
  realmId: 'mystrangemind',
  roster: [{ id: 'urn:sfrealm:mystrangemind:www', publicJwks: [publicJwk] }], // static pin (no fetch)
  replayStore: new InMemoryReplayStore(), // production: inject Redis / Vercel KV
});
const identity = await verifier.verifyToken(token);

// BOOTSTRAP → the host mints ITS OWN native session from the result:
const result = await bootstrapRealmSession(identity, {
  findUserByEmail: (email) => db.findUser(email),       // {id, emailVerified, realmOriginated?} | null
  createUserFromRealm: ({ email, name }) => db.create({ email, emailVerified: true, name }),
});
if (result.status === 'needsVerification') {/* route to confirm-by-email */}
else { /* createSession({ userId: result.userId }); step up if result.firstLink */ }
```

## Transports

- **(a) same registrable domain** — `@appforgeapps/shieldforge-realm/cookie` provides a shared parent-domain cookie (`sfr_<realmId>`, `Domain=.<base>`). Login on one member silently bootstraps the other. **Login-CSRF:** confirm the bootstrap via a same-site POST / interstitial (not a bare GET) and bind it to a per-issue nonce.
- **(b) cross-domain** — a broker-less redirect handshake (session-gated authorize + per-member callback allow-list). *Filed as a follow-up; not required for same-domain realms.*

## Security

RS256-only verify (rejects `none`/`HS*`); per-member keys (one issuer compromise is contained by dropping its key from peers' rosters — no realm-wide rotation); `email_verified`-gated linking with a 3a/3b/3c anti-takeover branch; **required** single-use `jti` replay store; short token TTL. The in-memory replay store is per-instance — production MUST inject a shared store.

> Status: **0.x, Phase 0.** Built and tested; **not yet published** and **not yet wired into any consumer.** Nothing ships to a site until the live two-member exchange is verified end-to-end.
