# Phase 0 Research: X-00 — Infrastructure & Repository Foundation

**Date**: 2026-08-21 · **Status**: Complete — all decisions resolved; no NEEDS CLARIFICATION remains.

Every decision below is grounded in the authoritative corpus (Master Implementation Plan v1.2.0, Waslah_Tech_Stack.md, Backend_SRS v2.2, Frontend_SRS v2.2) or in the spec's recorded clarifications. Where the docs are silent, the decision states so and picks the lowest-risk industry default.

---

## D1 — Test runner

- **Decision**: Vitest for all packages (workspace projects mode).
- **Rationale**: Explicitly pinned by Backend_SRS ("Test: vitest; supertest for HTTP"), Frontend_SRS ("vitest + React Testing Library; Playwright E2E"), and Waslah_Tech_Stack.md ("Vitest + Supertest"). Native TypeScript/ESM support removes transpile config from this foundation spec; per-package projects integrate cleanly with Turborepo caching.
- **Alternatives considered**: Jest (rejected — not doc-sanctioned; slower TS/ESM setup); node:test (rejected — no doc backing, weaker DX for React).

## D2 — Lint & formatting

- **Decision**: ESLint (flat config) + Prettier, with shared bases published from `packages/config` and extended by each package.
- **Rationale**: Waslah_Tech_Stack.md's monorepo tree prescribes `packages/config/ # shared eslint, tsconfig, prettier configs`. Flat config avoids legacy `.eslintrc` deprecation churn.
- **Alternatives considered**: Biome (single-tool speed win, rejected — not sanctioned by any authoritative doc); per-package configs (rejected — violates single-source toolchain intent of FR-005).

## D3 — Runtime & package-manager pinning

- **Decision**: Node.js 20 LTS line (`engines.node`: `>=20 <21`) and pnpm 9 latest minor, pinned exactly via root `package.json` → `"packageManager": "pnpm@9.x.y"`, enforced through Corepack.
- **Rationale**: SRS/Tech Stack mandate "Node.js ≥ 20 / Node.js 20 LTS"; Tech Stack mandates pnpm. Exact pin satisfies FR-005 ("identical versions across developers and CI") without blocking patch updates within a locked major.
- **Alternatives considered**: Loose ranges (rejected — fails FR-005 testability); Node 22 (rejected — docs say 20 LTS; upgrade is a future scope decision).

## D4 — Turborepo remote cache provider

- **Decision**: Vercel Remote Cache (Turborepo's built-in hosted cache), authenticated in CI via `TURBO_TOKEN`/`TURBO_TEAM` repository secrets.
- **Rationale**: Vercel hosting is already mandated, so the cache costs zero extra infrastructure; Tech Stack explicitly cites "Turborepo's remote caching so CI stays fast". Directly serves SC-006 (≥50% faster re-run).
- **Alternatives considered**: Self-hosted cache server (rejected — operational burden unjustified at 4 packages); local-only cache (rejected — CI wouldn't benefit, undermining SC-003/SC-006).

## D5 — CI operating system matrix

- **Decision**: Single OS (`ubuntu-latest`) in CI; cross-platform correctness guaranteed by script discipline — every task runs through `package.json` scripts executed by pnpm/Turbo, never raw shell constructs.
- **Rationale**: Primary dev machine is Windows, so Windows compatibility is exercised daily regardless of CI OS; a windows-latest job would roughly double CI minutes for marginal early value. X-02 (Testing Strategy) may add it later if risk materializes.
- **Alternatives considered**: Matrix build ubuntu+windows now (rejected — cost outweighs risk while scripts stay framework-mediated).

## D6 — Skeleton health contract

- **Decision**: `apps/api` exposes `GET /healthz → 200 {"status":"ok"}`; `apps/web` renders a page containing the marker string `Waslah`. These are the smoke-check contracts used by quickstart validation and CI build verification.
- **Rationale**: Gives SC-002/SC-006 and User Story acceptance scenarios something objective to assert before any real feature exists; `/healthz` is the convention BE-01 will inherit.
- **Alternatives considered**: No health route until BE-01 (rejected — leaves "boots and responds" untestable at X-00 sign-off); TCP-port-only check (rejected — proves process, not service correctness).

## D7 — Non-production deployment wiring (per Clarification Q1)

- **Decision**: Dedicated **non-production** targets created now: a staging environment on the Railway API service and a staging-scoped Vercel project/deployment alias for web, triggered on merge to `main` via each platform's GitHub integration. Production domains/promotion are deliberately NOT attached until X-08.
- **Rationale**: Honors clarification A (non-production only) while still proving the full ship path (FR-013, SC-005). Both platforms support environment/project separation natively; watch-path filters keep deploys independent (US4 scenarios 1–2).
- **Alternatives considered**: Auto-deploy straight to production (rejected — contradicts clarification); manual promotion only (rejected — leaves SC-005 unmeasurable at X-00).

## D8 — Data services shape

- **Decision**: `docker-compose.yml` defines `postgres:16-alpine` (port 5432, named volume `pgdata`, `pg_isready` healthcheck) and `redis:7-alpine` (port 6379, `redis-cli ping` healthcheck). Credentials come from `.env` with safe local defaults documented in `.env.example`. Reset = `docker compose down -v` wrapper script.
- **Rationale**: Matches tasks 0.2 verbatim (postgres:16 + redis:7); alpine images keep cold-start inside SC-002's budget; named volumes satisfy persistence acceptance scenario 3; `-v` reset gives deterministic clean state (US2 scenario 2).
- **Alternatives considered**: Native installs (rejected — nondeterministic dev environments); init containers/migrations here (rejected — DB schemas belong to DB-01/DB-14).

## D9 — Branch protection & required checks

- **Decision**: Four separate CI jobs — `typecheck`, `lint`, `test`, `build` — chained `typecheck → lint → test → build` via `needs`, so each stage's name is individually selectable as a **required status check** on `main`. Repo admin applies branch protection once during setup (documented step in quickstart).
- **Rationale**: FR-011's enforcement (Clarification Q2) requires the gate to be technically mandatory; named jobs make the requirement auditable per stage instead of one opaque aggregate check.
- **Alternatives considered**: Single `ci` job/check (rejected — failure attribution weaker, stage order less visible); merge queues (deferred — unnecessary at current team size).

## D10 — Secrets & environment surface

- **Decision**: `.env.example` declares: `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL` (+ commented placeholders for future specs). Repository secrets limited to `TURBO_TOKEN`, `TURBO_TEAM` (remote cache). Railway/Vercel auth flows through their GitHub App integrations — no long-lived deploy tokens in GitHub.
- **Rationale**: Minimal secret surface honors SC-007 and keeps X-08's production secrets work untouched; integration-based deploys remove token rotation burden.
- **Alternatives considered**: Deploy tokens in GitHub secrets (rejected — extra rotation liability with no benefit while integrations exist).

## Residual unknowns

None. All Technical Context fields resolved; remaining choices (exact pnpm minor, image digests) are task-level pins decided during implementation with lockfiles.
