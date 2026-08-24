# X-00 Validation Log (quickstart evidence)

Measured results against `specs/001-infrastructure-foundation/quickstart.md` scenarios.
Environment: Windows 11, Docker 29.5.2, Node v20.19.4, pnpm 9.15.9 (Corepack).

| # | Scenario | Result | Evidence / measured time | Budget | Notes |
|---|----------|--------|--------------------------|--------|-------|
| S1 | Fresh clone → running (SC-001) | PASS | clone→install→db:up→dev→both endpoints answering; measured during US1 checkpoint validation (warm pnpm store) | ≤ 15 min | see US1 checkpoint below |
| S2 | Warm start healthiness (SC-002) | PASS | containers healthy + endpoints answering well under 2 min on warm start | ≤ 2 min | images pre-pulled |
| S3 | Persistence across restart | PASS | scratch row `S3-persistence-probe` + Redis key `scratch=1` survived `compose stop/start`; restart-to-healthy 10.5s | — | named volumes `pgdata`/`redisdata` |
| S4 | Deterministic reset | PASS | `pnpm db:reset` → table gone (`to_regclass` empty), key gone, both services healthy again in 10.4s | — | `down -v && up -d --wait` |
| S5 | Broken commit blocked (SC-004) | PENDING | requires GitHub remote + branch protection (T015/T016) | — | blocked on repository hosting |
| S6 | Green merge ships non-prod (SC-005) | PENDING | requires Railway/Vercel projects linked (T017–T019) | — | config-as-code committed; platform linking is operator action |
| S7 | Cache speedup (SC-006) | see T021 | local Turbo cache measured | ≥50% faster | remote-cache `FULL TURBO` observable only in CI with TURBO_TOKEN/TURBO_TEAM |
| S8 | Secret hygiene (SC-007) | PASS | `.env.example` placeholders only; working-tree scan clean (see T020) | — | documented local defaults (`waslah`) are sanctioned by data-model.md §1 |

## US1 checkpoint (2026-08-24)

- `pnpm dev` booted both apps via Turborepo.
- `GET http://localhost:4000/healthz` → `200 {"status":"ok"}` (exact contract body).
- `GET http://localhost:3000/` → `200`, HTML contains marker string `Waslah`.

## US2 checkpoint (2026-08-24)

- `pnpm db:up` → `waslah-postgres` + `waslah-redis` both report `(healthy)` (healthchecks: `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`, interval 5s; `redis-cli ping`, interval 5s).
- S3/S4 executed as above.

## Environment incident log

- Host port 5432 conflict with unrelated container `axiomind-postgres` (postgres:17, another project). Per stakeholder decision: stopped it for the duration of S3/S4, restored afterwards (verified healthy). Waslah stack left down so port ownership returns to that project; Waslah compose fails loudly per data-model.md edge-case rule.
- Standalone global pnpm (installed under npm prefix, built against Node ≥22) shadowed Corepack and crashed under Node 20 (`ERR_UNKNOWN_BUILTIN_MODULE node:sqlite`). Fixed per README troubleshooting: removed standalone shim precedence, `corepack enable`. Plain `pnpm` now resolves to the Corepack shim pinned at 9.15.9.
