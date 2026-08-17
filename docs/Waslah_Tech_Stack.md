# Waslah — Tech Stack & Infrastructure

One important correction built into this doc before the tables: **Vercel is the right call for the Next.js frontend, but not for the Express backend.** Vercel runs backend code as stateless serverless functions with execution time limits — that's a poor fit for BullMQ background workers (catalog sync, AI processing queue) which need to run as persistent, always-on processes, and for keeping warm DB/Redis connection pools for the WhatsApp webhook. I've split hosting accordingly below and explained why.

---

## 1. Monorepo Tooling

| Tool | Choice | Why |
|---|---|---|
| Package manager | **pnpm** | Fastest installs, strict dependency isolation, native workspace support — the standard choice for JS monorepos in 2026 |
| Build orchestration | **Turborepo** | Built by the Vercel team, zero-config with Next.js, remote build caching (huge CI time savings once the repo grows), simpler learning curve than Nx for a two-app repo |

### Repo structure
```
waslah/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express backend
├── packages/
│   ├── shared-types/        # Zod schemas + TS types shared by both apps (single source of truth)
│   ├── config/               # shared eslint, tsconfig, prettier configs
│   └── ui/                   # (optional, V2+) shared component primitives if a second frontend is ever added
├── docker-compose.yml         # local dev: postgres + redis + api
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Why `packages/shared-types` matters here specifically:** the backend spec already defines Zod schemas for every API request/response. Import those same schemas into the frontend for form validation and API client typing instead of hand-duplicating types — this is the single biggest practical win a monorepo gives you over two separate repos, and it directly prevents the frontend/backend drift that's the most common bug source in split-repo setups.

---

## 2. Backend — `apps/api`

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 LTS | |
| Framework | Express.js 4 + TypeScript | As specified |
| ORM | Prisma | Already the schema source of truth from the backend spec; generates types that feed `shared-types` |
| Database | PostgreSQL 15 | |
| Queue/jobs | Redis + BullMQ | Catalog sync, AI processing, analytics aggregation — all need to run outside the request/response cycle |
| Validation | Zod | Shared with frontend via `shared-types` |
| Auth | jsonwebtoken + bcrypt | Backend owns auth; frontend consumes it (see Section 3 on why not NextAuth) |
| AI | `@anthropic-ai/sdk` | Wasel agent orchestration |
| Logging | Pino + pino-http | Structured JSON logs, required for the observability NFRs in the SRS |
| Security | Helmet, cors, express-rate-limit | |
| File handling | Multer + Papaparse | Product CSV import |
| Testing | Vitest + Supertest | |

This matches the earlier Backend Implementation Spec exactly — no changes there.

---

## 3. Frontend — `apps/web`

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router), TypeScript | As specified |
| Styling | Tailwind CSS | As specified |
| Components | shadcn/ui | As specified — Radix-based, unstyled-by-default primitives that pair naturally with Tailwind, and since you own the component code (not an npm dependency), it's easy to adapt for RTL Arabic layouts, which a pre-packaged component library often fights you on |
| Icons | lucide-react | Ships as shadcn/ui's default icon set, already available in this environment's component library too |
| Server-state / data fetching | **TanStack Query (React Query)** | The dashboard, inbox, and orders screens are all server-data-heavy with real-time-ish needs (new messages, order status). React Query gives you caching, background refetch, and optimistic updates without hand-rolling loading/error state everywhere |
| Client/UI state | **Zustand** | Lightweight, for local UI state only (sidebar open/closed, active filters, modal state) — deliberately kept separate from server state so the two aren't tangled |
| Forms | React Hook Form + `@hookform/resolvers/zod` | Reuses the same Zod schemas from `shared-types` for both client-side and server-side validation |
| Charts | Recharts | Revenue/analytics dashboard (Section 06 of the SRS) |
| i18n / RTL | **next-intl** | The SRS's NFRs require full Arabic RTL from MVP, not retrofitted — next-intl handles locale routing and RTL-aware layouts cleanly in the App Router, better than rolling your own |
| Auth (client side) | Custom auth context + httpOnly cookie, **not NextAuth** | Your Express backend already owns the full auth flow (JWT issuing, refresh, bcrypt). NextAuth is built to *own* the auth flow itself and fights you when you already have a backend doing that job — you'd end up either bypassing most of what NextAuth offers or duplicating logic. A thin custom `AuthProvider` that calls your existing `/auth/*` endpoints and stores the token in an httpOnly cookie (set via a Next.js route handler, not client JS, to avoid XSS exposure) is simpler and gives you one source of truth |
| E2E testing | Playwright | |

---

## 4. Docker

| Component | Approach |
|---|---|
| `apps/api/Dockerfile` | Multi-stage build: `node:20-alpine` deps → build → runtime. This is the deployable artifact for the backend. |
| `apps/api` worker process | Same image, different start command (`node dist/jobs/worker.js` vs `node dist/server.js`) — deploy as a second service from the same Dockerfile rather than maintaining two images |
| `docker-compose.yml` (local dev only) | `postgres:15-alpine`, `redis:7-alpine`, `api` service, optionally a `worker` service. Run `apps/web` with plain `next dev` outside Docker for faster local iteration — containerizing the frontend for local dev just adds hot-reload friction with no real benefit until you're testing an actual prod build |
| `apps/web/Dockerfile` | Not needed if deploying to Vercel — Vercel builds Next.js natively from the repo. Skip this unless you later need a non-Vercel frontend deployment target |

---

## 5. Hosting

| Component | Where | Why |
|---|---|---|
| Frontend (`apps/web`) | **Vercel** | Purpose-built for Next.js — ISR, edge functions, image optimization, automatic preview deployments per PR. This part of your instinct was exactly right. |
| Backend API (`apps/api`) | **Railway** (recommended) or Render/Fly.io as alternatives | Deploys directly from the Dockerfile in the monorepo, supports genuinely persistent processes (the API server *and* the BullMQ worker as two services from one repo), and has managed Postgres/Redis add-ons so you're not stitching together three different vendors for MVP. Render and Fly.io are reasonable alternatives if you later need more infra control. |
| Database | Railway-managed Postgres, or **Neon** if you want serverless Postgres with branching (handy for preview-environment databases per PR) | |
| Redis (BullMQ) | Railway Redis add-on, or **Upstash** if you want serverless/pay-per-request Redis | |
| File/object storage | **Cloudflare R2** | S3-compatible API (so the S3 client code in the backend spec works unchanged) but no egress fees — meaningfully cheaper than AWS S3 for an early-stage product serving media to end customers |

**Bottom line on your original ask:** keep Vercel for `apps/web` exactly as planned. For `apps/api`, use the Docker setup you already want, but deploy that container to Railway rather than Vercel — it's the same Docker artifact, just hosted somewhere built to run it as a long-lived service.

---

## 6. Suggested Additions

Things that aren't in your list but directly serve this specific project:

| Addition | Why it earns its place here |
|---|---|
| **GitHub Actions CI** | Lint + typecheck + test on every PR, using Turborepo's remote caching so CI stays fast as the repo grows. Non-negotiable given the AI guardrail tests (Section 9 of the backend spec) — those must run automatically, not rely on someone remembering to run them locally. |
| **Sentry** (frontend + backend) | Given the AI agent sends messages autonomously to real customers, silent failures are the single riskiest failure mode in this whole product. Error tracking on both apps, with the `LlmCall`/`ToolExecution` context attached to backend errors, turns a guardrail failure from "we found out from an angry merchant" into "we got paged." |
| **PostHog** | Self-hostable, and doubles as both product analytics (which dashboard screens owners actually use) and feature flags (useful for the shadow-mode → live-mode rollout already described in the backend spec's build order) |
| **Zod-to-OpenAPI** (or consider **tRPC** instead of REST) | Worth a genuine design decision, not just a footnote: since this is a TypeScript monorepo with a Zod-based backend, tRPC would give you end-to-end type safety between `apps/api` and `apps/web` without hand-maintaining a REST contract at all — arguably a better fit than plain REST for exactly this stack. I kept the backend spec as REST+Express since that's what was explicitly requested and it's the safer, more broadly-understood default if you ever add non-Next.js API consumers (a future mobile app, third-party integrations) — but if `apps/web` stays the only API consumer for the foreseeable future, tRPC is worth reconsidering before you've written 40 endpoints by hand. |
| **Doppler** (later, not MVP) | Once you have local + preview + staging + production environments, plain `.env` files and per-platform dashboards get error-prone. Not needed for MVP — Vercel's and Railway's built-in env var UIs are enough at this stage — but worth planning for before the environment count grows. |

---

## 7. Summary Table

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Backend | Node.js 20, Express, TypeScript, Prisma, PostgreSQL, Redis, BullMQ |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, next-intl |
| AI | Anthropic SDK (Claude) |
| Containerization | Docker (backend + worker only) |
| Frontend hosting | Vercel |
| Backend hosting | Railway (Docker deploy) |
| Database hosting | Railway Postgres or Neon |
| Redis hosting | Railway or Upstash |
| Object storage | Cloudflare R2 |
| CI/CD | GitHub Actions + Turborepo remote cache |
| Monitoring | Sentry, PostHog |
