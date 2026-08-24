# Phase 1 Data Model: X-00 — Infrastructure & Repository Foundation

**Date**: 2026-08-21 · **Scope note**: This spec introduces **no domain entities** — no Workspace, User, Product, or money types exist yet (those belong to DB-01…DB-07 and X-01). The "data" of this feature is infrastructure resources, configuration, and the workspace dependency graph. They are modeled below because tasks, tests, and validation scenarios assert against them.

---

## 1. Infrastructure Resources

### Resource: `postgres` (Docker Compose service)

| Attribute | Value | Rule |
|-----------|-------|------|
| Image | `postgres:16-alpine` | Major version pinned at 16 per task 0.2 |
| Port | host `5432` → container `5432` | Must fail loudly on conflict (Edge Case) |
| Volume | named volume `pgdata` → `/var/lib/postgresql/data` | Persistence across restarts (US2 scenario 3) |
| Healthcheck | `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`, interval ≤ 5s | "Healthy" state definition for SC-002 |
| Credentials | from env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local defaults only; never production values |

### Resource: `redis` (Docker Compose service)

| Attribute | Value | Rule |
|-----------|-------|------|
| Image | `redis:7-alpine` | Major version pinned at 7 per task 0.2 |
| Port | host `6379` → container `6379` | Conflict fails loudly |
| Volume | append-only persistence enabled (`--appendonly yes`) to volume `redisdata` | Survives restarts |
| Healthcheck | `redis-cli ping` expecting `PONG` | Healthy-state definition |

### Resource: lifecycle operations

| Operation | Behavior |
|-----------|----------|
| Start (`db:up`) | Create/start both services; command succeeds only when both report healthy |
| Stop | Stop services, volumes retained |
| Reset (`db:reset`) | `down -v` + up — destroys all data deterministically (US2 scenario 2) |

## 2. Configuration Entities

### Entity: Environment variable (`.env.example` contract)

Every variable consumed by any package or service. Placeholder values only — a real credential in this file violates SC-007.

| Name | Consumed by | Example placeholder | Required at X-00 |
|------|-------------|---------------------|------------------|
| `NODE_ENV` | api, web | `development` | Yes |
| `PORT` | api | `4000` | Yes |
| `DATABASE_URL` | compose (postgres), reserved for DB specs | `postgresql://waslah:waslah@localhost:5432/waslah` | Yes (compose) |
| `REDIS_URL` | reserved for queue specs; compose port wiring | `redis://localhost:6379` | No (declared now) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | postgres container | local dev values | Yes (compose) |
| `TURBO_TOKEN`, `TURBO_TEAM` | CI remote cache | *(GitHub secret, not in file)* | CI only |

Validation rules: `.env.example` must remain copyable to `.env` with zero edits and produce a working local stack; any new variable introduced by later specs must be appended here (enforced by review).

### Entity: Version pins

| Pin | Location | Enforcement |
|-----|----------|-------------|
| Node `>=20 <21` | root `package.json` `engines` | pnpm refuses install on mismatch |
| pnpm exact (`pnpm@9.x.y`) | root `package.json` `packageManager` | Corepack enforces |
| TypeScript major | `packages/config/tsconfig.base.json` + lockfile | lockfile |

## 3. Workspace Dependency Graph (build-time relationships)

```text
apps/api    ──imports──▶ packages/shared-types
apps/web    ──imports──▶ packages/shared-types
apps/*      ──extends──▶ packages/config (eslint, tsconfig.base, prettier)
packages/shared-types ──extends──▶ packages/config
```

Rules:
- `shared-types` MUST have zero runtime dependencies (X-01 will populate content; purity preserved from day one).
- Both apps MUST import the placeholder export successfully at build time (proves FR-006 path before X-01 fills it).
- No cross-imports between `apps/api` and `apps/web`.

## 4. State Transitions

Only one stateful system exists at this spec — the pipeline/branch lifecycle:

```text
commit ──push/PR──▶ typecheck ─pass─▶ lint ─pass─▶ test ─pass─▶ build ─pass─▶ merge-eligible ─merge─▶ deploy(non-prod)
                          └ any failure ─▶ BLOCKED (no merge, no deploy)
```

No domain lifecycle states (order/invoice/etc.) exist at this spec.
