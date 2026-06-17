/**
 * @appforgeapps/shieldforge-realm — opt-in cross-site SSO "realm" for ShieldForge.
 *
 * Peer-trust, no central hub: per-member RS256 keys, `aud` = the realm (never a
 * member), short-lived single-use bootstrap tokens, host mints its own native
 * session. A site joins a realm by config; absence of config = unchanged.
 *
 * Transport (a) — same-registrable-domain parent-domain cookie — lives at the
 * `@appforgeapps/shieldforge-realm/cookie` subpath so verifier-only consumers
 * can tree-shake it.
 */
export * from './types';
export { generateRealmKeypair } from './keys';
export { createRealmIssuer, type RealmIssuer } from './issuer';
export { createRealmVerifier, type RealmVerifier } from './verifier';
export { bootstrapRealmSession } from './bootstrap';
export { InMemoryReplayStore } from './replay';
