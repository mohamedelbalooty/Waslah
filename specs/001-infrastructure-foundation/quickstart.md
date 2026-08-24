# Quickstart: Validating X-00 — Infrastructure & Repository Foundation

**Date**: 2026-08-21 · Run these scenarios after implementation to prove the spec's acceptance criteria. Command behavior contracts live in [contracts/commands.md](./contracts/commands.md); endpoint contracts in [contracts/health-endpoints.md](./contracts/health-endpoints.md); pipeline contract in [contracts/ci-pipeline.md](./contracts/ci-pipeline.md).

## Prerequisites

- Node.js 20 LTS (Corepack enabled)
- Docker (or compatible OCI runtime) running
- Git; access to the repository
- Railway + Vercel projects linked to the repo, configured as **non-production** targets (research D7)

## S1 — Fresh clone to running (SC-001, US1) — budget: ≤ 15 min

```text
git clone <repo> && cd waslah
pnpm install
pnpm db:up
pnpm dev
```

**Expected**: `apps/api` answers `GET /healthz` with `200 {"status":"ok"}`; `apps/web` root page renders containing `Waslah`. Timer starts at clone; both endpoints answering within 15 minutes = pass.

## S2 — Warm start healthiness (SC-002) — budget: ≤ 2 min

With dependencies installed and images pulled: stop everything, run `pnpm db:up` + `pnpm dev`.

**Expected**: Docker reports both services `healthy`; both endpoints answer within 2 minutes.

## S3 — Persistence across restart (US2 scenario 3)

Write data into Postgres (`psql` insert a scratch row) and Redis (`SET scratch 1`). Stop services. Start again.

**Expected**: scratch row and key still present.

## S4 — Deterministic reset (US2 scenario 2)

Run `pnpm db:reset`.

**Expected**: services healthy again with the S3 scratch data gone.

## S5 — Broken commit is blocked (SC-004, FR-011, US3)

Open a PR containing a deliberate type error. Observe checks. Then fix and re-push. (Requires branch protection already applied per contracts/ci-pipeline.md.)

**Expected**: `typecheck` fails first, later stages skipped; **the merge button is disabled** while red. After the fix, all four named checks pass.

## S6 — Green merge ships to non-production (SC-005, US4)

Merge the fixed PR from S5.

**Expected**: Railway staging shows a new deployment for the API change set; Vercel staging shows one for web; no production domain was touched; an API-only follow-up change redeploys only Railway.

## S7 — Cache speedup (SC-006)

Re-run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` twice: once after clearing the Turbo local cache, once immediately after with zero input changes.

**Expected**: second run completes in ≤ 50% of the cold run's time; CI logs show remote-cache hits (`FULL TURBO`).

## S8 — Secret hygiene (SC-007)

Inspect `.env.example` and search the working tree for credential-looking literals (API keys, passwords beyond documented local dev defaults).

**Expected**: placeholders only; nothing resembling a real secret anywhere in the repository.

## Pass bar

S1–S8 all green ⇒ X-00 acceptance criteria demonstrated; spec ready for `/speckit.tasks`.
