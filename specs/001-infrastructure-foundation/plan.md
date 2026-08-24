# Implementation Plan: X-00 — Infrastructure & Repository Foundation

**Branch**: `001-infrastructure-foundation` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-infrastructure-foundation/spec.md`

## Summary

Scaffold the Waslah monorepo foundation: a pnpm + Turborepo workspace with four bootable packages (`apps/api` Express skeleton, `apps/web` Next.js skeleton, `packages/shared-types` wired-but-empty contracts package, `packages/config` shared tooling configs), Docker Compose data services (PostgreSQL 16 + Redis 7) with persistence and reset, a GitHub Actions quality gate (typecheck → lint → test → build) enforced via branch protection on `main`, non-production auto-deploy configuration for Railway (API) and Vercel (web), and setup documentation that takes a new developer from clone to running in ≤ 15 minutes.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 20 LTS

**Primary Dependencies**: pnpm (version pinned via `packageManager`), Turborepo, Express (apps/api skeleton), Next.js 15 (apps/web skeleton), ESLint + Prettier (shared configs in `packages/config`), Vitest

**Storage**: PostgreSQL 16 + Redis 7, provisioned locally via Docker Compose only (no application DB connections at this spec — Prisma arrives with the DB specs)

**Testing**: Vitest (workspace projects); smoke tests per package proving the harness runs; Supertest/RTL/Playwright join in later specs per Backend_SRS/Frontend_SRS

**Target Platform**: Development — Windows/macOS/Linux workstations; CI — GitHub Actions (`ubuntu-latest`); Deployment — Railway (api) and Vercel (web), **non-production environments only**

**Project Type**: TypeScript monorepo (web service + web app + shared library + config library)

**Performance Goals**: clone → running ≤ 15 min (SC-001); all services healthy ≤ 2 min warm (SC-002); full CI gate ≤ 10 min on clean checkout (SC-003); cached re-run ≥ 50% faster than clean (SC-006)

**Constraints**: zero secrets in repository (SC-007); all scripts cross-platform (FR-016); merges to `main` blocked unless required status checks pass (FR-011); deployments target non-production only until X-08 (Clarification Q1); Node/pnpm versions pinned and enforced (FR-005)

**Scale/Scope**: 4 workspace packages at boot-skeleton level; 2 data services; 1 CI pipeline; 2 deploy integrations; setup docs. No product features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> `.specify/memory/constitution.md` does not exist yet. Gates below are derived from the principles documented in Master Implementation Plan §1–§2 (which cites Constitution v1.0.0 sections). **Governance gap flagged**: authoring the constitution file is recommended before implementation sign-off of any spec; it does not block X-00 planning because every cited principle is documented in an approved authoritative doc.

| Principle gate | Source | Status |
|----------------|--------|--------|
| §XI — `shared-types` precedes backend & frontend work | Key Decisions table | ✅ PASS — contracts package scaffolded and wired into both apps as first-class deliverable (FR-006) |
| §IX — security first-class from day one | Cross-cutting timing decision | ✅ PASS — no secrets in repo (SC-007), placeholder-only env template (FR-009) |
| §XIII — reliability first-class | Cross-cutting timing decision | ✅ PASS — merge gate technically enforced (FR-011), deploys gated on green pipeline (FR-014) |
| §XIV — testing first-class | Cross-cutting timing decision | ✅ PASS — Vitest wired across all packages from day one (FR-004, X-02 will extend) |
| §VII — `src/core/**` purity | Core business logic decision | N/A — no core logic introduced by X-00 |

**Gate result: PASS** (re-checked after Phase 1 design: still PASS — no design artifact violates any principle).

## Project Structure

### Documentation (this feature)

```text
specs/001-infrastructure-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── commands.md
│   ├── health-endpoints.md
│   └── ci-pipeline.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
├── api/                     # Express skeleton (BE-01 replaces with real app later)
│   ├── src/
│   │   ├── server.ts        # Bootstrap; listens on PORT; mounts health route
│   │   └── routes/
│   │       └── health.ts    # GET /healthz -> 200 {"status":"ok"}
│   ├── tests/
│   │   └── health.test.ts   # Proves Vitest wiring (supertest arrives with BE-01)
│   ├── package.json
│   └── tsconfig.json
├── web/                     # Next.js 15 skeleton (FE-01 replaces with real app later)
│   ├── app/
│   │   ├── layout.tsx       # Minimal root layout
│   │   └── page.tsx         # Renders marker string "Waslah" (smoke contract)
│   ├── tests/
│   │   └── smoke.test.ts    # Proves Vitest wiring in web package
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
packages/
├── shared-types/            # Wired-but-empty; populated by X-01
│   ├── src/
│   │   └── index.ts         # Placeholder export proving build/import path
│   ├── package.json         # Consumable by apps/api AND apps/web
│   └── tsconfig.json
└── config/                  # Shared tooling configs (per Waslah_Tech_Stack tree)
    ├── eslint.config.mjs    # Base ESLint flat config
    ├── prettier.json        # Base Prettier config
    ├── tsconfig.base.json   # Strict base TS config extended by every package
    └── package.json
docker-compose.yml           # postgres:16-alpine + redis:7-alpine, volumes, healthchecks
.github/workflows/ci.yml     # typecheck -> lint -> test -> build (named jobs = required checks)
package.json                 # Root: scripts surface, engines, packageManager pin
pnpm-workspace.yaml          # apps/* + packages/*
turbo.json                   # Task graph: dev/build/lint/typecheck/test w/ cache config
.env.example                 # Every env var, placeholder values, comments
README.md                    # Setup docs (prereqs, install, start/reset, troubleshooting)
```

**Structure Decision**: Web-application monorepo adapted to the pnpm-workspace layout fixed by Master Implementation Plan §3, plus `packages/config/` for shared ESLint/Prettier/tsconfig bases as prescribed by `Waslah_Tech_Stack.md`'s repository tree. No `tests/` root directory — each package owns its tests co-located under its own `tests/`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

None — no violations.
