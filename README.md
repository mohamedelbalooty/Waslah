# Waslah — AI Revenue Guardian

Multi-tenant SaaS monorepo (pnpm workspaces + Turborepo).

| Package | Purpose | Port (dev) |
|---------|---------|------------|
| `apps/api` | Express 4 API skeleton (`GET /healthz`) | 4000 |
| `apps/web` | Next.js 15 web skeleton | 3000 |
| `packages/shared-types` | Shared domain contracts (populated by X-01) | — |
| `packages/config` | Shared ESLint / Prettier / tsconfig bases | — |

## Prerequisites

- **Node.js 20 LTS** (required range `>=20 <21`, enforced via `engines` + `.npmrc`).
  - Recommended: install via [nvm-windows](https://github.com/coreybutler/nvm-windows) / nvm / fnm, then `nvm use 20`.
  - Enable **Corepack** so the exact pinned pnpm is used: `corepack enable` (Corepack ships with Node; it reads `"packageManager"` in `package.json`).
- **Docker Desktop** (or a compatible OCI runtime) — required only for data services (`pnpm db:up`), not for booting the apps.
- **Git**.

## Quick start

```sh
corepack enable          # once per machine: activates the pinned pnpm
pnpm install             # installs the exact dependency tree from the lockfile
pnpm db:up               # starts PostgreSQL 16 + Redis 7 (requires Docker)
pnpm dev                 # boots api (:4000) and web (:3000) with watch mode
```

Then:

- API health check → <http://localhost:4000/healthz> returns `200 {"status":"ok"}`
- Web root → <http://localhost:3000/> renders a page containing **Waslah**

Environment variables: copy `.env.example` to `.env` (placeholders are safe local defaults and work with zero edits). Never commit real credentials.

## Commands

| Command | Behavior |
|---------|----------|
| `pnpm dev` | Start both apps in watch mode via Turborepo |
| `pnpm build` | Production build of all packages (shared-types first) |
| `pnpm typecheck` | TypeScript strict check across all packages |
| `pnpm lint` | ESLint + Prettier check across all packages |
| `pnpm test` | Vitest across all packages |
| `pnpm db:up` | Start Docker Compose data services; succeeds only when healthy |
| `pnpm db:reset` | Destroy data volumes and restart clean |
| `pnpm db:migrate` | Reserved — fails loudly until the DB specs land |

## Stopping

`pnpm dev` stops with `Ctrl+C`. Data services keep running in the background; stop them with:

```sh
docker compose down        # keeps data volumes
docker compose down -v     # also destroys data (= pnpm db:reset)
```

## Resetting to a clean state

```sh
docker compose down -v     # wipe data volumes
rm -rf node_modules        # optional: wipe dependencies
pnpm install
```

## Troubleshooting

**Port already in use**
- API port 4000 busy → set `PORT` in `.env` (e.g. `PORT=4100`) or stop the process holding it:
  - Windows: `Get-NetTCPConnection -LocalPort 4000 -State Listen` then `taskkill /PID <pid> /F`
  - macOS/Linux: `lsof -ti :4000 | xargs kill`
- Web port 3000 busy → run `pnpm --filter @waslah/web dev -- -p 3100`
- Postgres 5432 / Redis 6379 busy → stop local services or edit host-port mappings in `docker-compose.yml`.

**Wrong Node version (`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` or engine errors on install)**

The repo pins Node `>=20 <21`. A globally installed standalone pnpm built for newer Node can shadow Corepack. Fix:

```sh
nvm use 20            # switch to Node 20
npm rm -g pnpm        # remove conflicting standalone pnpm (if present)
corepack enable       # shim pnpm to the version pinned in package.json
pnpm --version        # must print 9.15.9
```

**Docker not running**

`pnpm db:up` fails unless the Docker daemon/daemon desktop app is running. Start Docker first.

**Turborepo stale cache**

Force fresh runs with `pnpm exec turbo <task> --force` if cache results look wrong.

## Cross-platform notes

All commands are npm-script compatible (no POSIX-only shell constructs) and verified on Windows PowerShell; they behave identically on macOS/Linux shells (FR-016). Line endings: Prettier enforces LF in-repo (`endOfLine: "lf"`); let Git handle checkout conversion via your normal `core.autocrlf` settings.

## Deployment (non-production)

- `apps/api` → Railway (staging environment), auto-deploy on merge to `main`, watch paths `apps/api/**` + `packages/**`.
- `apps/web` → Vercel staging project, auto-deploy on merge to `main`, watch paths `apps/web/**` + `packages/**`.
- Production domains/environments are deliberately NOT attached until X-08.
