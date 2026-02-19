# ShieldForge Migration Guide

This document covers breaking changes and required migration steps when upgrading ShieldForge.

---

## Upgrading to v1.1.0

Version 1.1.0 includes critical security hardening based on a security assessment. There are **3 breaking changes** that require updates in your code:

1. [AuthDataSource interface changes](#1-authdatasource-interface-changes) (affects everyone)
2. [GraphQL ResolverDependencies.auth requires `hashResetCode`](#2-graphql-resolverdependenciesauth-requires-hashresetcode) (affects GraphQL users)
3. [Fastify routes now use a prefix](#3-fastify-routes-now-use-a-prefix) (affects Fastify users)

There are also several **non-breaking enhancements** you should be aware of:

- [JWT issuer/audience validation](#jwt-issueraudience-validation-optional)
- [Injectable ChallengeStore for Passkeys](#injectable-challengestore-for-passkeys)
- [Rate-limiting hooks for Fastify](#rate-limiting-hooks-for-fastify)
- [Reset code hashing utilities](#reset-code-hashing-utilities)

---

### 1. AuthDataSource interface changes

**Impact:** Everyone who implements `AuthDataSource`

The `AuthDataSource` interface has changed in two ways:

#### a) `createUser` now takes `CreateUserInput` (no plaintext password)

Previously, `createUser` received the full `RegisterInput` merged with `{ passwordHash }`, which **included the plaintext password**. Now it receives a `CreateUserInput` that deliberately excludes the plaintext password.

**Before:**
```typescript
const dataSource: AuthDataSource = {
  createUser: async (input) => {
    // input had: email, password, username, name, passwordHash
    // ⚠️ input.password contained the plaintext password!
    return db.user.create({
      data: {
        email: input.email,
        username: input.username,
        name: input.name,
        passwordHash: input.passwordHash,
      },
    });
  },
  // ...
};
```

**After:**
```typescript
import { CreateUserInput } from '@appforgeapps/shieldforge-types';

const dataSource: AuthDataSource = {
  createUser: async (input: CreateUserInput) => {
    // input has: email, username, name, passwordHash
    // ✅ No plaintext password
    return db.user.create({
      data: {
        email: input.email,
        username: input.username,
        name: input.name,
        passwordHash: input.passwordHash,
      },
    });
  },
  // ...
};
```

**What to do:** If your `createUser` implementation referenced `input.password`, remove that reference. If you were only using `input.email`, `input.username`, `input.name`, and `input.passwordHash`, your code likely works already — just update the type annotation.

#### b) Password reset methods now use hashed codes

The three password reset methods (`createPasswordReset`, `getPasswordReset`, `deletePasswordReset`) now receive a **SHA-256 hash** of the reset code instead of the raw code. This means reset codes are never stored in plaintext in your database.

**Before:**
```typescript
const dataSource: AuthDataSource = {
  createPasswordReset: async (userId, code, expiresAt) => {
    // `code` was the raw reset code (e.g., "482910")
    await db.passwordReset.create({
      data: { userId, code, expiresAt },
    });
  },

  getPasswordReset: async (code) => {
    // Looked up by raw code
    return db.passwordReset.findUnique({ where: { code } });
  },

  deletePasswordReset: async (code) => {
    await db.passwordReset.delete({ where: { code } });
  },
};
```

**After:**
```typescript
const dataSource: AuthDataSource = {
  createPasswordReset: async (userId, codeHash, expiresAt) => {
    // `codeHash` is a SHA-256 hex string (64 characters)
    await db.passwordReset.create({
      data: { userId, codeHash, expiresAt },
    });
  },

  getPasswordReset: async (codeHash) => {
    // Looked up by hash
    return db.passwordReset.findUnique({ where: { codeHash } });
  },

  deletePasswordReset: async (codeHash) => {
    await db.passwordReset.delete({ where: { codeHash } });
  },
};
```

**What to do:**
1. Rename your database column from `code` to `codeHash` (or equivalent) to avoid confusion.
2. The column should store a 64-character hex string (SHA-256). If your column was `VARCHAR(10)`, widen it to `VARCHAR(64)` or `CHAR(64)`.
3. Update your queries to look up by the hash.
4. Any existing raw reset codes in your database will stop working after the upgrade. This is acceptable since reset codes are short-lived (typically 1 hour).

---

### 2. GraphQL ResolverDependencies.auth requires `hashResetCode`

**Impact:** Anyone using `createResolvers()` from `@appforgeapps/shieldforge-graphql`

The `auth` object you pass to `createResolvers()` now requires a `hashResetCode` method. This is used internally to hash reset codes before storing them.

**Before:**
```typescript
import { createResolvers } from '@appforgeapps/shieldforge-graphql';

const resolvers = createResolvers({
  dataSource: myDataSource,
  auth: {
    hashPassword: (pwd) => sf.hashPassword(pwd),
    verifyPassword: (pwd, hash) => sf.verifyPassword(pwd, hash),
    generateToken: (payload) => sf.generateToken(payload),
    verifyToken: (token) => sf.verifyToken(token),
    calculatePasswordStrength: (pwd) => sf.calculatePasswordStrength(pwd),
    sanitizeUser: (user) => sf.sanitizeUser(user),
    generateResetCode: (len) => sf.generateResetCode(len),
    sendPasswordResetEmail: (to, code) => sf.sendPasswordResetEmail(to, code),
  },
});
```

**After:**
```typescript
import { createResolvers } from '@appforgeapps/shieldforge-graphql';

const resolvers = createResolvers({
  dataSource: myDataSource,
  auth: {
    hashPassword: (pwd) => sf.hashPassword(pwd),
    verifyPassword: (pwd, hash) => sf.verifyPassword(pwd, hash),
    generateToken: (payload) => sf.generateToken(payload),
    verifyToken: (token) => sf.verifyToken(token),
    calculatePasswordStrength: (pwd) => sf.calculatePasswordStrength(pwd),
    sanitizeUser: (user) => sf.sanitizeUser(user),
    generateResetCode: (len) => sf.generateResetCode(len),
    hashResetCode: (code) => sf.hashResetCode(code),       // ← NEW required method
    sendPasswordResetEmail: (to, code) => sf.sendPasswordResetEmail(to, code),
  },
});
```

**What to do:** Add `hashResetCode: (code) => sf.hashResetCode(code)` to your `auth` object. The `ShieldForge` class now exposes `hashResetCode()` as a method, so if you're passing through a `ShieldForge` instance, just add the one line.

---

### 3. Fastify routes now use a prefix

**Impact:** Anyone using the ShieldForge Fastify plugin

All auth routes are now prefixed with `/auth` by default. This means route paths have changed:

| Before          | After (default)         |
|-----------------|-------------------------|
| `/login`        | `/auth/login`           |
| `/register`     | `/auth/register`        |
| `/logout`       | `/auth/logout`          |
| `/me`           | `/auth/me`              |
| `/password`     | `/auth/password`        |
| `/reset-request`| `/auth/reset-request`   |
| `/reset-password`| `/auth/reset-password` |
| `/password-strength` | `/auth/password-strength` |

**Option A — Keep the new prefix (recommended):**
Update your frontend API calls to use the `/auth` prefix:

```typescript
// Before
const res = await fetch('/login', { method: 'POST', body: ... });

// After
const res = await fetch('/auth/login', { method: 'POST', body: ... });
```

**Option B — Use a custom prefix:**
```typescript
await app.register(shieldForgeFastify, {
  shieldForge: sf,
  dataSource: myDataSource,
  prefix: '/api/auth',  // Custom prefix
});
// Routes: /api/auth/login, /api/auth/register, etc.
```

**Option C — Restore the old behavior (no prefix):**
```typescript
await app.register(shieldForgeFastify, {
  shieldForge: sf,
  dataSource: myDataSource,
  prefix: '',  // Empty string = no prefix, same as before
});
// Routes: /login, /register, etc. (same as v1.0)
```

---

## Non-Breaking Enhancements

These are new features that don't require any code changes. You can adopt them at your own pace.

### JWT issuer/audience validation (optional)

You can now configure JWT tokens with `issuer` and `audience` claims for defense in depth:

```typescript
const sf = new ShieldForge({
  jwtSecret: process.env.JWT_SECRET!,
  jwtIssuer: 'my-app',       // Added to all tokens, verified on decode
  jwtAudience: 'my-api',     // Added to all tokens, verified on decode
});
```

Tokens from other applications (or forged with a different issuer) will be rejected.

### Injectable ChallengeStore for Passkeys

The `PasskeyService` now accepts an optional `challengeStore` for production-ready challenge persistence:

```typescript
import { PasskeyService } from '@appforgeapps/shieldforge-passkey';
import type { ChallengeStore } from '@appforgeapps/shieldforge-types';

// Example: Redis-backed challenge store
const redisStore: ChallengeStore = {
  store: async (challenge, userId, ttl) => {
    await redis.set(`challenge:${challenge}`, JSON.stringify({ challenge, userId, createdAt: new Date(), expiresAt: new Date(Date.now() + ttl) }), 'PX', ttl);
  },
  get: async (challenge) => {
    const data = await redis.get(`challenge:${challenge}`);
    return data ? JSON.parse(data) : null;
  },
  delete: async (challenge) => {
    await redis.del(`challenge:${challenge}`);
  },
  clearExpired: async () => { /* Redis handles TTL automatically */ },
};

const passkeys = new PasskeyService({
  rpName: 'My App',
  rpId: 'myapp.com',
  origin: 'https://myapp.com',
  challengeStore: redisStore,  // ← inject your store
});
```

If you don't provide one, the default `InMemoryChallengeStore` is used (same as before).

### Rate-limiting hooks for Fastify

The Fastify plugin now supports rate-limiting hooks to integrate your preferred rate-limiter:

```typescript
await app.register(shieldForgeFastify, {
  shieldForge: sf,
  dataSource: myDataSource,

  // Called before password verification — throw to reject
  onLoginAttempt: async (key, request) => {
    const result = await limiter.consume(key);
    if (result.remainingPoints <= 0) {
      throw new Error('Too many login attempts. Try again later.');
    }
  },

  // Called before generating a reset code — throw to reject
  onResetAttempt: async (key, request) => {
    await resetLimiter.consume(key);
  },

  // Called after a failed login — use for progressive lockout
  onLoginFailure: async (key, request) => {
    await failureLimiter.penalty(key);
  },
});
```

### Reset code hashing utilities

The `ShieldForge` class now exposes hashing methods for reset codes:

```typescript
const sf = new ShieldForge({ jwtSecret: 'secret' });

const code = sf.generateResetCode();           // "482910" (CSPRNG, not Math.random)
const hash = sf.hashResetCode(code);           // SHA-256 hex string
const valid = sf.verifyResetCode(code, hash);  // constant-time comparison
```

These are used internally by the GraphQL resolvers and Fastify routes — you only need them if you're building custom auth flows.

---

## Security Summary

This release addresses the following security issues from the assessment:

| ID | Issue | Severity | Fix |
|----|-------|----------|-----|
| P0-1 | `Math.random()` in reset codes | Critical | Replaced with CSPRNG |
| P0-2 | Plaintext password in `createUser` | Critical | New `CreateUserInput` type |
| P0-3 | Reset codes stored in plaintext | Critical | SHA-256 hashing + constant-time verify |
| P0-4 | JWT algorithm confusion attack | High | Algorithm allow-list (HS256), issuer/audience |
| P1-5/6/7 | Fastify prefix, pre-handler, cookie bugs | Medium | Fixed route prefix, return behavior, URI encoding |
| P1-8 | No rate-limiting hooks | Medium | Added `onLoginAttempt`, `onResetAttempt`, `onLoginFailure` |
| P2-9 | Hardcoded challenge store | Low | Injectable `ChallengeStore` interface |
| P2-11 | Wrong NPM package names in docs | Low | Fixed to `@appforgeapps/shieldforge-*` |
| P2-12 | React tests failing (localStorage) | Low | Added jsdom polyfill |

## Questions?

- [Issue Tracker](https://github.com/chriscase/ShieldForge/issues)
- [Discussions](https://github.com/chriscase/ShieldForge/discussions)
