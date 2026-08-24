# Waslah AI Revenue Guardian — Master Implementation Plan

**Version**: 1.2.0
**Date**: 2026-08-21
**Status**: Approved
**Constitution**: v1.0.0
**Authority**: `Waslah_AI_Revenue_Guardian_SRS.md` (V2.1) → this plan → individual specs → tasks → implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Key Decisions](#2-key-decisions)
3. [Architecture Overview](#3-architecture-overview)
4. [Specification Portfolio](#4-specification-portfolio)
5. [Build Order — MVP (Days 1–65)](#5-build-order--mvp-days-165)
6. [V2 Waves (Months 4–8)](#6-v2-waves-months-48)
7. [Dependency Matrix](#7-dependency-matrix)
8. [Cross-Cutting Standards](#8-cross-cutting-standards)
9. [Spec Kit Workflow](#9-spec-kit-workflow)
10. [Verification Checklist](#10-verification-checklist)
11. [Files to Create](#11-files-to-create)
12. [Status Tracking](#12-status-tracking)

---

## 1. Executive Summary

Waslah AI Revenue Guardian is a **multi-tenant SaaS platform** that helps Arabic-market e-commerce merchants **protect and grow their revenue** through AI-powered WhatsApp sales automation, smart attribution, and margin protection.

### Core Product Rules

- **Revenue-first**: every capability must have a clear relationship to revenue generation, recovery, margin protection, or reliable measurement of those outcomes
- **Tenancy**: every resource belongs to exactly one Workspace; tenant isolation is enforced at the data layer, not just the API
- **Attribution**: deterministic only — never delegated to AI; computed by `src/core/attribution.ts`
- **Money precision**: `Decimal(14,2)` everywhere; half-up rounding at display only
- **AI cost cap**: hard limit of `$0.05/conversation`; alert fires at `$0.04`
- **API prefix**: `api.waslah.ai/v1/` — no `/api/` prefix
- **MVP discipline**: V2 features must never be implemented in MVP specs; scope creep is a constitution violation
- **V3 out of scope**: Munjiz, Rased, Murshid, Thaqib, native mobile apps, ERP integrations are explicitly deferred
- **`src/core/**`**: pure, deterministic, I/O-free functions — 100% unit-testable
- **2FA and team invites**: V2 only; owner-only at MVP
- **OPEN-xx items**: must not be resolved by implementation agents — escalate to stakeholder

### Reviewed Against

- `Waslah_AI_Revenue_Guardian_SRS.md` (V2.1)
- `Backend_SRS.md` (v2.2)
- `Frontend_SRS.md` (v2.2)
- `Waslah_Feature_List.md`
- `Waslah_Tech_Stack.md`


---

## 2. Key Decisions

Key architectural and scope decisions made during plan review. Each decision is traced to a source.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Foundation stream naming | `X-00` (not "Phase 0") | Foundation specs are cross-cutting prerequisites, not a numbered phase. `X-00` makes clear they block everything else. |
| Shared Contracts timing | Phase 0 (before any BE/FE) | Constitution §XI: `shared-types` MUST precede backend and frontend work. Previously misplaced in MVP Hardening. |
| RBAC data split | DB-02 = MVP user/role/invite tables; DB-09 = V2 team mgmt extensions | Backend SRS requires RBAC data for MVP auth. CRM/team extensions are V2. |
| BE-16 Media Intelligence | V2 only | NEW-FR-023/024 tagged 🟡 V2 in Feature List. Voice transcription and image recognition are not MVP. |
| Cross-cutting X-specs timing | Authored in Phase 0, applied from Phase 1 onward | Constitution §IX, §XIII, §XIV: security, reliability, tenant isolation, and testing are first-class from day one — not a final hardening phase. |
| FE-05 Inbox scope | WhatsApp at MVP; Instagram/Messenger added in V2-E | Feature List and SRS: WhatsApp inbox is an MVP dependency for Wasel. |
| BE-17 Analytics scope | Thin aggregation layer only | Backend SRS scopes analytics as queue-driven aggregation jobs, not a separate service. |
| DB-13 Analytics timing | Late V2 (after all domain data is stable) | Analytics snapshots depend on all domain tables existing. |
| PaymentPlan entity | Schema exists at MVP; V3 behavior only | SRS §09.1: "V3 consumer; model now". `status=DRAFT` convention until Munjiz (V3). |
| DB-14 AuditLog timing | MVP (not late V2) | NEW-FR-017 + Constitution §VIII: audit logging required from day one. `lib/audit.ts` ships in BE-01. |
| Phase 3 attribution | BE-08 = Attribution (MAR); BE-09 = Billing (V2) | Billing is V2-D. Attribution is MVP. Previously confused in draft. |
| Success-fee billing | V2-D only | Feature List tags success-fee billing as 🟡 V2. MVP has manual billing foundations only. |
| Core business logic | `src/core/**` = pure deterministic functions, zero I/O | Constitution §VII: attribution, margin, fees, billing must be 100% unit-testable. |
| Margin decisions | `core/marginGuard.ts`, deterministic bands | RES-15: margin decisions must not be AI-delegated. |
| API prefix | `api.waslah.ai/v1/` | SRS §04 + Constitution §X. No `/api/` prefix. All routes follow this. |
| Cost price visibility | Owner / Admin / Accountant roles only | NEW-SEC-001: cost price is confidential. Enforced in catalog API and Wasel context assembly. |

---

## 3. Architecture Overview

### System Diagram

```
                    ┌──────────────────────────────────┐
                    │         Merchant Browser         │
                    │   Next.js 15 (App Router, RTL)   │
                    └────────────────┬─────────────────┘
                                     │ HTTPS
                                     ▼
                         ┌───────────────────────┐
                         │   Vercel (Frontend)   │
                         │  api.waslah.ai/v1/*   │
                         └──────────┬────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
           ┌─────────────────┐          ┌──────────────────────┐
           │ Railway Backend │          │   BullMQ Workers     │
           │  Express + TS   │          │ (attribution, AI      │
           │  Prisma ORM     │          │  metering, notifs)   │
           └────────┬────────┘          └──────────┬───────────┘
                    │                              │
          ┌─────────┴─────────────────────────────┘
          ▼
┌──────────────────────────────────────────────────────┐
│                    Data Layer                         │
├────────────────┬──────────────┬──────────────────────┤
│  PostgreSQL 16 │   Redis 7    │   Cloudinary / S3    │
│  (Prisma ORM)  │  (BullMQ +   │  (product images,    │
│  multi-tenant  │   cache)     │   voice attachments) │
└────────────────┴──────────────┴──────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────┐
│                 External Services                     │
├──────────────────┬─────────────────┬─────────────────┤
│  WhatsApp Cloud  │  Gemini /       │  Fawry / COD   │
│  API (Meta)      │  Anthropic /    │  (payment       │
│                  │  OpenAI         │   gateway)      │
├──────────────────┼─────────────────┼─────────────────┤
│  Shopify /       │  Salla / Zid    │  Bosta / Aramex │
│  WooCommerce     │  (V2)           │  / SMSA (V2)   │
└──────────────────┴─────────────────┴─────────────────┘
```

### Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 15 (App Router) | RTL-first, Arabic + English via `next-intl` |
| UI Components | shadcn/ui + Radix UI | Design tokens, Waslah palette |
| State & Data | TanStack Query v5 | Server state; Zustand for UI state |
| Backend | Express.js + TypeScript | Monorepo: `apps/api` |
| ORM | Prisma v5 | `prisma/schema.prisma`; `Decimal(14,2)` for money |
| Database | PostgreSQL 16 | Multi-tenant; `workspaceId` on all domain tables |
| Queue | BullMQ + Redis 7 | Attribution, AI metering, notifications, webhooks |
| AI Provider | Gemini / Anthropic Claude / OpenAI (provider-abstracted) | `LLMProvider` interface; mock provider in CI |
| WhatsApp | Meta Cloud API | Webhook idempotency via `(provider, event_id)` |
| Payments | Fawry + COD | Additional providers in V2 |
| Auth | JWT (RS256) + refresh tokens | Workspace context in every middleware call |
| Hosting (BE) | Railway | Auto-deploy from `main` |
| Hosting (FE) | Vercel | Edge runtime for dashboard performance |
| CI/CD | GitHub Actions | Typecheck → lint → test → build → deploy |
| Observability | Sentry (errors) + structured logs | `requestId` propagation end-to-end |
| Shared Types | `packages/shared-types` | Zod schemas, TypeScript types, enums |

### Monorepo Structure

```
waslah/
├── apps/
│   ├── api/              # Express API + BullMQ workers
│   └── web/              # Next.js 15 app
├── packages/
│   └── shared-types/     # Zod schemas, TypeScript types, Capability enum
├── prisma/
│   └── schema.prisma     # Single schema, multi-tenant
├── docs/
│   └── plans/            # This file + individual spec plans
├── .specify/
│   └── memory/           # constitution.md, feature specs
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml    # postgres:16 + redis:7 for local dev
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 4. Specification Portfolio

**Total: 58 specifications** across 5 streams.

### Foundation (2 specs)

| ID | Name | Phase | Blocks |
|----|------|-------|--------|
| X-00 | Infrastructure & Repository Foundation | Pre-phase | Everything |
| X-01 | Shared Contracts (`packages/shared-types`) | Pre-phase | All BE + FE |

### Database (15 specs)

| ID | Name | Phase | Depends on | Blocks |
|----|------|-------|------------|--------|
| DB-01 | Core Platform & Multi-Tenancy | MVP | — | Almost everything |
| DB-02 | Authentication, Sessions & RBAC data | MVP | DB-01 | BE-02, BE-10 |
| DB-03 | Catalog & Inventory | MVP | DB-01 | BE-03, BE-06 |
| DB-04 | Customers & Conversations | MVP | DB-01, DB-02 | BE-04, BE-06 |
| DB-05 | Orders, Invoices & Payments | MVP | DB-03, DB-04 | BE-07 |
| DB-06 | AI & Agent Execution | MVP | DB-04 | BE-06, BE-08 |
| DB-07 | Attribution & Revenue | MVP | DB-04, DB-05, DB-06 | BE-08 |
| DB-08 | Billing & Subscriptions | V2-D | DB-07 | BE-09 |
| DB-09 | V2 Team, RBAC & Conversation Operations | V2-A | DB-01, DB-02, DB-04 | BE-10, BE-14, BE-18, FE-10 |
| DB-10 | Aaed / Follow-up | V2-B | DB-04, DB-06, DB-07, DB-12 | BE-12 |
| DB-11 | Hafeth / Margin Guard | V2-C | DB-03, DB-05, DB-09 | BE-13 |
| DB-12 | Integrations & Template Library | MVP* | DB-01 | BE-05, BE-12, BE-18 |
| DB-13 | Analytics Snapshots | V2-I | All domain DBs | BE-17 |
| DB-14 | Audit Log & Retention | **MVP** | DB-01 | BE-01 (`lib/audit.ts`) |
| DB-15 | Conversation AI State | MVP | DB-04 | DB-06, BE-06 |

> *DB-12 is partially MVP (Integration connection state, webhook dedup) and partially V2 (TemplateMessage library). BE specs gate feature behavior within the same DB spec.

### Backend (19 specs)

| ID | Name | Phase | Depends on |
|----|------|-------|------------|
| BE-01 | API Foundation (Express, middleware, observability, lib utilities) | MVP | X-00, X-01, DB-01, DB-14 |
| BE-02 | Authentication & Workspace | MVP | BE-01, DB-01, DB-02 |
| BE-03 | Catalog | MVP | BE-01, BE-02, DB-03 |
| BE-04 | Customers & Conversations | MVP | BE-01, BE-02, DB-04 |
| BE-05 | WhatsApp Integration | MVP | BE-01, BE-02, DB-04, DB-12 |
| BE-06 | Wasel AI (Sales Closer) | MVP | BE-01, BE-03, BE-04, BE-05, DB-06 |
| BE-07 | Orders, Invoices & Payments | MVP | BE-01, BE-03, BE-04, DB-05 |
| BE-08 | Attribution & Revenue | MVP | BE-06, BE-07, DB-07 |
| BE-09 | Billing & Subscriptions | V2-D | BE-08, DB-08 |
| BE-10 | RBAC & Team Management | V2-A | BE-02, DB-09 |
| BE-11 | Instagram & Facebook Messenger | V2-E | BE-01, BE-04, DB-12 |
| BE-12 | Aaed (Follow-up & Recovery) | V2-B | BE-04, BE-06, BE-08, DB-10 |
| BE-13 | Hafeth (Margin Guard) | V2-C | BE-07, DB-11 |
| BE-14 | CRM (Profiles, Notes, Segments) | V2-F | BE-04, DB-09 |
| BE-15 | Salla & Zid Commerce Sync | V2-G | BE-03, BE-07, DB-12 |
| BE-16 | Media Intelligence (Voice & Image) | V2-H | BE-05, BE-06, DB-06 |
| BE-17 | Analytics API & Aggregation | V2-I | BE-08, BE-09, DB-13 |
| BE-18 | Notifications & Template Library | V2-E* | BE-01, DB-04, DB-12 |
| BE-19 | Shipping Integrations (Bosta/Aramex/SMSA) | V2-J | BE-07, BE-08, DB-12 |

> *BE-18 is partially MVP (basic in-app/email alerts) and partially V2 (WhatsApp template library management).

### Frontend (15 specs)

| ID | Name | Phase | Depends on |
|----|------|-------|------------|
| FE-01 | Frontend Foundation (App Router, design system, RTL, i18n, API client) | MVP | X-00, X-01 |
| FE-02 | Authentication & Onboarding | MVP | FE-01, BE-02 |
| FE-03 | Owner Dashboard | MVP | FE-01, BE-08 |
| FE-04 | Product Catalog | MVP | FE-01, BE-03 |
| FE-05 | Unified Inbox (WhatsApp MVP → IG/Messenger V2) | MVP | FE-01, BE-04, BE-05 |
| FE-06 | Customer Profile | V2-F | FE-01, BE-14 |
| FE-07 | Orders & Payments | MVP | FE-01, BE-07 |
| FE-08 | Revenue Analytics | MVP (basic) / V2-I (full) | FE-01, BE-08, BE-17 |
| FE-09 | Integrations Hub | MVP (WA/Shopify) / V2 (Salla/Zid/IG) | FE-01, BE-05, BE-11, BE-15 |
| FE-10 | Team & RBAC | V2-A | FE-01, BE-10 |
| FE-11 | Aaed Dashboard | V2-B | FE-01, BE-12 |
| FE-12 | Hafeth Margin Guard | V2-C | FE-01, BE-13 |
| FE-13 | Billing & Subscription | V2-D | FE-01, BE-09 |
| FE-14 | CRM | V2-F | FE-01, FE-06, BE-14 |
| FE-15 | Settings & Administration | MVP (basic) / V2 (full) | FE-01, BE-02, BE-18 |

### Cross-Cutting Standards (7 specs)

| ID | Name | Authored | Applies to |
|----|------|----------|------------|
| X-02 | Testing Strategy | Phase 0 | All specs Phase 1 onward |
| X-03 | Tenant Isolation | Phase 0 | All DB + BE specs |
| X-04 | Financial Correctness | Phase 0 | Attribution, fees, money ops |
| X-05 | AI Safety & Guardrails | Phase 0 | Wasel, Aaed, any LLM caller |
| X-06 | Reliability & Idempotency | Phase 0 | Webhooks, queues, retries, DLQ |
| X-07 | Performance | Before MVP pilot | NFR targets from NEW-NFR-005 |
| X-08 | Release & Production Readiness | Before MVP pilot | Infra, secrets, alerting, runbooks |

> X-02 through X-06 are authored in Phase 0 and become mandatory compliance references for every downstream spec. They do not block spec authoring, but they **do block implementation sign-off**. Waiving any cross-cutting requirement requires a documented scope decision with a spec ID.

---

## 5. Build Order — MVP (Days 1–65)

### Phase 0 — Foundation (Days 1–5)

**Goal:** Monorepo boots, CI passes, shared-types build succeeds, DB migrates, cross-cutting standards authored.

| Task | Spec | Deliverable |
|------|------|-------------|
| 0.1 | X-00 | pnpm monorepo scaffold (Turborepo) |
| 0.2 | X-00 | Docker Compose: `postgres:16` + `redis:7` |
| 0.3 | X-00 | GitHub Actions CI: typecheck → lint → test → build |
| 0.4 | X-00 | Railway + Vercel project config |
| 0.5 | X-01 | `packages/shared-types`: Capability enum, Zod schemas, pagination types, money types |
| 0.6 | X-02 | Testing strategy doc (unit / integration / E2E layers, coverage gates, mock LLM provider) |
| 0.7 | X-03 | Tenant isolation standard: mandatory `workspaceId` filter checklist for all BE specs |
| 0.8 | X-04 | Financial correctness standard: money ops guide, `Decimal(14,2)` convention, rounding rules |
| 0.9 | X-05 | AI guardrail standard: grounding rules, confidence levels, cost cap enforcement, audit requirements |
| 0.10 | X-06 | Reliability standard: idempotency key patterns, DLQ requirements, retry policy |
| 0.11 | DB-01 | `Workspace`, `WorkspaceSettings` — tenancy root; Prisma migration `0001_core_tenancy` |
| 0.12 | DB-14 | `AuditLog` schema (append-only, immutable), retention metadata |

**Checkpoint**: `pnpm dev` boots both apps locally. `pnpm test` passes. `pnpm db:migrate` applies migrations. `shared-types` package builds and is importable.

**Parallel:** FE-01 can begin once X-00 and X-01 are complete.

---

### Phase 1 — Platform Core (Days 6–15)

**Goal:** Merchant registers → creates workspace → logs in → reaches application shell.

| Task | Spec | Deliverable |
|------|------|-------------|
| 1.1 | DB-02 | `User`, `Session`, `WorkspaceUser`, `WorkspaceRole` migration |
| 1.2 | DB-03 | `Product`, `ProductVariant`, `Category`, `InventoryLog` migration |
| 1.3 | DB-04 | `Customer`, `Conversation`, `Message`, `MessageAttachment` migration |
| 1.3b | DB-15 | `ConversationState` migration (1:1 with Conversation: intent, stage, confidence, escalation_reason, ai_summary, sentiment, next_best_action) |
| 1.4 | DB-12 | `Integration`, `WebhookEvent` (dedup key) migration (MVP portion) |
| 1.5 | BE-01 | Express app + middleware stack: `requestId`, `tenantContext`, error handler, response envelope |
| 1.6 | BE-01 | `lib/audit.ts` (append-only write to AuditLog, no reads) |
| 1.7 | BE-01 | `lib/money.ts` (Decimal(14,2) operations, half-up rounding) |
| 1.8 | BE-01 | `lib/idempotency.ts` (key pattern, Redis lock) |
| 1.9 | BE-01 | `lib/rbac.ts` (role check functions, capability map) |
| 1.10 | BE-02 | Registration, login, JWT (RS256) + refresh, logout |
| 1.11 | BE-02 | Workspace creation, tenant context middleware |
| 1.12 | FE-01 | Next.js 15 scaffold, `next-intl` RTL config (Arabic + English) |
| 1.13 | FE-01 | Design token system, shadcn/ui primitives, Waslah palette |
| 1.14 | FE-01 | TanStack Query client, API client wrapper, auth store (Zustand) |
| 1.15 | FE-02 | Login page, registration page |
| 1.16 | FE-02 | Workspace creation wizard (owner-only; team invite step hidden until V2-A) |

**Checkpoint**: Auth roundtrip works end-to-end. Workspace context enforced on every protected route. CI green on tenant isolation unit tests.

---

### Phase 2 — Commerce Foundation (Days 16–30)

**Goal:** Merchant manages catalog → receives WhatsApp message → creates order → processes payment.

| Task | Spec | Deliverable |
|------|------|-------------|
| 2.1 | DB-05 | `Order`, `OrderItem`, `Invoice`, `Payment`, `Refund` migration; `PaymentPlan` schema-only (V3 behavior) |
| 2.2 | BE-03 | Catalog CRUD: product create/read/update/delete, variants, categories |
| 2.3 | BE-03 | Inventory log, CSV import, Shopify/WooCommerce sync (MVP scope) |
| 2.4 | BE-04 | Conversation ingest, message persistence, assignment foundation, human takeover flag |
| 2.5 | BE-05 | WhatsApp webhook (idempotent by `event_id`), inbound/outbound message delivery |
| 2.6 | BE-05 | WhatsApp delivery status, retry queue, DLQ |
| 2.7 | BE-07 | Order state machine: draft → confirmed → shipped → delivered → cancelled |
| 2.8 | BE-07 | Invoice creation, Fawry payment link, COD order creation, payment webhook |
| 2.9 | FE-04 | Product list (search, filter, sort), product form, variants, inventory view, CSV import UI |
| 2.10 | FE-05 | Conversation list + thread view (WhatsApp only at MVP), human takeover toggle, composer |
| 2.11 | FE-07 | Order list, order detail, invoice view, payment status, COD state management |
| 2.12 | FE-09 | Integrations hub: WhatsApp connect, Shopify/WooCommerce (MVP scope only) |
| 2.13 | FE-15 | Settings shell: workspace profile, locale, currency, basic AI config (owner-only) |

**Checkpoint**: End-to-end trace: catalog product → WhatsApp message received → order created → Fawry payment link sent → payment confirmed. Webhook idempotency verified by replaying same event twice.

---

### Phase 3 — Wasel Revenue Loop (Days 31–50)

**Goal:** WhatsApp → Wasel AI → catalog → conversation → order → payment → attribution → MAR on dashboard.

| Task | Spec | Deliverable |
|------|------|-------------|
| 3.1 | DB-06 | `AgentConfig`, `LLMCall`, `ToolExecution` migration |
| 3.2 | DB-07 | `AttributionEvent` migration (append-only, reversal chain) |
| 3.3 | BE-06 | `core/wasel.ts`: intent classification, confidence tiers (HIGH/MEDIUM/LOW/REFUSE) |
| 3.4 | BE-06 | Catalog RAG retrieval (vector similarity via pgvector) |
| 3.5 | BE-06 | Response generation: brand context assembly, guardrails (no cost disclosure, no hallucinated catalog) |
| 3.6 | BE-06 | AI cost metering: `LLMCall` insert per request; alert at $0.04; hard-stop at $0.05 |
| 3.7 | BE-08 | `core/attribution.ts`: first-touch attribution, MAR computation |
| 3.8 | BE-08 | Attribution event on order payment confirmation |
| 3.9 | BE-08 | COD attribution on delivery confirmation webhook |
| 3.10 | BE-08 | Reversal on refund (immutable ledger + reversal record) |
| 3.11 | FE-03 | Owner dashboard: MAR card, Revenue Recovered card, Conversations card, Margin Guard card |
| 3.12 | FE-03 | Real-time WebSocket updates for dashboard metrics |
| 3.13 | FE-03 | Quick actions: create order, open conversation |
| 3.14 | FE-08 | Analytics MVP: MAR trend chart, AI resolution rate, avg response time, active conversations |

**Checkpoint (MVP Pilot Readiness)**:
- Wasel handles a real WhatsApp conversation autonomously ✓
- Attribution event created and persisted for a paid order ✓
- MAR card shows correct value on owner dashboard ✓
- Human can take over at any point without data loss ✓
- AI cost stays under $0.05/conversation (metered) ✓
- Tenant A cannot read Tenant B's data (X-03 audit) ✓
- All `src/core/**` functions have ≥90% coverage ✓

---

### Phase 4 — MVP Hardening (Days 51–65)

**Goal:** Production-ready MVP. Pilot merchants can onboard safely.

| Task | Spec | Deliverable |
|------|------|-------------|
| 4.1 | X-07 | Performance acceptance: AI first-byte `<3s`, dashboard load `<2s`, API p95 `<500ms` |
| 4.2 | X-08 | Railway production deploy, Vercel production deploy |
| 4.3 | X-08 | Sentry configured (errors + performance), structured log shipping |
| 4.4 | X-08 | Secrets in Railway env (no secrets in codebase), runbooks written |
| 4.5 | X-03 | Tenant isolation audit: verify `workspaceId` filter on every Prisma query across Phase 1–3 specs |
| 4.6 | X-04 | Financial correctness audit: attribution math, money precision, state machine transitions |
| 4.7 | X-05 | AI guardrail audit: confidence levels enforced, cost cap tested, grounding verified |
| 4.8 | X-06 | Reliability audit: webhook idempotency proven, DLQ connected, retry policies tested |
| 4.9 | X-02 | Final coverage check: ≥90% on `src/core/**`; integration test for full revenue loop; E2E for auth + order + attribution |

**Checkpoint**: All X-spec compliance checklists pass. Pilot merchant can complete registration → first attributed sale without engineering support.

---

## 6. V2 Waves (Months 4–8)

> **V2 Gate**: MVP Revenue Loop is stable and at least one pilot merchant is live.

> **Execution rule**: V2 waves are strictly sequential. Complete one wave (all specs `Complete`) before starting the next.

### Wave V2-A — Team Foundation
**Dependency chain**: `DB-09 → BE-10 → FE-10`
RBAC roles (Owner / Admin / Agent / Accountant), invitations, conversation assignment, labels, auto-assignment rules, escalation rules.
**Gate**: Agents can claim conversations; Manager can reassign; RBAC enforced server-side; invitation email delivered; labels and assignment rules functional.

### Wave V2-B — Aaed Follow-up & Recovery
**Dependency chain**: `DB-10 → BE-12 → FE-11`
Abandonment detection, follow-up cadence (RES-05: 48h min interval, 3-attempt cap), recovery attribution.
Requires DB-12 TemplateMessage library (from BE-18 template portion).
**Gate**: Aaed respects cadence rules; attribution recorded for recoveries; opt-out persisted.

### Wave V2-C — Hafeth Margin Guard
**Dependency chain**: `DB-11 → BE-13 → FE-12`
`core/marginGuard.ts` deterministic band evaluation, exception workflow, owner approval via WebSocket + FCM push, 1-hour auto-reject.
**Gate**: All RES-15 decision bands tested; 1h auto-reject functional; `MarginDecision` in AuditLog.

### Wave V2-D — Billing Automation
**Dependency chain**: `DB-08 → BE-09 → FE-13`
Subscription lifecycle (RES-20), usage counter, overage policy (RES-16), `core/fees.ts` success-fee engine, dispute hold (RES-09).
**Note**: VAT (NEW-FR-013) blocked by OPEN-02 — do not implement until stakeholder resolves.
**Gate**: Fee recomputed from `AttributionEvent` ledger; state machine tests pass; dispute hold functional.

### Wave V2-E — Multi-Channel (Instagram + Messenger)
**Dependency chain**: `DB-12 (TemplateMessage) → BE-11 + BE-18 → FE-05 (enhanced) + FE-09 (enhanced)`
Instagram DM + Facebook Messenger adapters (NEW-FR-022), WhatsApp template library management (NEW-FR-019).
**Gate**: Round-trip message in sandbox; rate-limit handling; delivery receipt; template approval state machine.

### Wave V2-F — CRM & Customer Intelligence
**Dependency chain**: `DB-09 (CRM ext) → BE-14 → FE-06 → FE-14`
Customer profiles, notes, segments, `core/segmentation.ts` auto-segmentation.
**Gate**: Auto-segment computed on sample data; customer LTV/AOV shown; segment used in Aaed cadence.

### Wave V2-G — Salla/Zid Commerce Integrations
**Dependency chain**: `BE-15 → FE-09 (Salla/Zid panels)`
OAuth connect, bidirectional product/order sync, conflict log, manual resolution UI (NEW-FR-029).
**Competitive urgency**: Submit Salla App Store listing before Salla ships native AI chat.
**Gate**: Bidirectional sync tested; conflict detection functional; sync status surfaced in FE-09.

### Wave V2-H — Media Intelligence
**Dependency chain**: `BE-16 → BE-06 (enriched) → FE-05 (voice/image UI)`
Voice transcription (Arabic / EN / Arabizi), image-to-catalog matching (NEW-FR-023/024). Provider-abstracted; mock provider in CI.
**Gate**: Voice transcript injected as `VOICE` message type; image match returns grounded product above threshold.

### Wave V2-I — Analytics
**Dependency chain**: `DB-13 → BE-17 → FE-08 (V2 full)`
Revenue by agent / channel / product / segment; margin dashboard; AI cost/conversation tracker; NRR + plan upgrade trend; Platform Health tab.
**Gate**: All Financial Model KPI targets surfaced in UI; CSV export functional.

### Wave V2-J — Shipping Integrations
**Dependency chain**: `BE-19 → BE-08 (enriched)`
Bosta / Aramex / SMSA delivery webhooks → COD attribution trigger (NEW-FR-011, RES-17). 7-day reversal window on delivery confirmation.
**Gate**: COD attribution event fires on delivery confirmation; reversal fires on non-delivery.

### Wave V2-K — Final Hardening
Audit log retention schedules, performance re-validation at V2 load (650-merchant capacity), Sentry fully wired, Railway autoscale configured, V2 pilot readiness checklist.

---

## 7. Dependency Matrix

| Spec | Depends on | Blocked by start of |
|------|------------|---------------------|
| DB-01 | — | DB-02, DB-03, DB-04, DB-12, BE-01 |
| DB-02 | DB-01 | DB-09, BE-02, BE-10 |
| DB-03 | DB-01 | DB-05, DB-11, BE-03 |
| DB-04 | DB-01, DB-02 | DB-05, DB-06, DB-10, BE-04 |
| DB-05 | DB-03, DB-04 | DB-07, DB-08, BE-07 |
| DB-06 | DB-04 | DB-07, BE-06 |
| DB-07 | DB-04, DB-05, DB-06 | DB-08, BE-08 |
| DB-08 | DB-07 | BE-09 |
| DB-09 | DB-01, DB-02, DB-04 | BE-10, BE-14, BE-18 |
| DB-10 | DB-04, DB-06, DB-07, DB-12 | BE-12 |
| DB-11 | DB-03, DB-05, DB-09 | BE-13 |
| DB-12 | DB-01 | BE-05, BE-11, BE-12, BE-18 |
| DB-13 | All domain DBs | BE-17 |
| DB-14 | DB-01 | BE-01 |
| DB-15 | DB-04 | DB-06, BE-06 |
| BE-01 | X-00, X-01, DB-01, DB-14 | All BE specs |
| BE-02 | BE-01, DB-02 | BE-03 through BE-19 |
| BE-03 | BE-01, BE-02, DB-03 | BE-06, BE-15 |
| BE-04 | BE-01, BE-02, DB-04 | BE-05, BE-06, BE-12, BE-14 |
| BE-05 | BE-01, BE-02, DB-04, DB-12 | BE-06 |
| BE-06 | BE-01, BE-03, BE-04, BE-05, DB-06 | BE-08, BE-16 |
| BE-07 | BE-01, BE-03, BE-04, DB-05 | BE-08, BE-13, BE-19 |
| BE-08 | BE-06, BE-07, DB-07 | BE-09, BE-12, BE-17 |
| BE-09 | BE-08, DB-08 | FE-13 |
| BE-10 | BE-02, DB-09 | FE-10 |
| BE-11 | BE-01, BE-04, DB-12 | FE-05 (V2), FE-09 (V2) |
| BE-12 | BE-04, BE-06, BE-08, DB-10 | FE-11 |
| BE-13 | BE-07, DB-11 | FE-12 |
| BE-14 | BE-04, DB-09 | FE-06, FE-14 |
| BE-15 | BE-03, BE-07, DB-12 | FE-09 (Salla/Zid) |
| BE-16 | BE-05, BE-06, DB-06 | FE-05 (voice/image) |
| BE-17 | BE-08, BE-09, DB-13 | FE-08 (V2 full) |
| BE-18 | BE-01, DB-04, DB-12 | FE-11, FE-12, FE-15 |
| BE-19 | BE-07, BE-08, DB-12 | FE-09 (shipping) |
| FE-01 | X-00, X-01 | All FE specs |
| FE-02 | FE-01, BE-02 | FE-03 through FE-15 |
| FE-03 | FE-01, BE-08 | — |
| FE-04 | FE-01, BE-03 | — |
| FE-05 | FE-01, BE-04, BE-05 | — |
| FE-06 | FE-01, BE-14 | FE-14 |
| FE-07 | FE-01, BE-07 | — |
| FE-08 | FE-01, BE-08 (MVP), BE-17 (V2) | — |
| FE-09 | FE-01, BE-05, BE-11, BE-15 | — |
| FE-10 | FE-01, BE-10 | — |
| FE-11 | FE-01, BE-12 | — |
| FE-12 | FE-01, BE-13 | — |
| FE-13 | FE-01, BE-09 | — |
| FE-14 | FE-01, FE-06, BE-14 | — |
| FE-15 | FE-01, BE-02, BE-18 | — |

---

## 8. Cross-Cutting Standards

Every individual specification MUST include compliance notes for the applicable X-specs below.
X-spec compliance is a gate for implementation sign-off, not an afterthought.

### X-03 Tenant Isolation (Every DB + BE Spec)

- Every Prisma query on a domain table MUST include a `workspaceId` filter
- No query may join across tenant boundaries
- API middleware must extract and validate `workspaceId` from JWT on every request
- Tests must assert that a resource belonging to Workspace A is not accessible from Workspace B

### X-04 Financial Correctness (Every Financial Spec)

- All money stored as `Decimal(14,2)` — no floats
- All comparisons use `Decimal` comparison methods — no floating-point arithmetic
- Rounding applied at display layer only (half-up)
- Attribution math must be deterministic and reproducible from the `AttributionEvent` ledger
- `src/core/attribution.ts`, `src/core/fees.ts`, `src/core/marginGuard.ts` — zero I/O, 100% unit-testable

### X-05 AI Guardrails (Wasel + Any LLM Caller)

- Cost cap: hard stop at `$0.05/conversation`; alert at `$0.04`; model downgrade before violating
- Confidence tiers: HIGH (respond) / MEDIUM (respond with caveats) / LOW (hand off) / REFUSE
- Grounding: Wasel may only reference catalog data from the current workspace
- Prohibited: cost price disclosure to customer, hallucinated product details, margin data exposure
- Every LLM call must produce a `LLMCall` record (model, tokens, latency, cost estimate)

### X-06 Reliability (Every Webhook + Queue Spec)

- Webhook idempotency: `(provider, event_id)` unique constraint on `WebhookEvent`
- Replaying the same webhook must be a no-op (not a duplicate insert)
- All queue jobs must have: retry count, backoff policy, DLQ destination
- Long-running operations must update status atomically (no partial states on crash)

---

## 9. Spec Kit Workflow

Every capability in this plan is implemented by driving it through the Spec Kit pipeline:

```
MASTER PLAN (this document)
        |
        v  select next spec where ALL dependencies are COMPLETE
/speckit-specify   -> Feature spec: scope, out-of-scope, SRS refs, rules, API, acceptance criteria
        |
        v  review + approve spec with user
/speckit-clarify   -> Resolve ambiguities before planning (optional but recommended)
        |
        v
/speckit-plan      -> Technical plan: how to implement this spec
        |
        v  review + approve plan with user
/speckit-tasks     -> Atomic, dependency-ordered task list
        |
        v
/speckit-implement -> Execute tasks one by one
        |
        v
/speckit-converge  -> Verify no unbuilt work; surface gaps
        |
        v  update Status Tracking (Section 12)
SPEC COMPLETE -> unlock downstream specs
```

### Required Spec Header Fields

Every spec authored via `/speckit-specify` MUST declare:

| Field | Value |
|-------|-------|
| Spec ID | `BE-xx` / `DB-xx` / `FE-xx` / `X-xx` |
| Name | Human-readable name |
| Phase | `MVP` / `V2 (Wave V2-x)` |
| Status | `Draft` / `In Review` / `Approved` / `In Implementation` / `Complete` |
| Depends on | Comma-separated spec IDs |
| Blocks | Comma-separated spec IDs |
| SRS references | `NEW-FR-xxx`, `RES-xx`, `BR-xxx` (space-separated) |
| Constitution principles | e.g., `III, IV, VII` |

### Spec Authoring Rules

- A spec may only begin when ALL its declared dependencies are `Complete`
- A spec in status `In Implementation` blocks all downstream specs from starting
- Never author V2 specs for capabilities whose MVP prerequisites are not `Complete`
- Always tick X-03/X-04/X-05/X-06 compliance checklists during spec review
- OPEN-xx items found during spec authoring must be flagged and escalated — never resolved unilaterally

---

## 10. Verification Checklist

### Definition of Done (per spec)

- [ ] All SRS requirement IDs listed in spec header are implemented and tested
- [ ] X-03 tenant isolation: `workspaceId` filter on all Prisma queries; cross-tenant test fails correctly
- [ ] X-04 financial correctness: all money ops use `Decimal(14,2)`; rounding only at display
- [ ] X-05 AI guardrail: cost metered; confidence tier enforced; grounding verified (if AI)
- [ ] X-06 reliability: idempotency key present; DLQ wired; retry policy configured (if queue/webhook)
- [ ] Unit tests: ≥90% coverage on any `src/core/**` functions introduced
- [ ] Integration test: happy path + key failure path covered
- [ ] E2E test: user-facing flows covered (if FE spec)
- [ ] No OPEN-xx items resolved — all flagged for stakeholder

### MVP Pilot Readiness Gate

- [ ] Wasel handles a live WhatsApp conversation autonomously without human intervention
- [ ] `AttributionEvent` created for a paid order; `core/attribution.ts` produces correct MAR
- [ ] MAR card shows correct value on owner dashboard in real time
- [ ] Human takeover does not lose conversation state
- [ ] AI cost stays under $0.05/conversation (metered across 10 test conversations)
- [ ] Tenant A cannot read, write, or enumerate Tenant B's data (verified by X-03 audit)
- [ ] Webhook replay produces no duplicate orders or attribution events
- [ ] All Phase 0–3 X-spec compliance checklists pass
- [ ] Railway + Vercel production deploy succeeds and smoke tests pass
- [ ] Sentry receives a test error event; alerting fires correctly

### Business Constraint Verification

- [ ] `src/core/**` functions have zero `import` of database, HTTP, or queue modules
- [ ] All `Decimal(14,2)` columns confirmed in Prisma schema; no `Float` on money fields
- [ ] AI cost alert fires a log event when `$0.04` crossed in a conversation
- [ ] Cost price is not returned in any API response visible to Agent or Customer roles
- [ ] API routes begin with `/v1/` (no `/api/` prefix anywhere in route definitions)
- [ ] 2FA UI is not built at MVP; invite UI is hidden until V2-A completes
- [ ] V3 items (Munjiz, Rased, Murshid, Thaqib) do not appear in any MVP implementation

---

## 11. Files to Create

### Backend (`apps/api/`)

```
apps/api/
├── src/
│   ├── app.ts                     # Express app, middleware, router
│   ├── config.ts                  # Settings from env
│   ├── core/
│   │   ├── attribution.ts         # Deterministic MAR computation (pure, no I/O)
│   │   ├── marginGuard.ts         # Deterministic margin band evaluation (pure, no I/O)
│   │   ├── followUpPolicy.ts      # Aaed cadence rules: detection, intervals, caps (pure, no I/O) [V2-B]
│   │   ├── fees.ts                # Success-fee computation (pure, no I/O) [V2-D]
│   │   ├── billingPolicy.ts       # Subscription lifecycle, usage, overage policy (pure, no I/O) [V2-D]
│   │   └── segmentation.ts        # Auto-segmentation logic (pure, no I/O) [V2-F]
│   ├── lib/
│   │   ├── audit.ts               # Append-only AuditLog writer
│   │   ├── money.ts               # Decimal(14,2) helpers, rounding
│   │   ├── idempotency.ts         # Redis-backed idempotency key lock
│   │   └── rbac.ts                # Role check functions, capability resolution
│   ├── middleware/
│   │   ├── requestId.ts
│   │   ├── tenantContext.ts
│   │   ├── auth.ts                # JWT verify + workspace extract
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── auth/                  # BE-02: registration, login, JWT, workspace
│   │   ├── catalog/               # BE-03: products, variants, inventory
│   │   ├── conversations/         # BE-04: ingest, store, takeover
│   │   ├── whatsapp/              # BE-05: webhook, send, status
│   │   ├── wasel/                 # BE-06: AI sales closer
│   │   ├── orders/                # BE-07: orders, invoices, payments
│   │   ├── attribution/           # BE-08: AttributionEvent, MAR
│   │   ├── billing/               # BE-09 [V2-D]
│   │   ├── team/                  # BE-10 [V2-A]
│   │   ├── instagram/             # BE-11 [V2-E]
│   │   ├── aaed/                  # BE-12 [V2-B]
│   │   ├── hafeth/                # BE-13 [V2-C]
│   │   ├── crm/                   # BE-14 [V2-F]
│   │   ├── salla-zid/             # BE-15 [V2-G]
│   │   ├── media/                 # BE-16 [V2-H]
│   │   ├── analytics/             # BE-17 [V2-I]
│   │   ├── notifications/         # BE-18 [V2-E]
│   │   └── shipping/              # BE-19 [V2-J]
│   └── workers/
│       ├── attribution.worker.ts
│       ├── aiMetering.worker.ts
│       └── notifications.worker.ts
├── prisma/
│   └── schema.prisma
└── .env.example
```

### Frontend (`apps/web/`)

```
apps/web/
├── app/
│   ├── layout.tsx                 # Root layout (RTL, i18n provider)
│   ├── page.tsx                   # Redirect: login or dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx             # Dashboard shell (nav, workspace selector)
│       ├── page.tsx               # FE-03: Owner dashboard
│       ├── inbox/                 # FE-05: Unified inbox
│       ├── catalog/               # FE-04: Product catalog
│       ├── orders/                # FE-07: Orders & payments
│       ├── analytics/             # FE-08: Revenue analytics
│       ├── integrations/          # FE-09: Integrations hub
│       ├── settings/              # FE-15: Settings & admin
│       ├── team/                  # FE-10 [V2-A]
│       ├── customers/             # FE-06, FE-14 [V2-F]
│       ├── aaed/                  # FE-11 [V2-B]
│       ├── hafeth/                # FE-12 [V2-C]
│       └── billing/               # FE-13 [V2-D]
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── dashboard/                 # Dashboard widgets
│   ├── inbox/                     # Conversation thread, composer
│   ├── catalog/                   # Product forms, variant editor
│   ├── orders/                    # Order list, order detail
│   └── analytics/                 # MAR chart, metric cards
├── lib/
│   ├── api.ts                     # Typed API client
│   ├── auth.ts                    # JWT + session management
│   └── utils.ts
├── hooks/
│   ├── use-workspace.ts
│   ├── use-conversations.ts
│   ├── use-attribution.ts
│   └── use-analytics.ts
└── middleware.ts                  # Auth middleware (protect all dashboard routes)
```

### Prisma Migrations

```
prisma/migrations/
├── 0001_core_tenancy.sql          # DB-01: Workspace, WorkspaceSettings
├── 0002_audit_log.sql             # DB-14: AuditLog (append-only)
├── 0003_auth_rbac.sql             # DB-02: User, Session, WorkspaceUser, WorkspaceRole
├── 0004_catalog.sql               # DB-03: Product, ProductVariant, Category, InventoryLog
├── 0005_conversations.sql         # DB-04: Customer, Conversation, Message, MessageAttachment
├── 0006_integrations.sql          # DB-12: Integration, WebhookEvent
├── 0007_orders.sql                # DB-05: Order, OrderItem, Invoice, Payment, Refund, PaymentPlan
├── 0008_ai_execution.sql          # DB-06: AgentConfig, LLMCall, ToolExecution
├── 0009_attribution.sql           # DB-07: AttributionEvent
├── 0010_conversation_state.sql    # DB-15: ConversationState (1:1 with Conversation)
├── 0011_billing.sql               # DB-08: SubscriptionPlan, Subscription [V2-D]
├── 0012_team_rbac_conv_ops.sql    # DB-09: RBAC extensions + Label, AssignmentRule, EscalationRule [V2-A]
├── 0013_aaed.sql                  # DB-10: FollowUpJob, FollowUpAttempt [V2-B]
├── 0014_hafeth.sql                # DB-11: MarginRule, MarginDecision [V2-C]
├── 0015_analytics.sql             # DB-13: MetricSnapshot, Report [V2-I]
└── 0016_template_library.sql      # DB-12 extension: TemplateMessage [V2-E]
```

### Infrastructure & Config

```
/
├── docker-compose.yml             # postgres:16, redis:7 for local dev
├── pnpm-workspace.yaml
├── turbo.json
├── .github/
│   └── workflows/
│       ├── ci.yml                 # typecheck → lint → test → build
│       └── deploy.yml             # Railway (BE) + Vercel (FE) on main
└── docs/
    └── plans/
        └── master-implementation-plan.md   # This file
```

---

## 12. Status Tracking

> Update this table as specs move through the pipeline.
> Status: `Not started` | `In spec` | `Approved` | `In implementation` | `Complete`

*¹ X-00 (2026-08-24): all in-repo deliverables implemented and validated — monorepo boots (S1 PASS), data services persistent/resettable (S3/S4 PASS), CI gate green on `main` with red/skip/green semantics proven via PR, cache speedup 8%-of-cold (S7 PASS), secret hygiene clean (S8 PASS). Evidence: `specs/001-infrastructure-foundation/validation-log.md`. Remaining operator steps before flipping to `Complete`: branch protection on `main` (requires GitHub Pro/public repo), Railway + Vercel staging linking with auto-deploy (S6/T019), optional `TURBO_TOKEN`/`TURBO_TEAM` secrets. Exact steps: `docs/plans/x00-deploy-runbook.md`.

| Spec | Name | Status | Phase |
|------|------|--------|-------|
| X-00 | Infrastructure | In implementation *¹ | Phase 0 |
| X-01 | Shared Contracts | Not started | Phase 0 |
| X-02 | Testing Strategy | Not started | Phase 0 |
| X-03 | Tenant Isolation | Not started | Phase 0 |
| X-04 | Financial Correctness | Not started | Phase 0 |
| X-05 | AI Guardrails | Not started | Phase 0 |
| X-06 | Reliability | Not started | Phase 0 |
| X-07 | Performance | Not started | Pre-pilot |
| X-08 | Release Readiness | Not started | Pre-pilot |
| DB-01 | Core Tenancy | Not started | MVP |
| DB-02 | Auth & RBAC data | Not started | MVP |
| DB-03 | Catalog | Not started | MVP |
| DB-04 | Customers & Conversations | Not started | MVP |
| DB-05 | Orders & Payments | Not started | MVP |
| DB-06 | AI Execution | Not started | MVP |
| DB-07 | Attribution | Not started | MVP |
| DB-08 | Billing | Not started | V2-D |
| DB-09 | Team, RBAC & Conversation Ops | Not started | V2-A |
| DB-10 | Aaed | Not started | V2-B |
| DB-11 | Hafeth | Not started | V2-C |
| DB-12 | Integrations & Templates | Not started | MVP* |
| DB-13 | Analytics Snapshots | Not started | V2-I |
| DB-14 | Audit Log | Not started | MVP |
| DB-15 | Conversation AI State | Not started | MVP |
| BE-01 | API Foundation | Not started | MVP |
| BE-02 | Auth & Workspace | Not started | MVP |
| BE-03 | Catalog | Not started | MVP |
| BE-04 | Customers & Conversations | Not started | MVP |
| BE-05 | WhatsApp | Not started | MVP |
| BE-06 | Wasel AI | Not started | MVP |
| BE-07 | Orders & Payments | Not started | MVP |
| BE-08 | Attribution | Not started | MVP |
| BE-09 | Billing | Not started | V2-D |
| BE-10 | RBAC & Team | Not started | V2-A |
| BE-11 | Instagram & Messenger | Not started | V2-E |
| BE-12 | Aaed | Not started | V2-B |
| BE-13 | Hafeth | Not started | V2-C |
| BE-14 | CRM | Not started | V2-F |
| BE-15 | Salla & Zid | Not started | V2-G |
| BE-16 | Media Intelligence | Not started | V2-H |
| BE-17 | Analytics API | Not started | V2-I |
| BE-18 | Notifications & Templates | Not started | V2-E |
| BE-19 | Shipping | Not started | V2-J |
| FE-01 | Frontend Foundation | Not started | MVP |
| FE-02 | Auth & Onboarding | Not started | MVP |
| FE-03 | Owner Dashboard | Not started | MVP |
| FE-04 | Catalog | Not started | MVP |
| FE-05 | Unified Inbox | Not started | MVP |
| FE-06 | Customer Profile | Not started | V2-F |
| FE-07 | Orders & Payments | Not started | MVP |
| FE-08 | Revenue Analytics | Not started | MVP / V2-I |
| FE-09 | Integrations Hub | Not started | MVP / V2 |
| FE-10 | Team & RBAC | Not started | V2-A |
| FE-11 | Aaed Dashboard | Not started | V2-B |
| FE-12 | Hafeth Margin Guard | Not started | V2-C |
| FE-13 | Billing | Not started | V2-D |
| FE-14 | CRM | Not started | V2-F |
| FE-15 | Settings & Admin | Not started | MVP / V2 |

---

*End of Master Implementation Plan*

**Next action**: Begin Phase 0 — run `/speckit-specify` for `X-00` (Infrastructure Foundation)
