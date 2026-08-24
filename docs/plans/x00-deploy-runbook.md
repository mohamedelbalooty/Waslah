# X-00 Runbook: Non-Production Deploy Setup (Railway + Vercel)

Status: **config-as-code committed; platform linking is a one-time operator step.**
Scope guard (Clarification Q1, research D7): staging/non-production only. Production domains and promotion are attached in X-08 — never before.

## 1. Railway — `apps/api` (T017)

Config file committed at `apps/api/railway.json` (build + start + `/healthz` healthcheck).

Dashboard steps (one-time):

1. <https://railway.com> → **New Project → Deploy from GitHub repo** → `mohamedelbalooty/Waslah`.
2. In the created service → **Settings**:
   - **Root Directory**: *(leave empty — repository root; the committed `buildCommand`/`startCommand` assume this)*.
   - Config-as-code is picked up from `apps/api/railway.json` automatically (Railway reads `railway.json` anywhere in the repo).
3. Create/select the **staging** environment (Project → Environments). Do NOT attach a production environment or domain.
4. Service → **Settings → Networking → Generate Domain** (this is the staging URL; port comes from `PORT` which the API reads).
5. Service → **Settings → Build/Deploy → Watch Paths**: add
   - `apps/api/**`
   - `packages/**`
6. Service → **Settings → Deployments → Triggers**: enable **Auto-deploy** on push to branch `main` (staging environment selected).

## 2. Vercel — `apps/web` (T018)

Config files committed: `apps/web/vercel.json`, plus ignored-build helper `scripts/vercel-ignore-api-only.sh`.

Dashboard steps (one-time):

1. <https://vercel.com> → **Add New → Project** → import `mohamedelbalooty/Waslah`.
2. Project → **Settings → General → Root Directory**: set to `apps/web`.
3. Framework auto-detects as Next.js (from `apps/web/vercel.json`). No build overrides needed.
4. **Staging scoping**: production domain stays unassigned. Use the default `*.vercel.app` deployment domain for branch `main` as the staging surface. Optionally create a distinct Vercel **Environment** named `staging` later (X-08 decides promotion flow).
5. **Ignored Build Step** (Settings → Git): paste `sh scripts/vercel-ignore-api-only.sh`
   - Effect: pushes touching only `apps/api/**` skip web builds (deploy independence, US4 scenario 2).
6. **Watch Paths** (Settings → Git) as belt-and-braces alongside the script:
   - `apps/web/**`
   - `packages/**`

## 3. GitHub repository settings

### Branch protection on `main` (T015) — contracts/ci-pipeline.md

> **Status: deferred (stakeholder decision 2026-08-24).** GitHub Free does not include branch
> protection/rulesets for private repositories (API returns HTTP 403). Apply the settings below
> after upgrading the account to GitHub Pro/Team or making the repository public. Until then,
> FR-011's *technical* enforcement is inactive; the gate still runs and fails visibly on every
> PR and push.

Settings → Branches → Add branch protection rule (or equivalent **Ruleset**):

| Rule | Value |
|------|-------|
| Branch name pattern | `main` |
| Require a pull request before merging | optional at X-00 (team size); required checks below are mandatory |
| Required status checks | `typecheck`, `lint`, `test`, `build` (exact job names from `.github/workflows/ci.yml`) |
| Require branches to be up to date before merging | ✅ enabled |
- Force pushes / deletions are disabled implicitly by protection.

### Repository secrets (research D10)

Settings → Secrets and variables → Actions:

| Secret | Where to get it |
|--------|-----------------|
| `TURBO_TOKEN` | Vercel dashboard → Account Settings → Tokens (Vercel Remote Cache) |
| `TURBO_TEAM` | your Vercel team slug |

No deploy tokens: Railway/Vercel auth flows through their GitHub Apps.

## 4. Verification (S5/S6/T016/T019)

- S5 gate proof: throwaway PR with a deliberate type error → `typecheck` red, `lint/test/build` skipped, merge blocked → fix → four green checks.
- S6 ship path: merge green PR → Railway staging shows new API deployment, Vercel shows web deployment; follow-up API-only change redeploys Railway only; no production target touched.

Record evidence rows in `specs/001-infrastructure-foundation/validation-log.md`.
