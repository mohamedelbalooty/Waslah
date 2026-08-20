<!--
SYNC IMPACT REPORT
==================
Version change: (none) -> 1.0.0
Type: Initial ratification (MAJOR - first version)
Modified principles: N/A - new document
Added sections:
  - Core Principles (20 principles, I through XX)
  - Implementation Standards
  - Governance
Removed sections: None (blank template replaced)
Deferred TODOs: None - all placeholders resolved from user input and SRS corpus
-->

# Waslah AI Revenue Guardian -- Constitution

## Core Principles

### I. Revenue-First Product Value

Every product capability MUST have a demonstrable relationship to at least one of: revenue
generation, revenue recovery, margin protection, cash collection, operational efficiency that
directly supports those outcomes, or reliable measurement of them. Generic CRM or messaging
functionality without a clear Waslah business purpose MUST NOT be built.

**Rationale:** Waslah's value proposition and success-fee model are grounded in measurable merchant
revenue outcomes. Features that do not connect to this core create scope drift, maintenance cost,
and diluted product positioning against competitors.

### II. Customer Value and Measurable Outcomes

Waslah MUST optimize for measurable business outcomes. Monthly Attributed Revenue (MAR), revenue
recovered, AI resolution rate, conversion rate, margin, AI cost per conversation, and other
approved business metrics MUST be computed from deterministic, auditable data. Subjective AI claims
MUST NOT be used as the basis for financial reporting or billing.

**Rationale:** Merchant trust in the success-fee model depends entirely on the credibility of the
attribution and metric data. Metrics that cannot be independently verified destroy the product's
commercial foundation.

### III. Multi-Tenant Isolation (NON-NEGOTIABLE)

Tenant/workspace isolation is a fundamental system invariant. A tenant MUST NEVER be able to
access, modify, infer, or receive another tenant's data. Tenant context MUST be enforced
consistently across all system surfaces: APIs, database queries, background jobs, queues, events,
caches, integrations, webhooks, and analytics aggregations. Tenant context filters MUST be applied
at the data layer, not only at the API layer.

**Rationale:** A single tenant data leak constitutes a critical security incident, regulatory
exposure, and an existential brand risk. This principle is non-negotiable even under performance or
complexity pressure.

### IV. Financial Correctness

All money-related behavior MUST be deterministic, auditable, and arithmetically precise. Revenue
attribution, MAR, success fees, refunds, fee credits, payment processing, invoicing, discount
calculations, and margin computations MUST follow the approved business rules (SRS_V2 Section 05
decisions and Section 07 NFRs). Financial values MUST use Decimal(14,2) precision. Financial
calculations MUST NEVER depend on probabilistic LLM reasoning.

**Rationale:** Incorrect billing or attribution directly damages merchant trust and creates legal
liability. The success-fee model's viability requires zero tolerance for financial rounding errors,
double-charges, or attribution drift.

### V. AI Must Be Grounded and Controlled

AI agents MUST operate exclusively using authoritative workspace data and approved tool calls. AI
MUST NOT invent or hallucinate: product names, prices, availability, delivery promises, policies,
payment information, margin floors, cost prices, or other business facts not present in the
workspace knowledge base. AI behavior MUST implement defined confidence thresholds (RES-04: >=70%
autonomous, 50-70% flagged, <50% escalate), defined tool permissions, cost controls (NEW-BR-001:
<$0.05/conversation), and complete auditability via LlmCall records.

**Rationale:** AI autonomy over real customer conversations creates significant business and
reputational risk if uncontrolled. Grounding AI in workspace data and enforcing guardrails is what
makes the autonomous model commercially viable.

### VI. Human Oversight

AI autonomy MUST NOT eliminate merchant control. The system MUST provide clear, low-friction human
takeover and escalation paths whenever triggered by: confidence threshold violations, business rule
constraints, explicit customer request, operational failures, or safety constraints. Human takeover
MUST transfer full conversation context. The owner MUST always be able to override any AI decision.

**Rationale:** Merchants are ultimately responsible for their customer relationships. Removing
oversight paths would make Waslah a liability rather than an asset, and would violate the trust
relationship the product depends on.

### VII. Explicit Business Rules Over AI Judgment

Deterministic business rules MUST always take precedence over LLM output for financially or
operationally critical decisions. This includes: pricing, inventory availability, margin floors,
payment state, order state transitions, attribution calculations, billing computations, permission
enforcement, and discount approval. The rule engines in src/core/** MUST be pure, deterministic
functions with no LLM dependency (NEW-NFR-003).

**Rationale:** LLMs are probabilistic. Pricing errors, unauthorized discounts, or incorrect billing
from a probabilistic component are commercially unacceptable. Business rules must be the final
authority on any decision with financial consequences.

### VIII. Auditability and Traceability

Business-critical actions MUST be traceable via persistent audit records. The system MUST log
sufficient information to reconstruct: authentication events, product changes, order and payment
state transitions, AI decisions and tool calls, margin decisions, attribution events, billing
events, integration events, and permission-sensitive actions. Audit records MUST be append-only and
MUST NOT be modifiable by application-layer code. Attribution events and margin decisions are
immutable by design.

**Rationale:** The success-fee model, dispute resolution workflow, and regulatory compliance all
require a reliable audit trail. Gaps in auditability prevent accurate dispute resolution and create
legal risk.

### IX. Security and Privacy by Default

Security, privacy, authentication, authorization, secrets management, rate limiting, tenant
isolation, and protection of sensitive business and customer information are first-class
requirements from day one. They MUST NOT be deferred as a hardening step. Cost price and margin
data MUST be restricted to Owner/Admin/Accountant roles (NEW-SEC-001). All secrets MUST be stored
in environment/vault; NEVER in application code, logs, or responses.

**Rationale:** A platform that handles merchant revenue data, customer PII, and financial
transactions is a high-value target. Security retrofitted after implementation is qualitatively
weaker than security designed in from the start.

### X. API and Domain Boundaries

Backend capabilities MUST be organized around coherent business domains (conversations, catalog,
orders, billing, attribution, agents, analytics) rather than arbitrary technical layers. Database,
backend, and frontend responsibilities MUST remain clearly separated while sharing well-defined
contracts. The API path convention is api.waslah.ai/v1/<resource> (no /api/ prefix). All domain
modules MUST enforce tenant context independently.

**Rationale:** Domain-organized code remains comprehensible and maintainable as the system grows.
Clear boundaries prevent cross-domain data leakage and make ownership unambiguous.

### XI. Shared Contracts and Consistency

Frontend and backend MUST use consistent domain contracts and validation rules. Zod schemas and
TypeScript types shared via packages/shared-types MUST be the single source of truth for all
API request/response shapes, financial enums, RBAC capability definitions, and domain entity types.
Capability strings MUST be imported from shared-types/rbac.ts -- duplication is prohibited.

**Rationale:** Type and schema drift between frontend and backend is the most common source of
runtime bugs in split-layer systems. The monorepo shared-types pattern eliminates this entire
class of defects.

### XII. Arabic, English, and Arabizi First-Class Support

Arabic (Egyptian and Gulf dialects), English, and Arabizi are core communication requirements for
the Waslah AI agents and the merchant-facing web application. RTL layout MUST be treated as a
foundational frontend concern implemented from day one using next-intl, not as a later
localization retrofit. AI agents MUST handle dialect code-switching without degradation. The AI
system MUST NOT respond in a language the customer did not use without explicit workspace
configuration.

**Rationale:** Waslah's ICP is MENA e-commerce merchants and their customers. Language and script
handling failure renders the product unusable in its primary market.

### XIII. Reliability and Idempotency

External integrations, webhooks, payment events, messaging, queues, and background jobs MUST be
designed for retries, duplicate delivery, partial failure, and recovery. All business-critical
external events (payment webhooks, shipping delivery webhooks, WhatsApp message webhooks) MUST be
idempotent using provider + event_id deduplication (NEW-FR-018). Failed queue jobs MUST use a
dead-letter queue with alerting. At-least-once delivery is acceptable; exactly-once semantics MUST
be guaranteed at the application layer.

**Rationale:** MENA payment and messaging providers have documented reliability limitations.
Non-idempotent webhook processing leads to double-attribution, double-billing, and incorrect order
states -- all of which have direct financial consequences.

### XIV. Test Business-Critical Behavior

Business rules, tenant isolation, financial calculations, attribution logic, AI guardrails, order
and payment state machines, RBAC permission enforcement, integrations, and other high-risk behavior
MUST have automated verification appropriate to their risk. The src/core/** modules MUST achieve
>=90% unit test coverage. Critical end-to-end flows MUST be covered by integration or E2E tests.
Tests MUST run in CI on every PR (Turborepo + GitHub Actions).

**Rationale:** The AI's autonomous behavior over real customer transactions makes automated
regression testing non-optional. A missed guardrail regression discovered in production can cause
irreversible merchant or customer harm.

### XV. Observability

Production behavior MUST be observable. All backend services MUST emit structured JSON logs (Pino)
with tenant context, request IDs, and domain event metadata. Errors MUST be tracked via Sentry with
LlmCall and ToolExecution context on AI errors. AI operations and financial operations MUST be
diagnosable after the fact from logs and the audit trail alone. Business KPIs (MAR, churn, AI cost,
NRR) MUST be trackable via PostHog or equivalent product analytics.

**Rationale:** Silent failures in an autonomous AI system are the highest-risk failure mode.
Observability turns "we found out from an angry merchant" into "we got paged before the merchant
noticed."

### XVI. MVP Discipline

The team MUST implement approved scope incrementally. MVP MUST NOT include V2 or V3 functionality
merely because it is technically convenient to add. V2 features MUST NOT enter implementation
without an explicit product gate decision. The MVP/V2/V3 phase tags in Waslah_Feature_List.md
are authoritative unless superseded by a documented scope decision. New scope MUST produce a scope
decision record before implementation begins.

**Rationale:** Scope creep is the primary cause of missed launch dates and diluted product focus.
Maintaining phase discipline protects the financial model milestones (MVP -> 138 merchants ->
pre-seed; V2 -> 650 merchants -> seed).

### XVII. Specification as the Source of Truth

Product behavior MUST be defined in specifications before implementation begins. Specifications
describe what the system MUST accomplish and why. Technical plans describe how it will be
implemented. Implementation agents MUST NOT silently invent business behavior to resolve
underspecified areas. When a specification gap is found, it MUST be surfaced and resolved
explicitly before code is written.

**Rationale:** Undocumented behavior becomes undocumentable technical debt. In a system with
financial and AI-autonomous components, silent design decisions made during implementation are
especially dangerous because they may not surface until a billing dispute or customer harm event.

### XVIII. Dependency-Aware Implementation

Waslah will be implemented through multiple specifications organized across Database, Backend,
Frontend, and cross-cutting infrastructure workstreams. Specifications MUST declare their
dependencies. Implementation MUST proceed in dependency order: shared types -> database schema ->
backend domain modules -> API layer -> frontend -> integrations. An upstream specification MUST NOT
be modified in ways that break a downstream implementation without a documented change decision.

**Rationale:** Rework caused by implementing downstream layers on an unstable upstream contract is
one of the highest-cost failure modes in multi-layer systems. Dependency order discipline prevents
cascading rework.

### XIX. Vertical Business Value

Where practical, implementation SHOULD produce complete vertical capabilities -- user-facing
features that can be demonstrated and validated end-to-end -- rather than building isolated
technical layers for extended periods without a working product slice. The preferred order within
any V2 feature area is: domain model -> API endpoint -> frontend screen -> test -> demo.

**Rationale:** Long horizontal-layer build cycles delay business feedback and make it harder to
detect requirements errors before they compound. Vertical slices allow early validation of the
product's core value proposition with real merchant pilots.

### XX. No Silent Assumptions

When requirements are ambiguous, contradictory, or insufficiently defined, the implementation agent
MUST identify and surface the ambiguity rather than inventing business behavior to resolve it.
Unresolved product or business decisions MUST be escalated explicitly. Agents MUST NOT resolve
OPEN-xx items from document logic alone -- only stakeholders may resolve open questions (AGENTS.md).
The SRS_V2 decision log (Section 05 RES-xx) is the authoritative record of resolved decisions.

**Rationale:** Silent assumptions in financial systems create defects that are expensive to detect
and dangerous to correct in production. The cost of surfacing an ambiguity is always lower than the
cost of correcting an incorrect implementation after merchant data is affected.

---

## Implementation Standards

These standards are derived from the approved technical architecture (Waslah_Tech_Stack.md,
Backend_SRS.md, Frontend_SRS.md) and govern implementation-phase behavior.

- **Monorepo:** pnpm workspaces + Turborepo. All packages share packages/shared-types as the
  single schema authority.
- **Backend:** Node.js 20 LTS, Express 4, TypeScript (strict), Prisma + PostgreSQL 16, Redis +
  BullMQ. Money MUST use Decimal(14,2). Core modules (src/core/**) MUST be pure functions with
  no I/O or LLM dependency.
- **Frontend:** Next.js 15 (App Router) + React 19, Tailwind CSS, shadcn/ui, TanStack Query,
  Zustand, next-intl for RTL/bilingual from day one.
- **AI:** Provider abstraction layer (LLMProvider interface). Anthropic Claude and OpenAI as
  concrete adapters. mock adapter MUST be used in all automated tests -- no real LLM calls in CI.
- **Hosting:** Frontend -> Vercel. Backend + workers -> Railway (persistent Docker containers, not
  serverless). PostgreSQL 16 and Redis 7 align with production versions in local Docker
  (postgres:16-alpine, redis:7-alpine).
- **API path convention:** api.waslah.ai/v1/<resource> (no /api/ prefix).
- **Capability enum:** All RBAC permission strings MUST be imported from
  packages/shared-types/src/rbac.ts. String duplication is prohibited.
- **AI cost cap:** NEW-BR-001 -- AI processing cost per conversation MUST NOT exceed $0.05 blended.
  Workspace-average alerting at $0.04 threshold.

---

## Governance

- The **latest approved SRS** (Waslah_AI_Revenue_Guardian_SRS.md V2 baseline) is the primary
  requirements authority where requirements conflict. This constitution governs all specifications
  and implementation plans.
- Individual feature specifications MAY add detailed requirements but MUST NOT contradict
  constitutional principles or SRS_V2 resolved decisions (RES-xx).
- Technical convenience MUST NOT override approved business rules, financial correctness
  requirements, or tenant isolation guarantees.
- **All constitutional changes MUST be explicit and documented.** The amendment procedure is:
  propose change -> document rationale and impact -> increment version -> record in the SYNC IMPACT
  REPORT comment at top of this file.
- Version policy follows semantic versioning: MAJOR for backward-incompatible governance changes or
  principle removals/redefinitions; MINOR for new principles or materially expanded guidance; PATCH
  for clarifications, wording, or non-semantic refinements.
- Out-of-scope functionality (V3-deferred agents: Munjiz, Rased, Murshid, Thaqib; ERP integrations;
  voice AI; native mobile apps) MUST NOT enter implementation without an explicit scope decision
  documented in the SRS.
- Every implementation MUST remain traceable from:
  business requirement -> specification -> technical plan -> tasks -> implementation -> tests
- OPEN-xx items in the SRS are stakeholder-owned and unresolved. Implementation agents MUST NOT
  resolve them through document logic or implementation choices.
- Constitution compliance MUST be reviewed at the start of every implementation session and before
  any significant architectural decision.

**Version**: 1.0.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
