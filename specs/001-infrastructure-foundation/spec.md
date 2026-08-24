# Specification: X-00 — Infrastructure & Repository Foundation

**Spec ID**: X-00
**Name**: Infrastructure & Repository Foundation
**Phase**: Pre-phase (Phase 0 — Foundation, Days 1–5)
**Status**: Draft
**Depends on**: — (none; first spec in the portfolio)
**Blocks**: All specs (X-01…X-08, DB-01…DB-15, BE-01…BE-19, FE-01…FE-15)
**SRS references**: Master Implementation Plan §3 (Monorepo Structure), §5 tasks 0.1–0.4, §9; Waslah_Tech_Stack.md (Monorepo & CI/CD selections); Backend_SRS §4 (target layout)
**Constitution principles**: IX (security first-class), XIII (reliability first-class), XIV (testing first-class)

---

## Clarifications

### Session 2026-08-21

- Q: When a change merges to `main`, should automatic deployments go to non-production environments only (with production deployment deferred to X-08), or straight to production from day one? → A: Non-production (dev/staging) environments only; production cutover is X-08 scope.
- Q: How should the rule "a failing pipeline blocks the merge" (FR-011) be enforced on the main branch? → A: Technically enforced via branch protection on `main` requiring the pipeline's status checks to pass.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer boots the platform locally (Priority: P1)

A new developer joins the Waslah team. They clone the repository on a machine that meets the documented prerequisites, follow the setup documentation alone, and run a single start command. The backend application, the frontend application, and the local data services all come up together, and the developer can immediately begin work on any downstream specification.

**Why this priority**: Every one of the 57 other specifications in the portfolio is built and verified inside this environment. Nothing can start until a reproducible local environment exists.

**Independent Test**: On a clean machine with prerequisites installed, follow only the setup documentation from clone to running. Both applications serve traffic locally and data services report healthy within 15 minutes, with no help from another person.

**Acceptance Scenarios**:

1. **Given** a fresh clone on a machine with documented prerequisites installed, **When** the developer runs the documented start command(s), **Then** both applications run concurrently in development mode and respond to local requests.
2. **Given** the local environment is running and has produced some data, **When** the developer stops everything and starts it again, **Then** previously created data is still present.
3. **Given** a required prerequisite is missing, **When** the developer attempts setup, **Then** the failure clearly identifies what is missing and the documentation states how to install it.

### User Story 2 — Local data services on demand (Priority: P1)

A developer needs the platform's two data services (a relational database and a cache/queue broker) running locally without installing them natively. One command brings both up with health checks; one command tears them down and resets them to a clean state when experiments go wrong.

**Why this priority**: Phases 1–3 all depend on database migrations and queue-backed workers; developers must be able to run and reset these services deterministically.

**Independent Test**: Run the data-services start command from scratch: both services report healthy within 2 minutes. Corrupt or delete local data, run the reset command, and verify a clean state returns.

**Acceptance Scenarios**:

1. **Given** no data services are running, **When** the developer runs the start command, **Then** both services become healthy and are reachable by both applications using only configuration from the repository.
2. **Given** data services contain unwanted test data, **When** the developer runs the documented reset command, **Then** all application data is removed and services remain healthy.
3. **Given** the developer's machine reboots, **When** the start command runs again, **Then** previously persisted service data survives restarts unless an explicit reset was performed.

### User Story 3 — Automated quality gate on every change (Priority: P1)

A contributor opens a change to the repository. Before it can merge, an automated pipeline runs type checking, linting, tests, and builds across every package in order. Any failure blocks the merge. The gate cannot be bypassed by forgetting to run checks locally.

**Why this priority**: Constitution principles XIII/XIV make reliability and testing first-class from day one; the gate is the enforcement mechanism every later spec relies on (AI guardrail tests, tenant isolation tests, financial correctness tests).

**Independent Test**: Push a commit containing a deliberate type error to a pull request: the pipeline fails and reports which stage failed. Revert the error: the pipeline passes end-to-end.

**Acceptance Scenarios**:

1. **Given** a pull request with code that fails any of the four stages (typecheck → lint → test → build), **When** the pipeline runs, **Then** the pipeline reports failure at the offending stage and the change cannot merge.
2. **Given** a pull request where all four stages pass, **When** the pipeline completes, **Then** the change is eligible to merge.
3. **Given** a direct push to the main branch, **When** the pipeline runs, **Then** the same four stages execute identically.

### User Story 4 — Merging ships the product (Priority: P2)

After merging to the main branch, the backend application deploys automatically to its designated non-production environment and the frontend application deploys automatically to its designated non-production environment, each independently. No manual release steps are required for a deployment candidate to reach a verifiable deployed state. Production deployment is explicitly out of scope until X-08.

**Why this priority**: Deployment wiring unblocks Phase 4 production-readiness work (X-08) and lets every intermediate phase be demoed on real infrastructure, but nothing is blocked during Days 1–5 as long as local development works.

**Independent Test**: Merge an innocuous change to main. Both platforms show a new successful deployment originating from that merge, without anyone clicking "deploy".

**Acceptance Scenarios**:

1. **Given** a merged change on main touching only backend code, **When** automation completes, **Then** the backend deploys and the frontend deploy is unaffected.
2. **Given** a merged change on main touching only frontend code, **When** automation completes, **Then** the frontend deploys and the backend deploy is unaffected.
3. **Given** a failing pipeline on main, **When** deployment would trigger, **Then** deployment does not proceed from a failed build.

### Edge Cases

- A developer's machine already occupies a port needed by a local service: startup must fail with a clear, actionable message rather than silently misbehaving.
- Windows, macOS, and Linux development machines must all be able to run every command; no command may depend on Unix-only shell behavior.
- Cached task results must never mask a real failure: changing inputs must invalidate caches, and a stale-cache false green is treated as a defect of this spec.
- No real credentials, tokens, or secrets may ever exist in the repository; the environment template contains placeholders only.
- First run on a cold machine (no cached dependencies) may be slow; documentation sets the expectation and the 15-minute budget accounts for it.

## Requirements *(mandatory)*

> Tooling names below (pnpm, Turborepo, PostgreSQL 16, Redis 7, GitHub Actions, Railway, Vercel) are **constraints inherited from the approved Master Implementation Plan and Tech Stack decision record**, not open implementation choices. They define *what* must exist; planning decides *how* to configure them.

### Workspace & Toolchain

- **FR-001**: The repository SHALL be organized as a single pnpm workspace containing exactly three first-level packages per the master plan structure: `apps/api` (backend), `apps/web` (frontend), and `packages/shared-types` (shared contracts).
- **FR-002**: Each of the three packages SHALL exist as a bootable minimal skeleton so the workspace commands operate end-to-end before any feature work begins.
- **FR-003**: A single command SHALL start `apps/api` and `apps/web` concurrently in development mode with combined, distinguishable output.
- **FR-004**: Single commands SHALL exist to run typecheck, lint, test, and build across all packages, orchestrated by Turborepo so unchanged packages are skipped via caching.
- **FR-005**: The exact runtime version (Node.js 20 LTS line) and package-manager version SHALL be pinned in the repository and enforced, so all developers and CI use identical toolchain versions.
- **FR-006**: The shared contracts package (`packages/shared-types`) SHALL compile on demand and be importable from both applications as an empty-but-wired skeleton; populating its contents is X-01 scope.

### Local Data Services

- **FR-007**: A single command SHALL start PostgreSQL 16 and Redis 7 locally via Docker Compose, with health checks that report readiness.
- **FR-008**: Data-service persistence SHALL survive service restarts; a separate documented command SHALL reset all data-service state to clean.
- **FR-009**: Connection settings for local data services SHALL be provided exclusively through a committed environment template (`.env.example`) containing placeholders and documentation for every variable either application needs; no real secrets SHALL be committed.

### Quality Gate (CI)

- **FR-010**: GitHub Actions SHALL run typecheck → lint → test → build, in that order, on every pull request and every push to `main`.
- **FR-011**: A failure in any stage SHALL fail the pipeline, block merge, and identify the failing stage in the output. Blocking SHALL be technically enforced via branch protection on `main` that requires the pipeline's status checks to pass before a merge is possible.
- **FR-012**: CI SHALL use Turborepo remote caching so repeated pipelines skip unchanged work while remaining correct (cache keyed on inputs).

### Deployment Configuration

- **FR-013**: Railway project configuration for `apps/api` and Vercel project configuration for `apps/web` SHALL exist in the repository such that merging to `main` triggers automatic deployment of each application independently, targeting designated **non-production** environments. Production deployment configuration and cutover are X-08 scope.
- **FR-014**: Deployment SHALL only proceed from a passing pipeline; a red `main` SHALL NOT ship.

### Developer Experience

- **FR-015**: Setup documentation SHALL enable a new developer to go from clone to fully running local environment without assistance, listing prerequisites, install steps, start/reset commands, and troubleshooting for port conflicts.
- **FR-016**: All repository scripts SHALL behave identically on Windows, macOS, and Linux.

### Compliance Notes (per Master Plan §8)

- X-02…X-06 standards are authored as separate Phase 0 specs and do not bind this spec directly; however, the CI pipeline delivered here MUST be structured so coverage gates (X-02) can attach without redesign.
- This spec introduces no domain data, no API routes, and no AI calls; X-03/X-04/X-05 compliance therefore does not apply yet. X-06 applies insofar as the pipeline itself must be reliable and non-bypassable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new developer following setup documentation alone goes from fresh clone to fully running local environment in ≤ 15 minutes on a machine meeting documented prerequisites.
- **SC-002**: The single start command brings both applications and both data services to a healthy state within 2 minutes (warm machine).
- **SC-003**: The full quality gate (typecheck → lint → test → build) completes in ≤ 10 minutes on CI for a clean checkout.
- **SC-004**: 100% of deliberately broken commits introduced to test the gate are blocked from merging, with the failing stage correctly identified.
- **SC-005**: Every merge to `main` results in successful independent deployments of both applications to their designated non-production environments with zero manual steps (production cutover deferred to X-08).
- **SC-006**: Re-running the quality gate with no input changes completes ≥ 50% faster than a clean checkout run, demonstrating working cache reuse.
- **SC-007**: Zero secrets or real credentials are discoverable anywhere in the repository (verified by inspection and secret scanning).

## Assumptions

- Stack selections (pnpm + Turborepo monorepo, Node.js 20 LTS, Express/TypeScript backend, Next.js 15 frontend, PostgreSQL 16, Redis 7, GitHub Actions, Railway, Vercel) are fixed decisions from the approved Master Implementation Plan v1.2.0 and Waslah_Tech_Stack.md; this spec treats them as constraints, not options.
- GitHub repository, Railway, and Vercel accounts/projects exist or will be provisioned by the stakeholder; this spec covers repository-resident configuration only, not account creation or billing.
- Applications at this stage are minimal skeletons ("boots and serves a health response"); all product behavior arrives in later specs.
- Docker (or a compatible container runtime) is listed as a documented prerequisite for local data services rather than replaced by native installs.

## Dependencies

- None within the spec portfolio — X-00 is the root of the dependency graph.
- External: GitHub repository access; Railway and Vercel projects linked to the repository; container runtime available on developer machines.

## Out of Scope

- Contents of `packages/shared-types` (Capability enum, Zod schemas, money/pagination types) → **X-01**
- Testing strategy document and coverage gates → **X-02**
- Tenant isolation standard → **X-03**
- Financial correctness standard → **X-04**
- AI safety & guardrails standard → **X-05**
- Reliability & idempotency standard → **X-06**
- Database schemas and migrations (`Workspace`, `WorkspaceSettings`, `AuditLog`) → **DB-01**, **DB-14**
- Production deployment cutover, production infrastructure provisioning, secrets management, observability, alerting, runbooks → **X-08**
- Performance targets → **X-07**
- Any product feature, API route, UI page, or business logic
