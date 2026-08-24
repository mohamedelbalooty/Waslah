# Tasks: X-00 — Infrastructure & Repository Foundation

**Input**: Design documents from `/specs/001-infrastructure-foundation/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**Tests**: Smoke-test tasks are included because the spec mandates them as deliverables (research D6: Vitest wiring proofs per package). They are deliberately minimal.

**Organization**: Tasks grouped by user story (spec.md): US1 boot locally (P1) · US2 data services (P1) · US3 quality gate (P1) · US4 non-production deploys (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Owning user story (US1–US4); omitted in Setup/Foundational/Polish phases
- Exact file paths included in every description

## Path Conventions

This is a pnpm monorepo per plan.md: `apps/api/src/`, `apps/web/app/`, `packages/shared-types/src/`, `packages/config/`, root-level infra files.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace initialization — nothing else can start without these.

- [X] T001 Create workspace root manifests: `package.json` (name `waslah`, private, `"engines": {"node": ">=20 <21"}`, `"packageManager": "pnpm@<exact 9.x>"`), `pnpm-workspace.yaml` (packages: `apps/*`, `packages/*`), `.npmrc` (`engine-strict=true`); extend `.gitignore` with `node_modules/`, `.turbo/`, `dist/`, `.env`
- [X] T002 [P] Create shared tooling configs in `packages/config/`: `package.json`, `tsconfig.base.json` (strict mode per Backend_SRS), `eslint.config.mjs` (flat config, TypeScript parser), `prettier.json` — consumed by every other package

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build orchestration and environment contract required by ALL user stories.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [X] T003 Configure `turbo.json`: tasks `dev` (persistent), `build`, `typecheck`, `lint`, `test` with `dependsOn` so `shared-types` builds before dependent apps; cacheable tasks declare `inputs`/`outputs`; `dev` excluded from caching
- [X] T004 [P] Create `.env.example` exactly per data-model.md §2: `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `POSTGRES_USER/PASSWORD/DB` — placeholders only, each with a comment naming its consumer

**Checkpoint**: Foundation ready — user stories can proceed (US1 and US2 in parallel if staffed).

---

## Phase 3: User Story 1 — Developer boots the platform locally (Priority: P1) 🎯 MVP

**Goal**: From a fresh clone, following README alone, both applications serve their smoke contracts locally in development mode.

**Independent Test**: Clean machine meeting prerequisites → clone → `pnpm install` → `pnpm dev` → `GET /healthz` returns `200 {"status":"ok"}` and web root renders containing `Waslah`, within 15 minutes without assistance (data services NOT required for this increment's pass).

### Tests for User Story 1 ⚠️ (write first; must FAIL before implementation)

- [X] T005 [P] [US1] Write `apps/api/tests/health.test.ts`: imports the health route handler (module does not exist yet → red) and asserts response is HTTP 200 with exact body `{"status":"ok"}` per contracts/health-endpoints.md
- [X] T006 [P] [US1] Write `apps/web/tests/smoke.test.ts`: imports the root page component from `apps/web/app/page.tsx` (does not exist yet → red) and asserts rendered output contains marker string `Waslah`

### Implementation for User Story 1

- [X] T007 [P] [US1] Scaffold `apps/api`: `package.json` (express, typescript, vitest, dev/build/typecheck/lint/test scripts), `tsconfig.json` extending `packages/config/tsconfig.base.json`, `src/routes/health.ts` returning the contract body, `src/server.ts` binding `process.env.PORT` (default `4000`) and mounting the route — makes T005 green
- [X] T008 [P] [US1] Scaffold `apps/web`: `package.json` (next@15, react, typescript, vitest, matching scripts), `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` rendering heading containing `Waslah` — makes T006 green
- [X] T009 [US1] Wire `packages/shared-types`: `package.json` with `exports` pointing at `src/index.ts` and a `build` (tsc) script; create `src/index.ts` with a placeholder typed export; add it as a dependency of BOTH `apps/api/package.json` and `apps/web/package.json` and import the placeholder once in each app so builds prove FR-006 (depends on T007, T008)
- [X] T010 [US1] Write setup documentation in `README.md`: prerequisites (Node 20 LTS + Corepack, Docker), install, start, stop, reset commands, port-conflict troubleshooting, cross-platform notes — sufficient for US1's Independent Test with zero human help (depends on T007, T008)

**Checkpoint**: `pnpm dev` boots both apps; both smoke tests pass; a newcomer passes US1's Independent Test.

---

## Phase 4: User Story 2 — Local data services on demand (Priority: P1)

**Goal**: One command starts PostgreSQL 16 + Redis 7 healthy; one command resets them deterministically.

**Independent Test**: `pnpm db:up` → both containers report healthy ≤ 2 min warm; scratch data survives restart; `pnpm db:reset` removes all data while services stay healthy.

### Implementation for User Story 2

- [X] T011 [US2] Create `docker-compose.yml` per data-model.md §1: service `postgres` (`postgres:16-alpine`, host port `5432`, named volume `pgdata`, `pg_isready` healthcheck interval ≤ 5s) and service `redis` (`redis:7-alpine`, port `6379`, `--appendonly yes` persisted to volume `redisdata`, `redis-cli ping` healthcheck); credentials read from env with documented local defaults (depends on T004)
- [X] T012 [US2] Add root scripts to `package.json`: `db:up` = `docker compose up -d --wait`, `db:reset` = `docker compose down -v && docker compose up -d --wait` — success requires healthy state (depends on T001, T011)
- [X] T013 [US2] Execute quickstart S3/S4 against the live stack: insert scratch row into Postgres and key into Redis → stop/start → verify retention → `pnpm db:reset` → verify removal and health (evidence recorded) (depends on T011, T012)

**Checkpoint**: US1 + US2 both work independently; full S1 flow (with `db:up`) now passes.

---

## Phase 5: User Story 3 — Automated quality gate (Priority: P1)

**Goal**: Every PR and push to `main` runs typecheck → lint → test → build; failures technically block merging.

**Independent Test**: A deliberate type error on a PR fails `typecheck` with downstream stages skipped and merge disabled; fixing it turns all four named checks green.

### Implementation for User Story 3

- [ ] T014 [US3] Create `.github/workflows/ci.yml` per contracts/ci-pipeline.md: triggers `pull_request`→`main` + `push`→`main`; runner `ubuntu-latest`; four jobs named exactly `typecheck`, `lint`, `test`, `build` chained via `needs` in that order, each invoking the corresponding Turbo task; inject `TURBO_TOKEN`/`TURBO_TEAM` repository secrets for remote cache (depends on T003, T007–T009)
- [ ] T015 [US3] Apply branch protection to `main` (repo admin, via settings UI or `gh api`): required status checks `typecheck`, `lint`, `test`, `build`; require branches up-to-date; disable force pushes/deletion — per contracts/ci-pipeline.md (depends on T014)
- [ ] T016 [US3] Prove the gate (quickstart S5): open a throwaway PR adding a type error → confirm `typecheck` red, later stages skipped, merge button disabled → fix → confirm four green checks → close/cleanup PR with evidence links (depends on T014, T015)

**Checkpoint**: Merging anything broken into `main` is now impossible.

---

## Phase 6: User Story 4 — Merging ships the product to non-production (Priority: P2)

**Goal**: Green merges auto-deploy API and web independently to designated non-production targets; production untouched.

**Independent Test**: Merge an innocuous change → Railway staging shows a new API deployment and Vercel staging shows a new web deployment with zero manual steps.

### Implementation for User Story 4

- [ ] T017 [US4] Configure Railway service for `apps/api`: link repository, create/select staging environment, set watch paths `apps/api/**` + `packages/**`, define build/start commands, enable auto-deploy on `main` — commit any config-as-code file (e.g., `railway.json`) that the platform supports (depends on T014)
- [ ] T018 [P] [US4] Configure Vercel project for `apps/web`: staging-scoped project/alias, auto-deploy from `main`, configure ignored-build step/watch paths so API-only changes do not trigger web builds — commit `vercel.json` if required (depends on T014)
- [ ] T019 [US4] Verify the ship path (quickstart S6): merge a green change → both staging deployments fire independently; follow-up API-only change redeploys only Railway; confirm no production domain/env was attached anywhere (depends on T015, T017, T018)

**Checkpoint**: Full path proven: code → green pipeline → merged → deployed (non-production).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Spec-wide verification and portfolio bookkeeping.

- [ ] T020 [P] Secret-hygiene audit (quickstart S8): verify `.env.example` contains placeholders only; scan working tree for credential-looking literals; document result against SC-007
- [ ] T021 Execute full `specs/001-infrastructure-foundation/quickstart.md` scenarios S1–S8 end-to-end; fix any gaps surfaced; record measured times vs budgets (SC-001…SC-006)
- [ ] T022 After T021 passes: update `docs/plans/master-implementation-plan.md` §12 Status Tracking — X-00 → `Complete`; note that X-01 (Shared Contracts) is unlocked next

---

## Dependencies & Execution Order

### Phase dependencies

- Setup (Phase 1) → Foundational (Phase 2) blocks everything
- US1 (Phase 3) and US2 (Phase 4) are independent of each other — parallelizable after Phase 2
- US3 (Phase 5) requires US1 (needs real packages to check/test/build)
- US4 (Phase 6) requires US3 (deploys gated on pipeline) and US1 (something deployable)
- Polish (Phase 7) requires US1–US4 complete

### Within-story ordering

- Tests (T005/T006) written BEFORE their implementations (T007/T008) and must fail first
- Scaffolds (T007/T008) before shared-types wiring (T009) and docs (T010)
- Compose file (T011) before scripts (T012) before live validation (T013)
- CI workflow (T014) before branch protection (T015) before gate proof (T016)

### Parallel opportunities

- T002 ∥ T001 (different files)
- T004 ∥ T003
- Whole-story: Developer A executes US1 while Developer B executes US2 (disjoint file sets)
- T005 ∥ T006 · T007 ∥ T008 (api vs web trees)
- T017 ∥ T018 (Railway vs Vercel configuration)
- T020 runs any time after Phase 2

---

## Parallel Example: User Stories 1 & 2 (after Phase 2)

```text
Developer A (US1):  T005 → T006 → T007 → T008 → T009 → T010
Developer B (US2):  T011 → T012 → T013
Merge both branches → Phase 5 starts (single integrator)
```

## Implementation Strategy

### MVP First (bootable monorepo)

1. Phases 1–2 (Setup + Foundational) — blocking
2. Phase 3 (US1) → STOP: validate Independent Test on a clean machine
3. This alone satisfies "monorepo boots" — the heart of X-00

### Incremental Delivery

- +Phase 4: deterministic data services → S3/S4 provable
- +Phase 5: merge safety enforced → S5 provable
- +Phase 6: continuous non-production delivery → S6 provable
- +Phase 7: full SC evidence → X-00 Complete → unlock X-01

## Notes

- All commands referenced exist per contracts/commands.md; `pnpm db:migrate` stays reserved (fails loudly with explicit message) until DB-01 lands
- Commit after each task or logical group
- Any deviation discovered during implementation (image tags, pnpm minor version) gets pinned in lockfiles and noted in the spec's Clarifications — never resolved silently
