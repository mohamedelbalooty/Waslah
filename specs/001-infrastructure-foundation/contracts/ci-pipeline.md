# Contract: CI Pipeline & Branch Protection

**Scope**: X-00 · Defines the automation contract that FR-010…FR-014, US3/US4, and the branch-protection clarification (Q2) are validated against.

## Pipeline definition (`.github/workflows/ci.yml`)

| Aspect | Contract |
|--------|----------|
| Triggers | `pull_request` targeting `main`; `push` to `main` |
| Stage order (enforced via `needs`) | `typecheck` → `lint` → `test` → `build` |
| Job names (exact, required-check candidates) | `typecheck`, `lint`, `test`, `build` |
| Runner | `ubuntu-latest` |
| Caching | Turborepo remote cache via `TURBO_TOKEN`/`TURBO_TEAM` secrets; cache keyed on task inputs |
| Failure semantics | Any job failure fails the run; downstream stages are skipped (`needs` chain) |
| Artifact expectation | `build` produces build outputs for all 4 packages; no deploy occurs from a red run |

## Branch protection on `main` (applied once during setup)

| Rule | Value |
|------|-------|
| Required status checks | `typecheck`, `lint`, `test`, `build` |
| Branch up-to-date before merge | Enabled |
| Direct force pushes / deletions | Disabled |
| Effect | A red or missing check makes merging technically impossible (FR-011) |

## Deployment gating

| Aspect | Contract |
|--------|----------|
| Trigger | Successful run completion on `main` only |
| Targets | Non-production environments: Railway staging env (`apps/api`), Vercel staging project/alias (`apps/web`) |
| Independence | Railway watches paths under `apps/api/**` + shared packages; Vercel watches `apps/web/**` + shared packages — an API-only change must not redeploy web and vice versa |
| Red-main rule | No deployment may originate from a failed pipeline run |

## Auditability

Each stage's outcome is individually visible as a named check, so "which stage failed" (FR-011) is answerable from the checks list without reading logs.
