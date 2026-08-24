# X-00 Validation Log (quickstart evidence)

Measured results against `specs/001-infrastructure-foundation/quickstart.md` scenarios.
Environment: Windows 11, Docker 29.5.2, Node v20.19.4, pnpm 9.15.9 (Corepack).
Repo: github.com/mohamedelbalooty/Waslah (private, GitHub Free).

| # | Scenario | Result | Evidence / measured time | Budget |
|---|----------|--------|--------------------------|--------|
| S1 | Fresh clone → running (SC-001) | **PASS** | real fresh clone to temp dir: clone 0.7s + `pnpm install` 148s + dev boot → `/healthz` `200 {"status":"ok"}` and web root contains `Waslah`; ≈ 3–4 min end-to-end | ≤ 15 min ✅ |
| S2 | Warm start healthiness (SC-002) | **PASS** | warm `pnpm db:up` healthy in ~10s; endpoints answering immediately after `pnpm dev` (US1 checkpoint + US2 measurements) | ≤ 2 min ✅ |
| S3 | Persistence across restart | **PASS** | scratch row + Redis key survived stop/start; restart-to-healthy 10.5s | — |
| S4 | Deterministic reset | **PASS** | `db:reset` → data gone (`to_regclass` empty, key gone), services healthy again in 10.4s | — |
| S5 | Broken commit blocked (SC-004) | **PARTIAL** | PR #1: deliberate type error → `typecheck` failed with exactly the injected error, `lint/test/build` skipped ([red run](https://github.com/mohamedelbalooty/Waslah/actions/runs/32717542451)); fix → all four green ([green run](https://github.com/mohamedelbalooty/Waslah/actions/runs/32717693390)); *merge-button enforcement deferred with T015 (GitHub Free plan)* | — |
| S6 | Green merge ships non-prod (SC-005) | **PENDING** | config-as-code committed (railway.json, vercel.json, ignore-build script); Railway/Vercel project linking + auto-deploy enablement are one-time operator steps — docs/plans/x00-deploy-runbook.md §1–§2 | — |
| S7 | Cache speedup (SC-006) | **PASS** | full gate cold 86.1s vs warm 7.1s → warm = **8%** of cold (≥50% faster required); remote-cache `FULL TURBO` observable in CI once `TURBO_TOKEN`/`TURBO_TEAM` secrets are added (runbook §3) | ≥50% ✅ |
| S8 | Secret hygiene (SC-007) | **PASS** | `.env.example` placeholders only; credential-shape scan (sk-/AKIA/ghp_/xox/AIza/private-key blocks) clean; secret-shaped assignments only pre-existing skill boilerplate placeholders in `.agents/skills/`; no tracked `.env`; no key/cert files | — |

## CI on `main`

- First run (pre-lint-fix commit) failed at `lint` with downstream stages skipped — proving failure attribution and skip semantics.
- After fix: [run 32717243129](https://github.com/mohamedelbalooty/Waslah/actions/runs/32717243129) — **typecheck ✓ lint ✓ test ✓ build ✓**, ~2min06s total wall time.
- SC-003 (full gate ≤ 10 min): **PASS** with large headroom.

## US1 checkpoint

- `pnpm dev` boots both apps via Turborepo; API `200 {"status":"ok"}` (exact contract body); web root renders marker `Waslah`.

## US2 checkpoint

- Both containers report `(healthy)` (pg_isready / redis-cli ping @5s intervals); S3/S4 executed live as tabulated above.

## Environment incident log

- Host port 5432 conflicted with unrelated container `axiomind-postgres` (another project). Stakeholder-approved swap during validation; restored healthy afterwards. Waslah compose fails loudly per data-model.md edge-case rule.
- Standalone global pnpm (built against Node ≥22) shadowed Corepack under Node 20 (`ERR_UNKNOWN_BUILTIN_MODULE node:sqlite`). Fixed via README troubleshooting path: `corepack enable`, standalone shim removed from precedence. Plain `pnpm` now resolves to the pinned 9.15.9 Corepack shim.
- Next.js-generated `next-env.d.ts` tripped `@typescript-eslint/triple-slash-reference` once a build had run; fixed by excluding the generated file in web eslint config and `.gitignore`.
- Branch protection API returned HTTP 403: GitHub Free does not include branch protection/rulesets for private repositories. Deferred by stakeholder decision; exact settings preserved in docs/plans/x00-deploy-runbook.md §3.
