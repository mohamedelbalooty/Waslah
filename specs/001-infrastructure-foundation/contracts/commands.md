# Contract: Root Command Surface

**Scope**: X-00 · All commands run from repository root via pnpm. Exit code `0` = success; any non-zero exit = failure (CI treats non-zero as stage failure).

## Commands

| Command | Behavior | Success criteria |
|---------|----------|------------------|
| `pnpm install` | Install exact dependency tree from lockfile using pinned pnpm | Completes without engine-manager mismatch errors |
| `pnpm dev` | Start `apps/api` and `apps/web` concurrently in watch mode via Turborepo; combined output tagged per package | Both apps respond locally (see health-endpoints.md) |
| `pnpm typecheck` | Turbo task across all packages | All packages type-clean |
| `pnpm lint` | ESLint + Prettier check across all packages | Zero lint/format violations |
| `pnpm test` | Vitest workspace projects across all packages | All tests pass, none skipped silently |
| `pnpm build` | Production build of all packages in dependency order (`shared-types` first) | Artifacts produced for all 4 packages |
| `pnpm db:up` | Start Docker Compose data services; waits for healthchecks | Both services report healthy |
| `pnpm db:reset` | Destroy volumes and restart services clean | Services healthy with empty data |

## Reserved (activated by later specs)

| Command | Activated by | Note |
|---------|--------------|------|
| `pnpm db:migrate` | DB-01 / DB-14 | Script stub may exist but must fail with an explicit "no migrations yet" message until then — Phase 0 checkpoint exercises it once DB specs land |

## Cross-platform rules

- No command may require a POSIX-only shell construct; everything is expressed as npm-script-compatible entries executed by pnpm/Turbo.
- Windows PowerShell, macOS zsh/bash, and Linux bash must all produce identical outcomes (FR-016).
