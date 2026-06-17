/**
 * Public types for the ShieldForge SSO realm.
 *
 * A "realm" is an OPT-IN trust group: a defined collection of sites that share
 * login. There is NO central hub and NO master member — each member holds its
 * OWN RS256 key(s) and any member can both ISSUE and VERIFY. The realm token is
 * a short-lived, single-use BOOTSTRAP assertion (never a session); each member
 * mints its own native session after verifying it.
 *
 * This package is intentionally self-contained: it imports nothing from a host's
 * existing auth and depends on no other @appforgeapps/shieldforge-* package, so
 * it drops onto consumers regardless of which ShieldForge version they run.
 */

/** A JSON Web Key (public), as published in a member's JWKS. */
export interface RealmPublicJwk {
  kty: string;
  n?: string;
  e?: string;
  kid?: string;
  alg?: string;
  use?: string;
  [key: string]: unknown;
}

/** Claims carried in a realm bootstrap token (a compact RS256 JWS). */
export interface RealmTokenClaims {
  /** Issuing MEMBER id (per-member, not per-realm) — e.g. "urn:sfrealm:mystrangemind:www". */
  iss: string;
  /** The realm, NOT any member: "urn:sfrealm:<realmId>". No member is the audience. */
  aud: string;
  /** Realm id (cross-realm isolation). */
  realm: string;
  /** Optional pseudonymous, per-realm-stable subject id. */
  sub?: string;
  /** Verified email — the universal join key. Lowercased. */
  email: string;
  /** Whether the issuing member verified this email. The linking gate. */
  email_verified: boolean;
  /** Optional display-name hint for first-time upsert. */
  name?: string;
  /** Optional authentication methods at the issuer (e.g. ["pwd"], ["webauthn"]). */
  amr?: string[];
  /** Optional unix-seconds of the native auth at the issuer. */
  auth_time?: number;
  iat: number;
  exp: number;
  /** Single-use replay id. */
  jti: string;
}

/** The verified identity returned by the verifier; safe to act on. */
export interface RealmIdentity {
  email: string;
  emailVerified: boolean;
  name?: string;
  /** The issuing member id (verified against its key). */
  issuer: string;
  realm: string;
  sub?: string;
  jti: string;
}

/** A signing key a member holds (PEM PKCS#8 private key). */
export interface RealmSigningKey {
  /** Optional; the canonical kid is the RFC-7638 thumbprint and is recomputed. */
  kid?: string;
  privateKeyPem: string;
}

/** Config for a member that can ISSUE realm tokens (holds private key(s)). */
export interface RealmIssuerConfig {
  realmId: string;
  /** This member's id, used as the token `iss`. */
  memberId: string;
  /** One or more signing keys; the LAST (newest) is used to sign. */
  keys: RealmSigningKey[];
  /** Token lifetime in seconds (bootstrap, not a session). Default 120, max 300. */
  tokenTtlSec?: number;
}

/** A peer in the realm roster, from THIS member's point of view. */
export interface RealmRosterMember {
  /** The peer's member id (matches the token `iss` it produces). */
  id: string;
  /** Static pinned public JWKs for this peer (preferred — no runtime fetch)… */
  publicJwks?: RealmPublicJwk[];
  /** …OR a JWKS URI to fetch the peer's public keys from. */
  jwksUri?: string;
}

/**
 * Injectable single-use store for `jti`. REQUIRED on the verifier. The in-memory
 * default is per-instance only — production (esp. serverless) MUST inject a
 * shared store (Redis / Vercel KV).
 */
export interface ReplayStore {
  /**
   * Record a jti and report whether it was ALREADY seen (i.e. a replay).
   * @param jti     the token's jti
   * @param expSec  the token's exp (unix seconds) — lets the store self-expire
   * @returns true if this jti was seen before (REJECT); false if first use.
   */
  seen(jti: string, expSec: number): Promise<boolean>;
}

/** Config for a member that can VERIFY realm tokens. */
export interface RealmVerifierConfig {
  realmId: string;
  /** The peers whose tokens this member accepts (one entry per issuing peer). */
  roster: RealmRosterMember[];
  /** REQUIRED single-use jti store. */
  replayStore: ReplayStore;
  /** Allowed clock skew in seconds (default 5). */
  clockToleranceSec?: number;
  /** Hard cap on token age in seconds regardless of exp (default 300). */
  maxTokenAgeSec?: number;
}

/** Input for issuing a token. */
export interface IssueTokenInput {
  email: string;
  emailVerified: boolean;
  sub?: string;
  name?: string;
  amr?: string[];
  authTime?: number;
}

/** What the host must supply to the bootstrap (host-agnostic). */
export interface RealmBootstrapDeps {
  /** Look up a local user by (already-normalized, lowercased) email. */
  findUserByEmail(
    email: string,
  ): Promise<{ id: string | number; emailVerified: boolean; realmOriginated?: boolean } | null>;
  /** Create a new local user from a verified realm identity. */
  createUserFromRealm(input: {
    email: string;
    emailVerified: true;
    name?: string;
  }): Promise<{ id: string | number }>;
  /** Optional: persist the realm pseudonymous subject link. */
  linkRealmSubject?(userId: string | number, sub: string): Promise<void>;
}

/** Outcome of a bootstrap. The host mints its OWN native session from this. */
export type RealmBootstrapResult =
  | {
      status: 'ok';
      userId: string | number;
      /** True when the user row was just created (branch 3c). */
      isNew: boolean;
      /** True when this is the user's FIRST link to the realm — host may step up. */
      firstLink: boolean;
    }
  | {
      /**
       * Branch 3b: a local account exists for this email but is itself UNVERIFIED.
       * Do NOT auto-merge; the host must confirm ownership by email first. This
       * blocks the pre-registered-unverified-email account-takeover.
       */
      status: 'needsVerification';
      email: string;
    };

/** Thrown when a realm token's email is not verified — never link or create. */
export class RealmEmailUnverifiedError extends Error {
  constructor(message = 'realm token email is not verified') {
    super(message);
    this.name = 'RealmEmailUnverifiedError';
  }
}

/** Thrown when a realm token fails verification (signature, aud, replay, etc.). */
export class RealmVerifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RealmVerifyError';
  }
}
