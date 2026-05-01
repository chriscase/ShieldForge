# ShieldForge

Authentication library for React/Node/GraphQL apps — six packages published to NPM under `@appforgeapps/*`. The auth foundation underneath the Abydonian product family.

> 📚 **Part of the Abydonian ecosystem.** Cross-product context lives in [`AbydosCodex`](https://github.com/chriscase/AbydosCodex) at `~/Documents/GitHub/AbydosCodex`. Before non-trivial work in this repo, skim:
> - `20 - Products/ShieldForge.md` — current product state
> - `70 - Journals/ShieldForge Journal.md` — decisions & non-obvious discoveries (incl. the "131 tests passing while defaults insecure" lesson)
> - `80 - Daily/<YYYY>/<MM>/<today>.md` — recent context
>
> See `AbydosCodex/CLAUDE.md` for the touchpoint checklist (when to update which vault file). Append a Sessions entry to today's daily journal before stopping any non-trivial session.

## At a glance

- **Created**: 2025-12-05 (oldest active repo in the family — predates NexaDeck and NexaLive)
- **NPM scope**: `@appforgeapps/{core,react,graphql,passkey,browser,types}` (note: `appforgeapps`, not `shieldforge`)
- **Latest stable**: `1.1.0`. **Latest RC**: `2.0.0-rc.4` (security-hardened breaking changes; never finalized).
- **Consumers**: [Abydonian](https://github.com/chriscase/abydonian) (ShieldForge 2.0 powers central auth there), [NexaLive](https://github.com/chriscase/NexaLive)

## Architecture

- Database-agnostic via `AuthDataSource` DI seam (consumers plug Prisma/Mongo/anything)
- Token mode AND cookie mode in React provider (cookie added Feb 2026 once httpOnly was needed downstream)
- WebAuthn via `@simplewebauthn/server` (intentionally not hand-rolled)
- Injectable `ChallengeStore` so passkey challenges work in horizontally-scaled deployments

## Working notes

This file is intentionally minimal — most context now lives in the AbydosCodex vault (see banner above). The journal at `70 - Journals/ShieldForge Journal.md` is the best starting point for anything non-obvious.
