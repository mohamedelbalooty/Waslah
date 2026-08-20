# Waslah AI Revenue Guardian
## Master Implementation Plan -- v1.0
### August 2026 | Authority: Waslah Constitution v1.0.0

> **Purpose of this document.** This is the program-level source of truth for the Waslah
> implementation program. It defines the full portfolio of specifications, their dependency
> order, build phases, and the workflow for driving individual specifications through Spec Kit.
> It is NOT a technical plan or a task list -- those live inside individual specifications.
>
> **Authority chain:** Constitution -> this plan -> individual specifications -> technical plans -> tasks -> implementation.
> On any conflict, the SRS_V2 (`Waslah_AI_Revenue_Guardian_SRS.md`) is the primary requirements
> authority. This plan must not contradict the constitution.
>
> **Reviewed against:** `Waslah_AI_Revenue_Guardian_SRS.md` (V2.1), `Backend_SRS.md` (v2.2),
> `Frontend_SRS.md` (v2.2), `Waslah_Feature_List.md`, `Waslah_Tech_Stack.md`, and
> `constitution.md` (v1.0.0).

---

## Part 0 -- Key Corrections to the Draft Plan

> These corrections apply to the ChatGPT-generated draft that was reviewed before this plan was
> written. They are documented here so the rationale is traceable.

| # | Correction | Draft assumption | Authoritative position |
|---|---|---|---|
| C-01 | **FND stream renamed to X-00** | Called "Phase 0 Foundation" in the draft | Foundation specs are cross-cutting prerequisites, not a numbered phase. Renamed to X-00 to make clear they block everything else. |
| C-02 | **X-01 Shared Contracts is Phase 0, not Phase 4 MVP hardening** | Draft placed X-01 in "MVP Hardening" | Constitution XI: `shared-types` MUST precede backend and frontend work. Shared contracts must be the first non-infra deliverable. |
| C-03 | **DB-09 (RBAC) split and sequenced correctly** | Draft had DB-09 as one spec covering both RBAC data and CRM | Backend SRS scopes RBAC data to WorkspaceUser/role/invite tables -- needed by MVP auth. CRM customer profile extensions are V2. Split: DB-02 covers RBAC-required user/role tables at MVP; DB-09 covers V2 team management extensions only. |
| C-04 | **BE-16 is Media Intelligence, scoped V2** | Draft listed BE-16 as MVP-adjacent | Feature List tags voice transcription and image recognition as V2 (NEW-FR-023/024). Explicitly V2. |
| C-05 | **X-specs are NOT a final phase** | Draft placed all X-02..X-07 in "Phase 4 MVP Hardening" | Constitution IX, XIII, XIV: security, reliability, tenant isolation, and testing are first-class from day one. X-specs define standards that APPLY to every spec from Phase 1. Authored early, not deferred. |
| C-06 | **FE-05 Inbox starts at MVP with WhatsApp only** | Draft implied inbox is V2 | Feature List and SRS: unified inbox with WhatsApp is an MVP dependency for Wasel. Instagram/Messenger added in V2 (Wave V2-E). |
| C-07 | **BE-17 Analytics is a thin layer, not a major stream** | Draft listed as major BE-17 | Backend SRS scopes analytics as queue-driven aggregation against existing domain data. A lightweight BE-17 spec covers the analytics API surface and metric aggregation jobs only. |
| C-08 | **DB-13 Analytics is late V2** | Draft ordering was ambiguous | Analytics snapshots depend on all domain data existing. DB-13 is valid but built last in the DB wave after domain data is stable. |
| C-09 | **PaymentPlan schema exists now; behavior is V3** | SRS 09.1: "V3 consumer; model now" | `PaymentPlan` entity goes into DB-05 with `status=DRAFT` convention. No business logic until Munjiz (V3). Schema may exist; behavior does not. |
| C-10 | **DB-14 AuditLog is MVP, not late V2** | Draft placed DB-14 last | NEW-FR-017 and Constitution VIII: audit logging required from day one. AuditLog schema goes into MVP database wave. AuditLog writer (lib/audit.ts) is part of BE-01. |
| C-11 | **Phase 3 BE-08 is Attribution, not Billing** | Draft used "BE-08 Billing" in Phase 3 | Billing (subscription fees, revenue-share, invoicing) is V2 (BE-09). Attribution (AttributionEvent, MAR) is MVP and belongs to Phase 3. |
| C-12 | **Success-fee billing model is V2, not MVP** | Draft sequencing implied billing in MVP | Feature List tags "Success-fee billing model" as V2. MVP uses manual billing foundations only. Full fee engine + automated invoicing ships in V2 (BE-09/Wave V2-D). |

---

## Part 1 -- Program Structure

```
WASLAH IMPLEMENTATION PROGRAM
|
+-- X-00  Foundation / Infrastructure (Phase 0 -- blocks everything)
+-- X-01  Shared Contracts (Phase 0 -- blocks BE + FE)
|
+-- DB    Database Specifications (14 specs, MVP + V2 waves)
+-- BE    Backend Specifications  (19 specs, MVP + V2 waves)
+-- FE    Frontend Specifications (15 specs, MVP + V2 waves)
|
+-- X     Cross-Cutting Standards (7 specs -- authored early, applied throughout)
    +-- X-02  Testing Strategy
    +-- X-03  Tenant Isolation
    +-- X-04  Financial Correctness
    +-- X-05  AI Safety & Guardrails
    +-- X-06  Reliability & Idempotency
    +-- X-07  Performance
    +-- X-08  Release & Production Readiness
```

**Total portfolio: 57 specifications** (2 foundation + 14 DB + 19 BE + 15 FE + 7 cross-cutting).

Each spec covers a complete capability -- not a single entity, endpoint, or UI component.

---

## Part 2 -- Specification Inventory

### Foundation

| ID | Name | Phase | Blocks |
|---|---|---|---|
| X-00 | Infrastructure & Repository Foundation | Pre-phase | Everything |
| X-01 | Shared Contracts (packages/shared-types) | Pre-phase | All BE + FE |

### Database Specifications

| ID | Name | Phase | Depends on | Blocks |
|---|---|---|---|---|
| DB-01 | Core Platform & Multi-Tenancy | MVP | -- | Almost everything |
| DB-02 | Authentication, Sessions & RBAC data | MVP | DB-01 | BE-02, BE-10 |
| DB-03 | Catalog & Inventory | MVP | DB-01 | BE-03, BE-06 |
| DB-04 | Customers & Conversations | MVP | DB-01, DB-02 | BE-04, BE-06 |
| DB-05 | Orders, Invoices & Payments | MVP | DB-03, DB-04 | BE-07 |
| DB-06 | AI & Agent Execution | MVP | DB-04 | BE-06, BE-08 |
| DB-07 | Attribution & Revenue | MVP | DB-04, DB-05, DB-06 | BE-08 |
| DB-08 | Billing & Subscriptions | V2 | DB-07 | BE-09 |
| DB-09 | V2 Team Management (RBAC extensions) | V2 | DB-01, DB-02, DB-04 | BE-10, BE-11, FE-10 |
| DB-10 | Aaed / Follow-up | V2 | DB-04, DB-06, DB-07, DB-12 | BE-12 |
| DB-11 | Hafeth / Margin Guard | V2 | DB-03, DB-05, DB-09 | BE-13 |
| DB-12 | Integrations & Template Library | MVP* | DB-01 | BE-05, BE-12, BE-18 |
| DB-13 | Analytics | V2 | All domain DBs | BE-17 |
| DB-14 | Audit Log & Retention | **MVP** | DB-01 | BE-01 (lib/audit.ts) |

> *DB-12 is partially MVP (Integration connection state, webhook dedup records) and partially V2
> (TemplateMessage library). The DB spec covers both; BE specs gate feature behavior.

### Backend Specifications

| ID | Name | Phase | Depends on |
|---|---|---|---|
| BE-01 | API Foundation (Express, middleware, conventions, observability) | MVP | X-00, X-01, DB-14, DB-01 |
| BE-02 | Authentication & Workspace | MVP | BE-01, DB-01, DB-02 |
| BE-03 | Catalog | MVP | BE-01, BE-02, DB-03 |
| BE-04 | Customers & Conversations | MVP | BE-01, BE-02, DB-04 |
| BE-05 | WhatsApp Integration | MVP | BE-01, BE-02, DB-04, DB-12 |
| BE-06 | Wasel AI (Sales Closer) | MVP | BE-01, BE-03, BE-04, BE-05, DB-06 |
| BE-07 | Orders, Invoices & Payments | MVP | BE-01, BE-03, BE-04, DB-05 |
| BE-08 | Attribution & Revenue | MVP | BE-06, BE-07, DB-07 |
| BE-09 | Billing & Subscriptions | V2 | BE-08, DB-08 |
| BE-10 | RBAC & Team Management | V2 | BE-02, DB-09 |
| BE-11 | Instagram & Facebook Messenger | V2 | BE-01, BE-04, DB-12 |
| BE-12 | Aaed (Follow-up & Recovery) | V2 | BE-04, BE-06, BE-08, DB-10 |
| BE-13 | Hafeth (Margin Guard) | V2 | BE-07, DB-11 |
| BE-14 | CRM (Profiles, Notes, Segments) | V2 | BE-04, DB-09 |
| BE-15 | Salla & Zid Commerce Sync | V2 | BE-03, BE-07, DB-12 |
| BE-16 | Media Intelligence (Voice & Image) | V2 | BE-05, BE-06, DB-06 |
| BE-17 | Analytics API & Aggregation | V2 | BE-08, BE-09, DB-13 |
| BE-18 | Notifications & Template Library | V2* | BE-01, DB-04, DB-12 |
| BE-19 | Shipping Integrations (Bosta/Aramex/SMSA) | V2 | BE-07, BE-08, DB-12 |

> *BE-18 Notifications is partially MVP (basic in-app/email alerts) and partially V2 (WhatsApp
> template library, approval state). MVP delivers minimal notification infrastructure; V2 delivers
> the full template management UI.

### Frontend Specifications

| ID | Name | Phase | Depends on |
|---|---|---|---|
| FE-01 | Frontend Foundation (App Router, design system, RTL, i18n, API client) | MVP | X-00, X-01 |
| FE-02 | Authentication & Onboarding | MVP | FE-01, BE-02 |
| FE-03 | Owner Dashboard | MVP | FE-01, BE-08 (MVP attribution API) |
| FE-04 | Product Catalog | MVP | FE-01, BE-03 |
| FE-05 | Unified Inbox (WhatsApp MVP -> IG/Messenger V2) | MVP | FE-01, BE-04, BE-05 |
| FE-06 | Customer Profile | V2 | FE-01, BE-14 |
| FE-07 | Orders & Payments | MVP | FE-01, BE-07 |
| FE-08 | Revenue Analytics | MVP (basic) / V2 (full) | FE-01, BE-08, BE-17 |
| FE-09 | Integrations Hub | MVP (WA/Shopify) / V2 (Salla/Zid/IG/Messenger) | FE-01, BE-05, BE-11, BE-15 |
| FE-10 | Team & RBAC | V2 | FE-01, BE-10 |
| FE-11 | Aaed Dashboard | V2 | FE-01, BE-12 |
| FE-12 | Hafeth Margin Guard | V2 | FE-01, BE-13 |
| FE-13 | Billing & Subscription | V2 | FE-01, BE-09 |
| FE-14 | CRM | V2 | FE-01, FE-06, BE-14 |
| FE-15 | Settings & Administration | MVP (basic) / V2 (full) | FE-01, BE-02, BE-18 |

### Cross-Cutting Specifications

| ID | Name | When authored | Scope |
|---|---|---|---|
| X-02 | Testing Strategy | Phase 0 | Applies to all specs from Phase 1 onward |
| X-03 | Tenant Isolation | Phase 0 | DB + BE mandatory compliance checklist |
| X-04 | Financial Correctness | Phase 0 | Attribution, fees, money precision, rounding |
| X-05 | AI Safety & Guardrails | Phase 0 | Grounding, confidence, cost cap, auditability |
| X-06 | Reliability & Idempotency | Phase 0 | Webhooks, queues, retries, DLQ |
| X-07 | Performance | Before MVP pilot | NFR targets from NEW-NFR-005 as acceptance criteria |
| X-08 | Release & Production Readiness | Before MVP pilot | Infra, secrets, alerting, runbooks, pilot checklist |

> **Important:** X-02 through X-06 are authored in Phase 0 and become mandatory compliance
> references for every downstream spec. They do not block spec authoring, but they DO block
> implementation sign-off. Waiving a cross-cutting requirement requires a documented scope decision.

---

## Part 3 -- Build Phases

### Phase 0 -- Foundation (Days 1-5)
**Goal:** Repository, infra, shared contracts, and cross-cutting standards authored.
**Gate:** Developer can boot the monorepo; CI passes; shared-types package builds; DB migrates.

| Spec | Output |
|---|---|
| X-00 | Monorepo (pnpm/Turborepo), Docker Compose (postgres:16, redis:7), GitHub Actions CI, Railway config |
| X-01 | packages/shared-types: Zod schemas, TypeScript types, Capability enum, enums, pagination types |
| X-02..X-06 | Cross-cutting standards docs (authored concurrently, compliance enforced from Phase 1) |
| DB-14 | AuditLog schema (append-only, immutable), retention metadata |
| DB-01 | Workspace, WorkspaceSettings -- the tenancy root |

**Parallel:** FE-01 can begin (Next.js scaffold, RTL/i18n, design system) once X-00 and X-01 are done.

---

### Phase 1 -- Platform Core (Days 6-15)
**Goal:** Merchant can register -> create workspace -> log in -> reach the application shell.
**Gate:** Auth roundtrip works; workspace context enforced; CI green on tenant isolation tests.

| Spec | Output |
|---|---|
| DB-02 | User, Session, WorkspaceUser, WorkspaceRole -- auth + RBAC data foundation |
| DB-03 | Product, ProductVariant, Category, InventoryLog -- catalog schema |
| DB-04 | Customer, Conversation, Message, MessageAttachment -- core conversation data |
| DB-12 | Integration, WebhookEvent (dedup key) -- integration connection state (MVP portion) |
| BE-01 | Express app, middleware, error handling, response envelope, lib/audit.ts, lib/money.ts, lib/idempotency.ts, lib/rbac.ts |
| BE-02 | Registration, login, JWT, workspace creation, tenant context middleware |
| FE-01 | Next.js 15 app, RTL/next-intl, design tokens, shadcn/ui primitives, TanStack Query client, auth store |
| FE-02 | Login, registration, workspace creation wizard (MVP: owner-only; V2 team invite step hidden) |

---

### Phase 2 -- Commerce Foundation (Days 16-30)
**Goal:** Merchant can manage catalog, receive WhatsApp messages, create orders, and process a payment.
**Gate:** End-to-end: catalog product -> WhatsApp message -> order created -> payment link -> paid.

| Spec | Output |
|---|---|
| DB-05 | Order, OrderItem, Invoice, Payment, Refund, PaymentPlan (schema-only, V3 behavior) |
| BE-03 | Catalog CRUD, variants, inventory, CSV import, Shopify/WooCommerce sync |
| BE-04 | Conversation ingest, message store, assignment foundation, human takeover |
| BE-05 | WhatsApp webhook (idempotent), inbound/outbound, delivery status, retry/DLQ |
| BE-07 | Order/invoice creation, state machine, Fawry/COD payment links, payment webhook processing |
| FE-04 | Product list, search/filter, product form, variants, inventory, import |
| FE-05 | Conversation list + thread (MVP: WhatsApp only), human takeover, composer |
| FE-07 | Order list, order detail, invoice, payment status, COD state |
| FE-09 | Integrations hub -- WhatsApp connect, Shopify/WooCommerce (MVP scope only) |
| FE-15 | Settings shell -- workspace profile, locale, currency, basic AI config (MVP) |

---

### Phase 3 -- Wasel Revenue Loop (Days 31-50)
**Goal:** WhatsApp -> Wasel -> catalog -> conversation -> order -> payment -> attribution -> MAR.
**Gate:** At least one end-to-end conversation showing attributed revenue in the dashboard.

| Spec | Output |
|---|---|
| DB-06 | AgentConfig, LLMCall, ToolExecution -- AI execution tracking |
| DB-07 | AttributionEvent -- immutable, reversible, with reversal chain |
| BE-06 | Wasel: intent classification, context assembly, catalog RAG retrieval, response generation, confidence tiers, cost metering, guardrails (no cost disclosure, no hallucinated catalog, margin compliance) |
| BE-08 | Attribution engine (core/attribution.ts), MAR computation, COD attribution on delivery confirmation, reversal on refund, first-touch default, audit logging |
| FE-03 | Owner dashboard -- MAR card, Revenue Recovered, conversations card, margin guard card, quick actions, real-time WS updates |
| FE-08 | Analytics -- MVP: MAR chart, basic conversation metrics, AI resolution rate, response time |

**MVP pilot readiness gate:**
- Wasel handles a real conversation autonomously
- Attribution event created for a paid order
- MAR appears on owner dashboard
- Human can take over at any point
- AI cost stays under $0.05/conversation
- Tenant A cannot see Tenant B data

---

### Phase 4 -- MVP Hardening (Days 51-65)
**Goal:** Production-ready MVP. Pilot merchants can onboard safely.
**Gate:** All X-spec compliance checklists pass; performance targets met; security review complete.

| Activity | Output |
|---|---|
| X-07 | Performance acceptance: AI first-byte <3s, dashboard <2s, API p95 <500ms |
| X-08 | Production readiness: Railway deploy, Vercel deploy, Sentry configured, secrets in env, runbooks |
| X-03 compliance | Tenant isolation audit across all Phase 1-3 specs |
| X-04 compliance | Financial correctness audit: attribution math, money precision, state machines |
| X-05 compliance | AI guardrail audit: confidence levels, cost cap enforcement, grounding checks |
| X-06 compliance | Reliability audit: webhook idempotency verified, DLQ wired, retry policies tested |
| X-02 completion | >=90% coverage on src/core/**; integration tests for revenue loop; E2E for auth + attribution |

---

## Part 4 -- V2 Waves (Months 4-8)

> V2 gates: MVP Revenue Loop is stable; at least one pilot merchant is live.

### Wave V2-A -- Team Foundation
```
DB-09 -> BE-10 -> FE-10
```
RBAC roles, invitations, conversation assignment/ownership.
Gate: Agents can claim conversations; Manager can reassign; RBAC enforced server-side.

### Wave V2-B -- Aaed Follow-up & Recovery
```
DB-10 -> BE-12 -> FE-11
```
Abandonment detection, follow-up cadence (RES-05), outcome tracking.
Requires: DB-12 TemplateMessage library; BE-18 (template portion).
Gate: Aaed respects 48h min interval + 3-attempt cap; attribution recorded for recoveries.

### Wave V2-C -- Hafeth Margin Guard
```
DB-11 -> BE-13 -> FE-12
```
Margin rule engine (core/marginGuard.ts), exception workflow, owner approval via WS + FCM push.
Gate: All RES-15 decision bands tested; 1h auto-reject functional; MarginDecision audit log complete.

### Wave V2-D -- Billing Automation
```
DB-08 -> BE-09 -> FE-13
```
Subscription lifecycle (RES-20), usage counter, overage policy (RES-16), success-fee engine (core/fees.ts), dispute hold (RES-09).
Note: VAT (NEW-FR-013) depends on OPEN-02 stakeholder resolution before implementation.
Gate: Fee recomputed from AttributionEvent ledger; state machine tests pass; dispute hold functional.

### Wave V2-E -- Multi-Channel (Instagram + Messenger)
```
DB-12 (TemplateMessage) -> BE-11 -> FE-05 (enhanced) -> FE-09 (enhanced)
BE-18 (Notifications + Template Library)
```
Instagram DM, Facebook Messenger adapters (NEW-FR-022).
WhatsApp template library management (NEW-FR-019).
Gate: Round-trip message in sandbox; rate-limit handling; delivery receipt.

### Wave V2-F -- CRM & Customer Intelligence
```
DB-09 (CRM extensions) -> BE-14 -> FE-06 -> FE-14
```
Customer profiles, notes, segments, auto-segmentation (core/segmentation.ts).
Gate: Auto-segment computed on sample data; customer LTV/AOV displayed.

### Wave V2-G -- Salla/Zid Commerce Integrations
```
BE-15 -> FE-09 (Salla/Zid)
```
OAuth connect, bidirectional sync, conflict log, manual resolution UI (NEW-FR-029).
COMPETITIVE URGENCY: Submit Salla App Store listing before Salla ships native AI.
Gate: Bidirectional sync tested; conflict detection functional; sync status visible.

### Wave V2-H -- Media Intelligence
```
BE-16 -> BE-06 (enriched) -> FE-05 (voice/image UI)
```
Voice transcription (Arabic/EN/Arabizi), image-to-catalog matching (NEW-FR-023/024).
Provider-abstracted; mock provider in CI.
Gate: Voice transcript injected as VOICE message; image match returns grounded product.

### Wave V2-I -- Analytics
```
DB-13 -> BE-17 -> FE-08 (V2 full)
```
Revenue by agent/channel/product/segment; margin dashboard; AI cost tracker; NRR + plan upgrade trend.
Platform Health tab: MAR vs target, churn, NRR, AI cost/conversation.
Gate: All Financial Model KPI targets surfaced; exports functional.

### Wave V2-J -- Shipping Integrations
```
BE-19 -> BE-08 (enriched)
```
Bosta/Aramex/SMSA delivery webhooks -> COD attribution trigger (NEW-FR-011, RES-17).
Gate: COD attribution event fires on delivery confirmation; 7-day reversal window starts correctly.

### Wave V2-K -- Final Hardening
```
DB-14 (retention schedules) -> X-02 -> X-03 -> X-04 -> X-05 -> X-06 -> X-07 -> X-08
```
Audit log compliance, retention policy enforcement, performance re-validation at V2 load.
V2 pilot readiness: 650-merchant capacity, Sentry fully wired, Railway autoscale configured.

---

## Part 5 -- Specification Template (Required Fields)

Every spec MUST declare these fields when authored via /speckit-specify:

| Field | Value |
|---|---|
| Spec ID | BE-xx / DB-xx / FE-xx / X-xx |
| Name | Human-readable name |
| Phase | MVP / V2 (Wave V2-x) |
| Status | Draft / In Review / Approved / In Implementation / Complete |
| Depends on | Comma-separated spec IDs |
| Blocks | Comma-separated spec IDs |
| SRS references | NEW-FR-xxx, RES-xx, BR-xxx |
| Constitution principles | e.g., III, IV, VII |

**Required sections in every spec:**
1. Purpose & scope
2. Out of scope (explicit -- constitution XVI MVP Discipline)
3. SRS requirements covered (with IDs)
4. Domain entities touched
5. Business rules (deterministic)
6. API surface (if BE) or screen inventory (if FE) or schema additions (if DB)
7. Queue jobs / events (if applicable)
8. Security & tenant isolation notes (X-03 compliance)
9. Financial correctness notes (X-04 compliance, if financial)
10. AI guardrail notes (X-05 compliance, if AI)
11. Testing requirements (X-02 compliance)
12. Acceptance criteria (testable, per SRS)

---

## Part 6 -- Dependency Matrix (Quick Reference)

| Spec | Depends on | Blocked by start of |
|---|---|---|
| DB-01 | -- | DB-02, DB-03, DB-04, DB-12, BE-01 |
| DB-02 | DB-01 | DB-09, BE-02, BE-10 |
| DB-03 | DB-01 | DB-05, DB-11, BE-03 |
| DB-04 | DB-01, DB-02 | DB-05, DB-06, DB-10, BE-04 |
| DB-05 | DB-03, DB-04 | DB-07, DB-08, BE-07 |
| DB-06 | DB-04 | DB-07, BE-06 |
| DB-07 | DB-04, DB-05, DB-06 | DB-08, BE-08 |
| DB-08 | DB-07 | BE-09 |
| DB-09 | DB-01, DB-02, DB-04 | BE-10, BE-14 |
| DB-10 | DB-04, DB-06, DB-07, DB-12 | BE-12 |
| DB-11 | DB-03, DB-05, DB-09 | BE-13 |
| DB-12 | DB-01 | BE-05, BE-11, BE-12, BE-18 |
| DB-13 | All domain DBs | BE-17 |
| DB-14 | DB-01 | BE-01 |
| BE-01 | X-00, X-01, DB-14, DB-01 | All BE specs |
| BE-02 | BE-01, DB-02 | BE-03..BE-19 |
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
| BE-19 | BE-07, BE-08, DB-12 | FE-09 (shipping status) |
| FE-01 | X-00, X-01 | All FE specs |
| FE-02 | FE-01, BE-02 | FE-03..FE-15 |
| FE-03 | FE-01, BE-08 | -- |
| FE-04 | FE-01, BE-03 | -- |
| FE-05 | FE-01, BE-04, BE-05 | -- |
| FE-06 | FE-01, BE-14 | FE-14 |
| FE-07 | FE-01, BE-07 | -- |
| FE-08 | FE-01, BE-08 (MVP), BE-17 (V2) | -- |
| FE-09 | FE-01, BE-05, BE-11, BE-15 | -- |
| FE-10 | FE-01, BE-10 | -- |
| FE-11 | FE-01, BE-12 | -- |
| FE-12 | FE-01, BE-13 | -- |
| FE-13 | FE-01, BE-09 | -- |
| FE-14 | FE-01, FE-06, BE-14 | -- |
| FE-15 | FE-01, BE-02, BE-18 | -- |

---

## Part 7 -- The Spec Kit Workflow

```
MASTER PLAN (this document)
        |
        v  select next unblocked spec
/speckit-specify   -> create feature spec (scope, rules, API, acceptance criteria)
        |
        v  review + approve spec
/speckit-clarify   -> resolve any ambiguities before planning
        |
        v
/speckit-plan      -> technical plan (how to implement the spec)
        |
        v  review + approve plan
/speckit-tasks     -> atomic, dependency-ordered task list
        |
        v
/speckit-implement -> execute tasks
        |
        v
/speckit-converge  -> verify unbuilt work, surface gaps
        |
        v  update status in this document
spec marked COMPLETE in master plan
```

**Rules for spec authoring:**
- Select the next spec where ALL dependencies are COMPLETE (not just started)
- A spec with status "In Implementation" blocks downstream specs from starting
- Do not create downstream specs for a V2 capability until the upstream MVP spec is COMPLETE
- Always check X-03/X-04/X-05/X-06 compliance checklists during spec review

---

## Part 8 -- Status Tracking

> Update this table as specs move through the pipeline.
> Status values: Not started | In spec | Approved | In implementation | Complete

| Spec | Name | Status | Phase |
|---|---|---|---|
| X-00 | Infrastructure | Not started | Phase 0 |
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
| DB-09 | Team RBAC | Not started | V2-A |
| DB-10 | Aaed | Not started | V2-B |
| DB-11 | Hafeth | Not started | V2-C |
| DB-12 | Integrations & Templates | Not started | MVP* |
| DB-13 | Analytics | Not started | V2-I |
| DB-14 | Audit Log | Not started | MVP |
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
| FE-08 | Revenue Analytics | Not started | MVP (basic) / V2-I (full) |
| FE-09 | Integrations Hub | Not started | MVP / V2 |
| FE-10 | Team & RBAC | Not started | V2-A |
| FE-11 | Aaed Dashboard | Not started | V2-B |
| FE-12 | Hafeth Margin Guard | Not started | V2-C |
| FE-13 | Billing | Not started | V2-D |
| FE-14 | CRM | Not started | V2-F |
| FE-15 | Settings & Admin | Not started | MVP (basic) / V2 (full) |

---

## Part 9 -- Key Business Constraints

These are non-negotiable. Every downstream spec MUST cite and comply with relevant constraints.

| Constraint | Source | Impact |
|---|---|---|
| src/core/** MUST be pure deterministic functions, no I/O, no LLM | NEW-NFR-003, Constitution VII | Attribution, margin, fees, billing must be 100% unit-testable |
| Money = Decimal(14,2), half-up rounding at display only | NEW-FR-012, Constitution IV | All DB money columns, all comparisons |
| AI cost cap: <$0.05/conversation, alert at $0.04 | NEW-BR-001 | LLMCall table aggregation, model downgrade before violating |
| Tenant isolation at data layer (not just API) | Constitution III | Every Prisma query MUST include workspaceId filter |
| Webhook idempotency: (provider, event_id) unique | NEW-FR-018 | WhatsApp, payment, shipping, Meta webhooks |
| Attribution is deterministic, never AI-delegated | NEW-NFR-003, RES-01 | core/attribution.ts only |
| Margin decisions: deterministic bands, not AI | RES-15, Constitution VII | core/marginGuard.ts only |
| 2FA is V2 only | RES-10 | Do not build 2FA in MVP; stub it |
| Team invites/RBAC is V2 only | RES-11 | MVP is owner-only; hide invite UI |
| API prefix: api.waslah.ai/v1/ (no /api/ prefix) | SRS 04, Constitution X | All route definitions |
| Cost price is confidential: Owner/Admin/Accountant only | NEW-SEC-001 | Catalog API, AI context assembly |
| OPEN-xx items must not be resolved by implementation agents | AGENTS.md, Constitution XX | Flag and escalate to stakeholder |
| V3-deferred items must not enter V2 implementation | Constitution XVI | Munjiz, Rased, Murshid, Thaqib, ERP, Voice AI |

---

**Version**: 1.0 | **Authored**: 2026-08-19 | **Authority**: Waslah Constitution v1.0.0
**Next action**: Begin Phase 0 -- run /speckit-specify for X-00 (Infrastructure Foundation)
