# ShieldForge Repository Assessment

## Scope & Method

This assessment reviews ShieldForge as an **authentication library** with emphasis on correctness, security posture, API quality, and operational readiness.

### What I examined
- Repository structure and package boundaries.
- Public APIs and implementation for core auth, GraphQL, React, Fastify, and passkey modules.
- Unit test suite coverage and execution behavior.
- Build health and basic dependency security signal.

### Commands run
- `npm test --silent`
- `npm run build --silent`
- `npm audit --omit=dev` (failed due registry access restrictions in this environment)

---

## Stated Purpose vs. Actual Fit

**Stated purpose:** “A comprehensive, highly reusable authentication library for React/Node/GraphQL applications.”

**Overall fit:** **Good foundation, not yet security-hardened by default.**

ShieldForge is thoughtfully modular and generally easy to integrate, but several security-critical defaults and implementation details should be tightened before calling it production-grade for sensitive auth workloads.

---

## What Is Good

## 1) Strong modular architecture
- Monorepo split into focused packages (`core`, `react`, `graphql`, `passkey`, `browser`, `types`) is clean and reusable.
- Type-sharing through `@appforgeapps/shieldforge-types` keeps contracts consistent.
- Good developer ergonomics via a central `ShieldForge` class and function-level exports for tree shaking.

## 2) Practical dependency injection in GraphQL
- Resolver factory pattern (`createResolvers`) makes auth/data concerns testable and adapter-friendly.
- Prevents lock-in to a specific ORM/database implementation.

## 3) Good baseline crypto choices in key paths
- Password hashing uses bcrypt (`bcryptjs`) and default salt rounds are sensible (12 in class config).
- Passkey implementation delegates core WebAuthn verification to `@simplewebauthn/server`, which is a robust approach vs. hand-rolled verification.

## 4) Good client UX support in React package
- Supports both token mode and cookie mode.
- Handles SSR hydration concerns explicitly.
- Includes cross-tab sync and optional session refresh polling.

## 5) Test and build health are strong at baseline
- Unit suite passes fully (131 tests).
- Monorepo build succeeds.

---

## What Is Bad / Risky

## Critical / High Security Risks

### 1) Insecure reset code randomness
`generateResetCode()` uses `Math.random()` for authentication-sensitive reset values. That is not cryptographically secure and can be predictable in some conditions.

**Impact:** password reset flow security is weakened.

### 2) JWT verification is under-constrained
JWT verification does not enforce explicit algorithm allow-list, issuer, audience, subject, etc.

**Impact:** easier misconfiguration and weaker defense-in-depth, especially across multi-service environments.

### 3) Plaintext password is passed into `createUser`
In GraphQL/Fastify register flows, `createUser(...)` receives both `password` and `passwordHash` because of the `RegisterInput & { passwordHash: string }` type contract.

**Impact:** increases risk that data source implementations accidentally persist plaintext passwords.

### 4) Reset codes appear to be stored in plaintext
Interfaces and resolver logic imply raw reset code storage and direct lookup by code.

**Impact:** DB leak would expose valid reset secrets directly.

### 5) Token-in-localStorage default posture
React `AuthProvider` defaults to token mode (`localStorage`) unless explicitly switched to cookie mode.

**Impact:** larger blast radius from XSS compared with httpOnly cookie session patterns.

## Medium Security / Reliability Issues

### 6) Fastify plugin prefix option appears unused
`prefix` exists in options/docs but route registration uses hardcoded paths without applying prefix.

**Impact:** surprising behavior and potential route collisions.

### 7) Fastify auth pre-handler behavior is brittle
`requireAuth` sends 401 but does not return immediately.

**Impact:** depending on framework behavior and handler composition, this can be error-prone and less explicit.

### 8) Cookie handling is manual
Cookie parsing/setting is done with string parsing rather than hardened cookie utilities/plugins.

**Impact:** easier to miss edge cases (encoding, quoting, duplicate cookie names, etc.).

### 9) Passkey challenge store is in-memory and global
Challenge storage uses a process-local Map with TTL cleanup timers.

**Impact:** unsuitable for multi-instance deployments, restarts, horizontal scaling, or strict replay controls unless replaced.

### 10) Passkey challenge validation does not bind user/session context strongly
Challenge existence is checked, but additional contextual binding checks are left to integrator flow.

**Impact:** easier to misuse API and weaken anti-replay protections.

## Product/Consistency Issues

### 11) Naming inconsistency in docs/packages
Readmes show `@shieldforge/*` in examples while root readme refers to `@appforgeapps/*`.

**Impact:** onboarding confusion and install mistakes.

### 12) Test suite has React act warnings
All tests pass, but React tests emit repeated `act(...)` warnings.

**Impact:** tests may hide state timing issues and signal weaker test rigor in async UI behaviors.

### 13) Missing targeted tests for Fastify plugin
No dedicated tests for Fastify plugin behavior/security paths were found.

**Impact:** regressions can slip into auth route mechanics, cookie handling, and middleware behavior.

---

## How Well It Works Today

## Functional readiness: **8/10**
- Core functionality appears to work.
- Good modularity and integration ergonomics.
- Build/tests are healthy.

## Security readiness for production auth: **5/10**
- Several fixable but important issues in reset-token entropy, JWT constraints, password-handling contracts, and defaults.
- More “secure-by-default” guardrails are needed.

## Maintainability: **7.5/10**
- Good package separation and readable code.
- Could improve by adding integration/security tests and tightening APIs.

---

## Recommended Changes (Prioritized)

## P0 (Do immediately)
1. Replace `Math.random()` in reset code generation with cryptographically secure randomness (`crypto.randomInt` / `randomBytes`).
2. Remove plaintext `password` from persistence contracts:
   - Change `AuthDataSource.createUser` input to exclude raw password.
   - Keep raw password only in request-layer memory.
3. Hash reset codes before storage and compare in constant-time style flows where possible.
4. Add JWT verification constraints:
   - explicit algorithm allow-list,
   - optional issuer/audience validation settings,
   - stricter error typing.

## P1 (Near term)
5. Make safer defaults explicit:
   - encourage cookie mode in docs,
   - warn about token mode tradeoffs,
   - provide hardened cookie defaults and CSRF guidance.
6. Fix Fastify `prefix` support and ensure all auth pre-handlers return after reply.
7. Move cookie parse/set logic to standard Fastify plugins (`@fastify/cookie`) and signed cookie options.
8. Add rate-limiting and lockout extension points (login/reset endpoints).

## P2 (Medium term)
9. Rework passkey challenge store abstraction:
   - injectable persistent store interface,
   - one-time use semantics with atomic consume,
   - bind challenge to user/session where appropriate.
10. Add security-focused integration tests:
   - token verification constraints,
   - password reset misuse paths,
   - Fastify cookie and middleware behavior,
   - passkey replay/expired challenge behavior.
11. Resolve package naming/documentation inconsistencies.
12. Clean up React test warnings by using `act`/async helpers properly.

---

## Security-Specific Checklist for This Library

If ShieldForge is positioned as production auth infrastructure, these should be considered baseline:

- [ ] CSPRNG for all secrets/codes
- [ ] No plaintext credentials in storage interfaces
- [ ] Reset tokens hashed at rest
- [ ] JWT verification constrained (alg, iss, aud)
- [ ] Secure session defaults (httpOnly+secure+SameSite + CSRF model)
- [ ] Rate limiting/brute-force mitigation hooks
- [ ] Audit logging hooks for auth events
- [ ] Integration tests for auth abuse cases
- [ ] Guidance for key rotation and secret management
- [ ] Multi-instance-safe challenge/session storage

---

## Final Verdict

ShieldForge is a **solid, usable foundation** with good modular design and developer experience. It is already useful for many projects, but because this is an authentication library, the current defaults and several security-sensitive implementation details should be improved before positioning it as a hardened production auth backbone.

With the P0/P1 changes above, this library could move from “good general auth toolkit” to “strong production-ready auth platform.”
