# Waslah — AI Revenue Guardian
## Backend Developer SRS (Server Implementation Specification)
### Version 2.2 | August 2026

> **Changelog (v2.2):** closes all findings from the v2.1 review — added labels/auto-labeling, auto-assignment rules, escalation rules config, dialect→Arabic translation, sentiment + summary refresh, partial payments, multi-currency product pricing, shipping integrations (Bosta/Aramex/SMSA), Paymob/Stripe; fixed `/templates/:id/approval` → POST; tagged reports/team-leaderboard/opportunity-score as V3-deferred; corrected the `prisma/schema.prisma` reference to a target artifact.
>
> **Read me first.** This document is the authoritative specification for the **backend implementation** of Waslah V2 (MVP foundations + V2 features). It defines architecture, data model, business-rule engines, queues/events, REST APIs, webhooks, integrations, security, and NFRs.
>
> **Traceability.** Every requirement below references a stable ID from the base SRS (`docs/Waslah_AI_Revenue_Guardian_SRS.md`), the Feature List, or the resolved V2 baseline (`docs/Waslah_AI_Revenue_Guardian_SRS_V2.md`). On any conflict, **SRS_V2 wins** — it records the decision IDs (RES-xx) that resolve all open questions and ambiguities.
>
> **Companion.** UI behavior is specified in `development/Frontend_SRS.md`. The two documents share the same API contract (§14) and RBAC matrix (§8.3).

---

## 1. Purpose

Provide the backend team with the complete, unambiguous contract for building the Waslah server:

- **What to build** — every module, entity, job, and endpoint in scope (MVP + V2).
- **How it must behave** — deterministic business rules (attribution, margin, follow-up, billing) and definitive state machines.
- **How to build it** — architecture, tech stack, conventions, security, and testing requirements.
- **How to know it works** — acceptance criteria in §21.

---

## 2. Scope & Deliverables

| Stream | Deliverables | Phase |
|---|---|---|
| Foundation | Project scaffold, config, CI/CD, DB schema + migrations, seed, auth + workspace + RBAC | MVP |
| Messaging | WhatsApp Business API ingest/outbound, unified inbox storage | MVP |
| AI | Wasel (sales closer), intent classification, RAG product retrieval, confidence scoring, escalation | MVP |
| Sales closure | Orders, invoices, payment links (Fawry/COD), revenue attribution, owner dashboard API | MVP |
| Catalog | Products/variants/categories/inventory, CSV import, Shopify/WooCommerce sync | MVP |
| V2 channels | Instagram DM, Facebook Messenger adapters | V2 |
| V2 agents | Aaed (follow-up), Hafeth (margin guard) rules + exception workflow | V2 |
| V2 multi-user | Roles/permissions, invites, assignment/ownership, session mgmt | V2 |
| V2 CRM | Customer profiles, notes, tags, auto-segments | V2 |
| V2 e-commerce | Salla, Zid sync | V2 |
| V2 media | Voice transcription, image recognition (provider-abstracted) | V2 |
| V2 billing | Subscription lifecycle, usage meter, overage policy, revenue-share fees, dispute hold | V2 |
| V2 conversation ops | Labels + AI auto-labeling, auto-assignment rules, escalation-rule config, translation + sentiment | V2 |
| V2 payments | Paymob, Stripe, partial payments (invoice amount-paid tracking) | V2 |
| V2 shipping | Bosta, Aramex, SMSA integrations; delivery events → COD attribution feed | V2 |
| V2 multi-currency | Per-product currency + multi-currency price storage | V2 |
| V2 analytics | Revenue/margin/conversation/team metrics, exports | V2 (custom reports + team leaderboard are V3) |

**Out of V2 scope for the backend:** Munjiz (Collections), Rased (Inventory Agent), Murshid (Team Performance), Thaqib (Briefing), native mobile apps, ERP/accounting integrations (QuickBooks/Xero/Odoo), TikTok, Voice AI calls. Do not build these endpoints now.
**V3-deferred (do NOT build in V2):** custom reports engine (`/reports/*`), team leaderboard, revenue-opportunity score. Keep these out of the V2 ship gate; the Feature List tags them 🔵 V3.

---

## 3. Tech Stack & Runtime

| Concern | Choice |
|---|---|
| Language / runtime | TypeScript (strict) on Node.js ≥ 20 LTS |
| Web framework | Express 4 (or compatible) |
| ORM | Prisma + PostgreSQL 16 |
| Validation | Zod (request schemas), Prisma `Decimal` for money |
| Queues / jobs | BullMQ on Redis 7 |
| Auth | JWT (access + refresh), bcrypt (password), OAuth2 flows for integrations |
| Security | helmet, cors, express-rate-limit, parameterized queries |
| AI | Provider abstraction (`openai` / `anthropic` / `mock`) via a unified `LLMProvider` interface; `@anthropic-ai/sdk` and `openai` as concrete adapters; cost-metered |
| Logging | pino (structured JSON), pino-http request logging |
| Real-time | WebSocket (Socket.IO or ws) for inbox + notifications; SSE fallback |
| Push notifications | `firebase-admin` SDK (FCM) | Mobile push for margin:exception approvals (1h window per RES-15); future mobile app notifications |
| Test | vitest; supertest for HTTP; unit tests for pure rule engines |
| E2E | Playwright (against API) for critical flows |

---

## 4. Repository & Module Layout

```
src/
├── config/env.ts            # zod-validated env
├── server.ts                # bootstrap (http)
├── app.ts                   # express app assembly, middleware, routes
├── db/prisma.ts             # PrismaClient singleton
├── lib/
│   ├── logger.ts            # pino
│   ├── errors.ts            # AppError hierarchy + codes
│   ├── http.ts              # response envelope, pagination helpers
│   ├── security.ts          # bcrypt, jwt, rate-limit factories
│   ├── rbac.ts              # permission resolution + guards
│   ├── money.ts             # Decimal ops, rounding (NEW-FR-012)
│   ├── audit.ts             # AuditLog writer (NEW-FR-017)
│   ├── idempotency.ts       # webhook/job dedupe (NEW-FR-018)
│   ├── time.ts              # tz helpers, business-day calc
│   └── ids.ts               # ULID/cuid id generation
├── core/                    # PURE, deterministic logic (NEW-NFR-003)
│   ├── attribution.ts       # RES-01/17, NEW-FR-010/011
│   ├── marginGuard.ts       # RES-12/15, NEW-FR-027
│   ├── followUpPolicy.ts    # RES-05, NEW-FR-028
│   ├── billingPolicy.ts     # RES-16/20, NEW-FR-014/015
│   ├── fees.ts              # success fee, credits, dispute hold (NEW-FR-016)
│   └── segmentation.ts      # NEW-SEG-001
├── modules/
│   ├── auth/                # service, controller, routes
│   ├── workspace/
│   ├── conversations/
│   ├── ai/                  # orchestrator, providers, guardrails
│   ├── catalog/
│   ├── customers/
│   ├── orders/              # orders, invoices, payments
│   ├── attribution/
│   ├── analytics/
│   ├── billing/
│   ├── notifications/
│   ├── integrations/
│   └── admin/
├── jobs/                    # BullMQ workers & cron definitions
├── events/                  # typed event bus + listeners
└── webhooks/                # public webhook controllers + verifiers
prisma/
├── schema.prisma
└── seed.ts
tests/
├── unit/core/               # rule engine tests (attribution, margin, followup, billing, money)
├── integration/
└── e2e/
```

**Rules**
- `src/core/**` MUST be side-effect free pure functions — they are the financially-critical deterministic engines and MUST have unit tests (NEW-NFR-003).
- Domain modules orchestrate via Prisma + queues; they MUST NOT re-implement core rule logic.
- Every public endpoint MUST pass through: auth → RBAC guard → zod validation → service → envelope.

---

## 5. Cross-Cutting Conventions

### 5.1 Response envelope
```
200 OK:  { "success": true, "data": {...}, "meta": { "page", "per_page", "total" } }
Error:   { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field", "message" }] } }
```

### 5.2 Error codes (stable)
`UNAUTHENTICATED` · `UNAUTHORIZED` (403 role) · `NOT_FOUND` · `VALIDATION_ERROR` · `CONFLICT` · `RATE_LIMITED` · `PAYMENT_REQUIRED` (subscription soft-lock) · `INTEGRATION_ERROR` · `AI_UNAVAILABLE` · `MARGIN_BLOCKED` · `ATTRIBUTION_REVERSED` · `UPSTREAM_ERROR` · `PRECONDITION_FAILED` (state-machine guard).

### 5.3 Pagination / filtering
- Pagination: `page` (1-based), `per_page` (default 20, max 100).
- Filters via query params; sorting via `sort` (`field:asc|desc`), allow-list per resource.
- Search via `q` → full-text (products, customers, messages) with Arabic config.

### 5.4 IDs & timestamps
- IDs: ULID/cuid, opaque in API.
- All tables: `created_at`, `updated_at` (UTC). Money columns `Decimal(14,2)`.
- All timestamps returned ISO-8601 UTC; display formatting is the frontend's job.

### 5.5 Money (NEW-FR-012, RES-08)
- Store as `Decimal(14,2)`; NEVER float.
- Comparisons in guardrails/fees operate on **unrounded** values.
- Rounding (half-up) applied only at display/invoice boundaries.
- Fee = `round(base × rate, 2)`.

### 5.6 Audit logging (NEW-FR-017)
AuditLog rows for: auth events, product CRUD, order status changes, margin decisions, attribution events + reversals, subscription/plan changes, integration connect/disconnect, user/role changes, dispute actions. Payload = actor, action, entity type/id, before/after (JSONB), IP, UA.

### 5.7 Idempotency (NEW-FR-018)
- Provider webhook events deduped by `(provider, event_id)` unique key.
- Payment actions idempotent via order/link token; link regeneration invalidates prior token (NEW-PAY-001, BR-PAY-001).

### 5.8 Rate limiting
- Auth: 10/min per IP (login), 20/min (refresh).
- API: 100 req/min per user, 1,000 req/min per workspace.
- Webhook endpoints: 10,000/min per IP.

### 5.9 Validation
Zod schemas on all request bodies/queries. Messages: 4,096 chars max. Consistent field error objects (see 5.1).

### 5.10 Feature flags
`LLM_PROVIDER`, `CHANNEL_SANDBOX`, per-agent enable flags (`AGENT_WASEL`, `AGENT_AAED`, `AGENT_HAFETH`) — read from env/config so the suite runs in a fully mock sandbox.

---

## 6. Environment & Configuration

All env validated at boot by `src/config/env.ts` (zod). Never log secrets. Sample values:

| Var | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | — | Postgres DSN |
| `REDIS_URL` | `redis://localhost:6379` | BullMQ + cache |
| `JWT_SECRET` / `REFRESH_SECRET` | — | ≥ 32-byte secrets |
| `JWT_EXPIRES_IN` | `15m` | access token TTL |
| `REFRESH_EXPIRES_IN` | `30d` | refresh TTL |
| `SESSION_IDLE_TIMEOUT_MIN` | `30` | idle session timeout |
| `ENCRYPTION_KEY` | — | AES-256 key for provider secrets at rest |
| `LLM_PROVIDER` | `mock` | `openai` / `anthropic` / `mock` |
| `LLM_API_KEY` | — | provider key |
| `ATTRIBUTION_WINDOW_HOURS` | `24` | RES-01/US-006 |
| `REFUND_REVERSAL_WINDOW_DAYS` | `7` | US-006, NEW-ORD-002 |
| `DEFAULT_MARGIN_FLOOR` | `0.20` | RES-15/US-007 |
| `MARGIN_EXCEPTION_APPROVE_HOURS` | `1` | auto-reject timeout (US-007) |
| `FOLLOWUP_MAX_PER_CONVERSATION` | `3` | RES-05/BR-FOL-001 |
| `FOLLOWUP_MIN_INTERVAL_HOURS` | `48` | RES-05/BR-FOL-002 |
| `FOLLOWUP_DETECTION_HOURS` | `24` | non-response detection (RES-05) |
| `ABANDONMENT_DETECT_MIN` | `120` | 2h inactivity (FR-011/BR-FOL-006) |
| `TRIAL_DAYS` | `14` | RES-20/NEW-FR-014 |
| `USAGE_ALERT_PCT` | `0.8` | 80% overage alert (RES-16) |
| `OVERAGE_GRACE_DAYS` | `0` (to period end) | RES-16 |
| `SOFT_LOCK_NOTICE_HOURS` | `48` | renewal soft-lock notice (RES-16) |
| `DISPUTE_RESOLUTION_DAYS` | `14` | NEW-FR-016 auto-resolve |
| `BILLING_CURRENCY` | `USD` | plan/fee currency (A1) |
| `TAX_EG_VAT` / `TAX_KSA_VAT` | `0.14` / `0.15` | NEW-FR-013 |
| `COLD_ARCHIVE_DAYS` | `365` | conversation archive (RES-13) |
| `RETENTION_ANALYTICS_DAYS` | `730` | NEW-NFR-002 |
| `RETENTION_FINANCIAL_DAYS` | `3650` | 10 years |
| `NODE_ENV` | `development` | runtime mode |
| `CHANNEL_SANDBOX` | `true` | mock channel round-trips |
| `AI_COST_TARGET_USD` | `0.05` | blended $/conversation cap (NEW-NFR-004) |

---

## 7. Data Layer (Prisma / PostgreSQL)

### 7.1 Conventions
- `snake_case` table names; `camelCase` fields in Prisma; JSONB for flexible config.
- Enums as native PG enums.
- Money: `Decimal @db.Decimal(14, 2)`.
- Soft deletes discouraged; use status enums; deletes restricted by FK relations.
- Tenant isolation: every workspace-scoped table carries `workspace_id` FK + composite indexes.

### 7.2 Enumerations

| Enum | Values |
|---|---|
| `WorkspaceRole` | `OWNER` `ADMIN` `MANAGER` `AGENT` `ACCOUNTANT` `VIEWER` (RES-19) |
| `Channel` | `WHATSAPP` `INSTAGRAM` `MESSENGER` |
| `MessageSender` | `CUSTOMER` `AI` `HUMAN` `SYSTEM` |
| `MessageContentType` | `TEXT` `IMAGE` `VOICE` `DOCUMENT` `TEMPLATE` |
| `ConversationStatus` | `OPEN` `CLOSED` `ARCHIVED` (RES-18) |
| `ConversationStage` | `AI_HANDLING` `HUMAN_MONITORING` `HUMAN_HANDLING` `FOLLOWUP` `CLOSED` (NEW-CONV-001) |
| `Intent` | `PRODUCT_INQUIRY` `PRICE_CHECK` `ORDER_STATUS` `COMPLAINT` `GENERAL_CHAT` `BUYING_INTENT` `PAYMENT_ISSUE` (FR-003) |
| `OrderStatus` | `PENDING` `CONFIRMED` `PAID` `PROCESSING` `SHIPPED` `DELIVERED` `CANCELLED` `REFUNDED` (RES-18) |
| `PaymentMethod` | `FAWRY` `MADA` `TABBY` `PAYMOB` `STRIPE` `COD` `BANK_TRANSFER` `CASH` |
| `PaymentStatus` | `PENDING` `PAID` `FAILED` `EXPIRED` `REFUNDED` (RES-18) |
| `InvoiceStatus` | `DRAFT` `SENT` `PAID` `OVERDUE` `CANCELLED` (RES-18) |
| `SubscriptionStatus` | `TRIALING` `ACTIVE` `PAST_DUE` `CANCELLED` (RES-20) |
| `ProductStatus` | `ACTIVE` `DRAFT` `DISCONTINUED` |
| `IntegrationType` | `CHANNEL` `ECOMMERCE` `PAYMENT` `SHIPPING` `COMMS` |
| `IntegrationStatus` | `PENDING` `ACTIVE` `ERROR` `DISABLED` (NEW-INT-001) |
| `AttributionType` | `AI_FULL` `SPLIT` `HUMAN` `FOLLOWUP` (RES-01/03) |
| `AttributionModel` | `FIRST_TOUCH` `SPLIT` `CONSERVATIVE` |
| `AttributionStatus` | `ACTIVE` `REVERSED` (NEW-FR-010) |
| `MarginDecisionStatus` | `AUTO_APPROVED` `PENDING_APPROVAL` `APPROVED` `REJECTED` `BLOCKED` (RES-15) |
| `Segment` | `NEW` `ONE_TIME` `FREQUENT` `VIP` `AT_RISK` (NEW-SEG-001) |
| `LeadQualification` | `HOT` `WARM` `COLD` (NEW-QUAL-001) |
| `NotificationChannel` | `IN_APP` `EMAIL` `WHATSAPP` `PUSH` |
| `BillingInvoiceStatus` | `DRAFT` `PENDING` `PAID` `OVERDUE` `CANCELLED` `HOLD` (NEW-FR-016) |
| `Sentiment` | `POSITIVE` `NEUTRAL` `NEGATIVE` |
| `TemplateScope` | `PERSONAL` `TEAM` |
| `AssignmentStrategy` | `MANUAL` `ROUND_ROBIN` `LOAD_BALANCED` `SKILL_BASED` |
| `EscalationTriggerType` | `TIME` `SENTIMENT` `CONFIDENCE` `KEYWORD` `EXPLICIT` |
| `LabelSource` | `MANUAL` `AI` (auto-labeling) |

### 7.3 Models (logical — the target Prisma DDL lives at `prisma/schema.prisma`; it is generated from this spec as part of implementation)

**Identity & Access:** `User`, `Workspace`, `WorkspaceUser`, `Session`, `UserInvite`, `AuditLog`.

| Model | Key fields |
|---|---|
| `User` | email (unique), password_hash, phone, name, avatar_url, two_factor_enabled (V2), totp_secret (encrypted) |
| `Workspace` | name, logo_url, business_type, currency, timezone, language, numeral_format (`ARABIC_INDIC` \| `WESTERN`, default `WESTERN`), status, tax_profile (JSONB: country, tax_id, vat_rate, enabled) |
| `WorkspaceUser` | workspace_id, user_id, role; `@@unique([workspaceId, userId])` |
| `Session` | user_id, token_hash, refresh_token_hash, expires_at, ip_address, user_agent, last_activity_at |
| `UserInvite` | workspace_id, email, role, token_hash, expires_at, accepted_at |
| `AuditLog` | workspace_id?, actor_id, action, entity_type, entity_id, before/after JSONB, ip, user_agent |

**Catalog:** `Category`, `Product`, `ProductVariant`, `InventoryLog`, `MarginRule` (per-category floor, RES-12).

| Model | Key fields |
|---|---|
| `Product` | workspace_id, sku (`@@unique([workspaceId, sku])`), name, description, base_price, cost_price, currency (default = workspace currency), status, images JSONB, search_vector (full-text, AR) |
| `ProductVariant` | product_id, sku, name, price_adjustment, stock_quantity, attributes JSONB |
| `InventoryLog` | product_id/variant_id, quantity_change, reason, reference_id |
| `MarginRule` | workspace_id, category_id?, name, floor, hard_floor (default = cost), enabled |

**Conversations:** `Conversation`, `Message`, `ConversationState`, `FollowUpAttempt`, `TemplateMessage`.

| Model | Key fields |
|---|---|
| `Conversation` | workspace_id, channel, external_id, customer_id, status, stage, assigned_to, ai_enabled, intent, qualification, last_message_at, labels (M:N → `Label`; replaces raw tags JSONB) |
| `Message` | conversation_id, sender_type, sender_id, content, content_type, metadata JSONB (incl. transcription/voice, image-match, delivery_status), provider_msg_id, status |
| `ConversationState` | conversation_id (1:1), intent, stage, confidence, escalation_reason, ai_summary, sentiment (`POSITIVE`/`NEUTRAL`/`NEGATIVE`), next_best_action |
| `FollowUpAttempt` | conversation_id, attempt_number, scheduled_for, sent_at, status, outcome (NO_RESPONSE | RESPONDED | OPT_OUT | BOUGHT_ELSEWHERE | BLOCKED), template_id |
| `TemplateMessage` | workspace_id, name, body, variables JSONB, language, category, scope (`TEAM` default | `PERSONAL`), owner_id (nullable, when scope = PERSONAL), provider_approval_status |

**Conversation ops:** `Label`, `AssignmentRule`, `EscalationRule`.

| Model | Key fields |
|---|---|
| `Label` | workspace_id, name (`@@unique([workspaceId, name])`), color, source (`LabelSource`), ai_rule JSONB (auto-labeling conditions) |
| `AssignmentRule` | workspace_id, strategy (`AssignmentStrategy`), config JSONB (skills, weights, round-robin order), enabled |
| `EscalationRule` | workspace_id, name, trigger_type (`EscalationTriggerType`), conditions JSONB, action (e.g. notify manager / force human), enabled |

**Customers:** `Customer`, `CustomerNote`, `CustomerTag`.

| Model | Key fields |
|---|---|
| `Customer` | workspace_id, phone, email, name, address JSONB, total_spent, order_count, first_order_date, last_order_date, segment, qualification, tags JSONB, churn_risk_score |
| `CustomerNote` | customer_id, author_id, content |
| `CustomerTag` | workspace_id, name (`@@unique([workspaceId, name])`), color |

**Orders & finance:** `Order`, `OrderItem`, `Invoice`, `Payment`, `Refund`, `AttributionEvent`, `MarginDecision`, `DisputeRecord`, `PaymentPlan`.

| Model | Key fields |
|---|---|
| `Order` | workspace_id, customer_id, conversation_id?, status, total, currency, payment_method, payment_status, shipping_address JSONB, margin_checked (bool) |
| `OrderItem` | order_id, product_id/variant_id, quantity, unit_price, total_price, discount, cost_price_at_sale |
| `Invoice` | workspace_id, order_id, invoice_number (`WS-YYYY-NNNNN`, unique per workspace, A13), amount, amount_paid (partial payments accumulate here), due_date, status |
| `Payment` | invoice_id?, order_id?, amount, method, transaction_id, provider_ref, status, link_token, link_expires_at |
| `Refund` | order_id, amount, reason, status, reversal_event_id? |
| `AttributionEvent` | workspace_id, order_id, conversation_id, amount, attribution_type, model, status, reversed_at, reversal_reason; immutable |
| `MarginDecision` | workspace_id, order_id?, conversation_id?, proposed_price `Decimal(14,2)`, computed_margin `Decimal(6,4)` (unrounded), status (`MarginDecisionStatus`), justification (nullable), decided_by (user_id, nullable), decided_at (nullable), auto_reject_at, alternatives JSONB (bundle/upsell suggestions), created_at. Immutable once decided. *(NEW-FR-017/027, RES-12/15)* |
| `DisputeRecord` | workspace_id, attribution_event_id, status (OPEN \| RESOLVED), reason, resolution, auto_resolve_at |
| `PaymentPlan` | invoice_id, customer_id, terms JSONB, status, reminder_stage |

**AI & billing:** `AgentConfig`, `PromptTemplate`, `LLMCall`, `ToolExecution`, `Plan`, `Subscription`, `UsageRecord`, `BillingInvoice`.

| Model | Key fields |
|---|---|
| `AgentConfig` | workspace_id, agent_type, enabled, personality, tone, operating_hours JSONB, confidence_threshold (RES-04: 0.5/0.7 bands), language |
| `LLMCall` | workspace_id, agent_type, model, prompt, response, tokens_in/out, latency_ms, cost_usd, confidence, guardrail_triggered (NEW-NFR-004) |
| `Plan` | name, price_monthly, conversation_limit, success_fee_rate, features JSONB |
| `Subscription` | workspace_id, plan_id, status, current_period_start/end, trial_ends_at, cancelled_at |
| `UsageRecord` | workspace_id, metric (`CONVERSATIONS` | `AI_CREDITS`), value, period (RES-02) |
| `BillingInvoice` | workspace_id, period, plan_amount, fee_amount, fee_credit, vat_amount, total, status (`HOLD` when disputes open), paid_at, currency |

**Integrations & notifications:** `Integration`, `Webhook`, `Notification`, `NotificationPreference`, `MetricSnapshot`, `Report`.

| Model | Key fields |
|---|---|
| `Integration` | workspace_id, provider, type, config JSONB (secrets encrypted AES-256), status, last_sync_at |
| `Webhook` | workspace_id, integration_id?, provider, secret_hash, status |
| `Notification` | workspace_id, user_id?, type, title, body, data JSONB, channel, read_at |
| `MetricSnapshot` | workspace_id, metric_name, value, dimensions JSONB, period_start/end |
| `Report` | workspace_id, name, configuration JSONB, schedule, last_run_at |

### 7.4 Indexes & partitioning
- Composite indexes on every `(workspace_id, <primary filter>)`: conversations(workspace,status), conversations(assigned_to,status), messages(conversation_id,created_at), orders(workspace,status), products(workspace,sku), customers(workspace,phone), invoices(workspace,status), llm_calls(workspace,agent_type,created_at), metric_snapshots(workspace,metric,period_start).
- GIN full-text on `products(name,description)` and `customers(name,phone,email)` with Arabic config.
- Partitioning strategy (when volume demands): `messages`, `llm_calls`, `metric_snapshots` by month.

### 7.5 Migrations & seed
- Prisma migrations committed; `prisma migrate dev` for dev, `migrate deploy` for prod.
- Seed: 3 plans (Starter/Growth/Pro per §Feature List + SRS §09), default roles, demo workspace + products + conversations in sandbox.

---

## 8. Authentication & Authorization

### 8.1 Flows
- **Register** → create workspace → owner → trial subscription (14 days, no card) → onboarding.
- **Login** → verify password → issue access + refresh JWT → record session. 2FA challenge when enabled (V2).
- **Refresh** → rotate refresh token; revoke on reuse.
- **Logout** → revoke session + tokens.
- **Invite** (V2) → owner/admin sends email invite with role + token (expires 7d) → accepted user joins workspace with role.

### 8.2 JWT & sessions
- Access token 15 min; refresh 30 days (rotating, stored hashed).
- Idle session timeout 30 min (last_activity_at).
- All role/permission checks server-side (never trust client).

### 8.3 RBAC matrix (RES-19)

| Capability | Owner | Admin | Manager | Agent | Accountant | Viewer |
|---|---|---|---|---|---|---|
| View all conversations | ✓ | ✓ | ✓ (team) | ✗ (assigned) | ✗ | ✓ |
| Assign / reassign / transfer | ✓ | ✓ | ✓ | ✓ (claim/unclaim) | ✗ | ✗ |
| Escalate / close conversations | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Product CRUD | ✓ | ✓ | ✗ (read) | read | read | read |
| Quote within guardrails | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Approve margin exceptions | ✓ (sole) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Financial data / reports | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Manage users / roles / invites | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Billing / plan / cancel workspace | ✓ (sole) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Resolve attribution disputes | ✓ (sole) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Configure agents / scripts | ✓ | ✓ | ✓ (w/ approval) | ✗ | collections rules only | ✗ |
| View cost price | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Manage labels / tags | ✓ | ✓ | ✓ | ✓ (apply) | ✗ | ✗ |
| Configure assignment rules | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configure escalation rules | ✓ | ✓ | ✓ (w/ approval) | ✗ | ✗ | ✗ |
| Record partial payments | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |

**NEW-SEC-001 (cost confidentiality):** cost price, margin floor internals, and per-agent discount budget are returned to Owner/Admin/Accountant only. Agents and the AI receive the permissible discount range, never absolute cost.

### 8.4 Enforcement
- Middleware: `authenticate` (JWT) → `authorize(capability)` → per-entity row checks (workspace tenant + assignment rules for AGENT role).
- Every mutation that changes state or money writes an AuditLog entry (5.6).


### 8.5 Capability Enum (`packages/shared-types/src/rbac.ts`)

The `Capability` enum is the **single source of truth** for all permission strings. Published from `packages/shared-types` and consumed by:
- **Backend:** `lib/rbac.ts` `authorize(capability: Capability)` middleware  
- **Frontend:** `can(role, capability: Capability)` permission helper (Frontend_SRS §9)

This guarantees the frontend and backend permission model are always in sync — no string drift across the monorepo.

```typescript
// packages/shared-types/src/rbac.ts

export const Capability = {
  // Conversations
  VIEW_ALL_CONVERSATIONS:       'VIEW_ALL_CONVERSATIONS',       // Owner, Admin, Manager (team), Viewer
  VIEW_ASSIGNED_CONVERSATIONS:  'VIEW_ASSIGNED_CONVERSATIONS',  // Agent (assigned only)
  ASSIGN_CONVERSATION:          'ASSIGN_CONVERSATION',          // Owner, Admin, Manager, Agent (claim/unclaim)
  TRANSFER_CONVERSATION:        'TRANSFER_CONVERSATION',         // Owner, Admin, Manager
  ESCALATE_CONVERSATION:        'ESCALATE_CONVERSATION',         // Owner, Admin, Manager, Agent
  CLOSE_CONVERSATION:           'CLOSE_CONVERSATION',            // Owner, Admin, Manager, Agent
  RETURN_TO_AI:                 'RETURN_TO_AI',                  // Owner, Admin, Manager, Agent
  SEND_MESSAGE:                 'SEND_MESSAGE',                  // Owner, Admin, Manager, Agent

  // Labels
  MANAGE_LABELS:                'MANAGE_LABELS',                 // Owner, Admin
  APPLY_LABEL:                  'APPLY_LABEL',                   // Owner, Admin, Manager, Agent

  // Catalog
  MANAGE_PRODUCTS:              'MANAGE_PRODUCTS',               // Owner, Admin
  READ_PRODUCTS:                'READ_PRODUCTS',                 // All roles
  READ_COST_PRICE:              'READ_COST_PRICE',               // Owner, Admin, Accountant (NEW-SEC-001)

  // Customers
  MANAGE_CUSTOMERS:             'MANAGE_CUSTOMERS',              // Owner, Admin, Manager, Agent (tags/qualification)
  READ_CUSTOMERS:               'READ_CUSTOMERS',                // All roles

  // Orders & Payments
  CREATE_ORDER:                 'CREATE_ORDER',                  // Owner, Admin, Manager, Agent
  EDIT_ORDER:                   'EDIT_ORDER',                    // Owner, Admin, Manager, Agent
  CANCEL_ORDER:                 'CANCEL_ORDER',                  // Owner, Admin, Manager (processing: Manager+)
  GENERATE_PAYMENT_LINK:        'GENERATE_PAYMENT_LINK',         // Owner, Admin, Manager, Agent
  RECORD_PARTIAL_PAYMENT:       'RECORD_PARTIAL_PAYMENT',        // Owner, Admin, Accountant
  PROCESS_REFUND:               'PROCESS_REFUND',                // Owner, Admin, Accountant
  VOID_INVOICE:                 'VOID_INVOICE',                  // Owner, Accountant

  // Margin Guard
  QUOTE_WITHIN_GUARDRAILS:      'QUOTE_WITHIN_GUARDRAILS',       // Owner, Admin, Manager, Agent
  APPROVE_MARGIN_EXCEPTION:     'APPROVE_MARGIN_EXCEPTION',      // Owner only (sole -- RES-19)
  MANAGE_MARGIN_RULES:          'MANAGE_MARGIN_RULES',           // Owner, Admin

  // Attribution & Disputes
  VIEW_ATTRIBUTION:             'VIEW_ATTRIBUTION',              // Owner, Admin, Accountant
  RESOLVE_DISPUTE:              'RESOLVE_DISPUTE',               // Owner only (sole -- RES-19)

  // Analytics & Financial
  VIEW_FINANCIAL_DATA:          'VIEW_FINANCIAL_DATA',           // Owner, Admin, Accountant, Viewer
  VIEW_TEAM_ANALYTICS:          'VIEW_TEAM_ANALYTICS',           // Owner, Admin, Manager
  VIEW_MARGIN_ANALYTICS:        'VIEW_MARGIN_ANALYTICS',         // Owner, Admin, Accountant

  // AI Agents
  MANAGE_AGENTS:                'MANAGE_AGENTS',                 // Owner, Admin
  VIEW_AGENTS:                  'VIEW_AGENTS',                   // Owner, Admin, Manager

  // Users & Workspace
  MANAGE_USERS:                 'MANAGE_USERS',                  // Owner, Admin
  MANAGE_BILLING:               'MANAGE_BILLING',                // Owner only (sole -- RES-19)
  MANAGE_WORKSPACE:             'MANAGE_WORKSPACE',              // Owner
  CONFIGURE_ASSIGNMENT_RULES:   'CONFIGURE_ASSIGNMENT_RULES',    // Owner, Admin only
  CONFIGURE_ESCALATION_RULES:   'CONFIGURE_ESCALATION_RULES',    // Owner, Admin (Manager: read-only)
  VIEW_AUDIT_LOG:               'VIEW_AUDIT_LOG',                // Owner, Admin
  EXPORT_DATA:                  'EXPORT_DATA',                   // Owner, Admin
  MANAGE_SECURITY:              'MANAGE_SECURITY',               // Owner
} as const;

export type Capability = typeof Capability[keyof typeof Capability];
```

**Backend usage (`lib/rbac.ts`):**
```typescript
import { Capability, ROLE_CAPABILITIES } from 'shared-types';
export const authorize = (cap: Capability) => (req, res, next) => {
  if (!ROLE_CAPABILITIES[req.user.workspaceRole]?.includes(cap))
    return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  next();
};
```

**Frontend usage (`utils/permissions.ts`):**
```typescript
import { Capability, ROLE_CAPABILITIES } from 'shared-types';
export const can = (role: string, cap: Capability): boolean =>
  ROLE_CAPABILITIES[role]?.includes(cap) ?? false;
// Usage: {can(user.role, Capability.APPROVE_MARGIN_EXCEPTION) && <ApproveButton />}
```

> The full `ROLE_CAPABILITIES` map (role -> Capability[]) is defined in `shared-types` alongside the enum. See the Backend_SRS §8.3 matrix for the human-readable permission table this maps to.
---

## 9. Business Rule Engines (`src/core/**` — pure & tested)

### 9.1 Money & rounding (NEW-FR-012)
- Internal comparisons on unrounded `Decimal`.
- Display/invoice rounding: half-up, 2dp.
- Success fee: `round(attributedBase × planRate, 2)`.

### 9.2 Attribution engine (RES-01/03/17, NEW-FR-010/011)
1. Order reaches its attribution event: digital payment `paid`, or COD `delivered` (use confirmed order value).
2. Determine credit:
   - conversation 100% AI-handled + purchase within window (default 24h) → `AI_FULL`.
   - human participated → `SPLIT`, default AI share `0%` (configurable per workspace).
   - recovered by Aaed → `FOLLOWUP` (feeds "Revenue Recovered").
   - multiple conversations/order → first-touch default.
3. Persist immutable `AttributionEvent`.
4. Reversal: refund within 7 days of attribution event → mark `REVERSED`, create reversal event, fee credit to next invoice (RES-08). Refunds after 7 days do NOT reverse (NEW-ORD-002).
5. Fees computed on **conservative base only** (100% AI-handled) (BR-ATT-004).

### 9.3 Margin guard — Hafeth (RES-12/15, NEW-FR-027)
- Evaluate at order/quote **aggregate**: `margin = (Σprice − Σcost) / Σprice` after discounts.
- Bands (floor default 0.20, per-category via `MarginRule`):
  - margin ≥ floor → `AUTO_APPROVED`.
  - `0 < margin < floor` → exception → owner approval (default auto-reject 1h).
  - margin ≤ 0 → `BLOCKED` + alternatives suggestion + owner notification.
- Runs before any quote/payment-link goes to customer (FR-010/US-007). Audit-log every decision. Deterministic (NEW-NFR-003).

### 9.4 Follow-up policy — Aaed (RES-05, NEW-FR-028)
- Abandonment: ≥ 2h inactivity + buying intent (BR-FOL-006).
- Schedule follow-up after 24h detection clock; send at `max(optimalTime, lastSentAt + 48h)`.
- Max 3 attempts/conversation; stop on opt-out/blocked/"bought elsewhere"/"no".
- Timing model failure → default next day 10:00 local (BR-FOL-008).

### 9.5 Billing & subscription (RES-16/20, NEW-FR-014/015)
- Plans (USD): Starter $49/500 convos · Growth $149/2,000 + 1% · Pro $399/10,000 + 0.5% · Enterprise custom (A1).
- Lifecycle: `TRIALING → ACTIVE | CANCELLED`; `ACTIVE → PAST_DUE → ACTIVE | CANCELLED`; cancel end-of-period; upgrade prorated; downgrade next period.
- Overage: alert at 80%/100%; grace to period end; if prior period exceeded and no upgrade → 48h notice → new-conversation soft-lock (`PAYMENT_REQUIRED` for AI handling).
- Usage meter = conversation count (RES-02: AI credits informational only).

### 9.6 Success fees & dispute hold (RES-08/09, NEW-FR-016)
- Monthly revenue-share statement; disputed fees marked `pending` and held (`BillingInvoice.status = HOLD` for the disputed amount).
- Dispute auto-resolves after 14 days (owner adjudication in V2 UI; resolution can reverse attribution → credit).

### 9.7 Tax/VAT (NEW-FR-013, OPEN-02)
- VAT applied when workspace tax profile enabled: EG 14%, KSA 15% (per country), plus merchant tax ID on invoice.
- VAT disabled by default until tax profile configured.

### 9.8 Segmentation (NEW-SEG-001)
`NEW` (<30d, no purchase) · `ONE_TIME` (1 purchase, none in 60d) · `FREQUENT` (≥3 in 90d) · `VIP` (top 10% spend or ≥5 purchases) · `AT_RISK` (previously frequent, none in 60d). Recompute on order/payment events (cron + event-driven).

### 9.9 Conversation ops — labels, assignment, escalation (NEW-FR-025/026)
- **Labels:** team labels via CRUD (`/labels`); agents can apply any team label; AI auto-labels (`source = AI`) from conversation content/intent via `ai.label` queue — owner/manager can review and disable auto-labeling per label. Applying/removing a label is audited.
- **Auto-assignment:** on new conversation, if enabled, `AssignmentRule` selects an agent deterministically: `ROUND_ROBIN` (last-assign rotation) or `LOAD_BALANCED` (lowest open count) or `SKILL_BASED` (configured skill→agent map). `MANUAL` = default (no auto-assign). Skips when no rule condition (channel/segment/skill) matches.
- **Escalation rules:** `EscalationRule` fires when conditions match (`TIME` inactivity, `SENTIMENT` negative, `CONFIDENCE` below threshold, `KEYWORD` match, `EXPLICIT` customer request) and triggers the configured action (notify manager / force human takeover). Rules are ordered; first match wins. Escalation is logged to the conversation timeline.

### 9.10 Lead qualification (NEW-QUAL-001)
HOT = explicit buying intent/payment request; WARM = product/price/availability engagement; COLD = browse/general. AI-suggested, human-overridable.

---

## 10. State Machines (RES-18 — definitive)

**Order:** `PENDING → CONFIRMED → PAID → PROCESSING → SHIPPED → DELIVERED`; `PENDING/CONFIRMED → CANCELLED` (releases stock); COD: `PENDING/CONFIRMED → SHIPPED` (after address confirm) `→ DELIVERED → PAID`; `PAID/DELIVERED → REFUNDED`. `PROCESSING → CANCELLED` requires manager/owner approval. No cancel from `PAID/SHIPPED/DELIVERED` except via `REFUNDED`.

- NEW-ORD-001: stock reserved at creation, committed at `CONFIRMED`, restored on `CANCELLED`/`REFUNDED`.
- NEW-ORD-002: refunds > 7d after attribution event do NOT reverse attribution (permitted, audited).

**Invoice:** `DRAFT → SENT → (PAID | OVERDUE)`; `OVERDUE → PAID`; `DRAFT/SENT/OVERDUE → CANCELLED` (void, reason, owner/accountant only). Numbering `WS-YYYY-NNNNN` per workspace (A13/NEW-INV-001). **Partial payments:** `amount_paid` accumulates via `POST /invoices/:id/payments`; status stays `SENT`/`OVERDUE` until `amount_paid = amount`, then `PAID`.

**Payment:** `PENDING → PAID | FAILED | EXPIRED`; `FAILED/EXPIRED → PENDING` (retry/regenerate); `PAID → REFUNDED`. Link one-time token; new link invalidates previous (NEW-PAY-001).

**Conversation:** `OPEN → CLOSED → ARCHIVED`; `CLOSED → OPEN` on new inbound; stage drives handler (`AI_HANDLING → HUMAN_MONITORING → HUMAN_HANDLING → FOLLOWUP → CLOSED`) (NEW-CONV-001).

**Subscription:** per §9.5.

**Integration:** `PENDING → ACTIVE | ERROR | DISABLED`; `ERROR → ACTIVE` via reconnect (retry + owner notification) (NEW-INT-001).

**AttributionEvent:** `ACTIVE → REVERSED` (via refund or dispute resolution); immutable otherwise (NEW-FR-010).

---

## 11. Domain Modules & Services

### 11.1 Auth & Workspace
`AuthService` (register/login/refresh/logout/2FA/reset) · `WorkspaceService` (CRUD, invites, tax profile) · `PermissionService` · `SessionService`.
Events: `UserRegistered` · `UserInvited` · `WorkspaceCreated`.

### 11.2 Conversations & Messaging
`ConversationService` (list/filter/search/assign/claim/transfer/escalate/close) · `MessageService` (ingest/store/retrieve) · `RoutingService` (AI vs human) · `TemplateService` · `LabelService` (CRUD + apply/remove, audited) · `AssignmentService` (auto-assignment rules) · `EscalationService` (rule evaluation + actions).
Queues: `message.ingested` · `message.route` · `conversation.escalate` · `conversation.assign` · `conversation.escalation`.
Events: `MessageReceived` · `ConversationAssigned` · `ConversationEscalated` · `ConversationClosed`.

### 11.3 AI Engine
`LLMOrchestrator` (model select, prompt assemble, parse) · `PromptManager` · `ContextAssembler` (last 20 msgs + catalog RAG + customer summary) · `ToolExecutor` (product_search, check_inventory, calculate_price, generate_payment_link, create_order, escalate_to_human, schedule_followup) · `GuardrailService` (BR-AI-001..003, cost-price never, delivery never promised, no payment link under margin floor, catalog-grounded) · `ConfidenceScorer` (3-tier RES-04) · `TranslationService` (customer dialect → formal Arabic, `POST /conversations/:id/translate`) · `SentimentService` (`POSITIVE`/`NEUTRAL`/`NEGATIVE`) · `SummarizerService` (ai_summary refresh) · `AutoLabelService` (label suggestions from intent/content).
Queues: `ai.generate` · `ai.evaluate` · `ai.summarize` · `ai.label`.
Events: `AIResponseGenerated` · `GuardrailTriggered`.

### 11.4 Catalog & Inventory
`ProductService` · `VariantService` · `CategoryService` · `InventoryService` (reservation/commit/restore, non-negative, alerts) · `SyncService` (Shopify/WooCommerce/Salla/Zid).
Queues: `catalog.sync` · `inventory.alert`.

### 11.5 CRM
`CustomerService` (CRUD/search/merge) · `SegmentationService` · `JourneyService`.
Events: `CustomerCreated` · `SegmentChanged`.

### 11.6 Orders / Invoices / Payments
`OrderService` · `InvoiceService` · `PaymentService` (links, webhooks, refunds, partial payments — multiple `Payment` rows per invoice; `Invoice.amount_paid` aggregates) · `CollectionsService` (V2: schedule scaffolding only for Munjiz V3).
Queues: `payment.process` · `payment.confirm` · `invoice.generate`.

### 11.7 Attribution
`AttributionService` — records events, evaluates reversals, computes conservative fee base.
Events: `AttributionCreated` · `AttributionReversed` · `DisputeOpened`.

### 11.8 Analytics
`MetricsService` · `DashboardService` · `AttributionService` (aggregation). `ReportService` is **V3-deferred** (custom reports — do not build in V2).
Queues: `analytics.aggregate` (hourly) · `analytics.report` (V3-deferred).
Endpoints (V2): dashboard, revenue, conversations, team, margin, collections. Reports endpoints are V3-deferred.

### 11.9 Billing
`SubscriptionService` · `UsageService` · `RevenueShareService` · `BillingInvoiceService` (fee credit, dispute hold, VAT).
Queues: `billing.invoice` (monthly) · `billing.remind`.

### 11.10 Notifications
`NotificationService` · `PreferenceService`. Channel adapters: in_app, email (SendGrid), whatsapp, push (Firebase).
Queue: `notification.send`.

### 11.11 Integrations
`IntegrationService` (connect/monitor, encrypted secrets) · `WebhookService` (verify, dedupe, route) · `SyncService`.
Queue: `webhook.process` · `integration.sync`.

### 11.12 Administration
Workspace settings, user/role admin, AI config, security (sessions, 2FA, audit, export), data retention jobs.

---

## 12. Queues, Jobs & Scheduling (BullMQ)

| Queue | Producer → Worker | Trigger / Schedule |
|---|---|---|
| `message.ingested` | channel webhooks → ingest+store | event |
| `message.route` | ingest → routing (AI/human) | event |
| `ai.generate` | routing → orchestrator → tool exec → send | event |
| `ai.evaluate` | generated → post-hoc eval | periodic |
| `conversation.escalate` | routing → agent notify + WS push | event |
| `conversation.assign` | new conversation → auto-assignment rule → assign | event |
| `conversation.escalation` | escalation-rule evaluator → action | event + periodic |
| `ai.summarize` | summary + sentiment refresh | event + periodic |
| `ai.label` | AI auto-labeling | event |
| `followup.schedule` | abandonment detector → cadence engine | cron (every 15 min) + event |
| `followup.send` | scheduler → Aaed message send | delayed jobs |
| `catalog.sync` | sync triggers | cron + webhook |
| `inventory.alert` | inventory engine → notifications | event |
| `payment.process` | payment link → provider call | event |
| `payment.confirm` | provider webhook → order/attribution | event (idempotent) |
| `attribution.evaluate` | order paid/delivered/refunded → events | event |
| `analytics.aggregate` | snapshots | hourly cron |
| `analytics.report` | scheduled reports | cron |
| `billing.invoice` | monthly statements | monthly cron |
| `billing.remind` | invoice payment reminders | cron |
| `billing.usage` | usage alerts (80/100%), soft-lock | cron (hourly) |
| `notification.send` | any → channel adapters | event |
| `segment.recompute` | RFM recompute | event + cron |
| `retention.archive` | cold-archive/delete per retention | daily cron |
| `integration.reconnect` | error-state reconnects | cron (retry w/ backoff) |

Cron timezone: workspace tz; retry policy exponential backoff; failed jobs → DLQ + alert. All financial jobs idempotent.

---

## 13. Real-Time API (for the frontend)

- **WebSocket** namespace `/ws` authenticated via JWT:
  - `conversation:new` · `conversation:update` · `message:new` (inbox streaming) · `typing` · `read`
  - `notification:new` · `margin:exception` (owner) · `attribution:update`
- SSE fallback for environments without WS.
- Frontend reconnects with backoff; events carry `conversation_id` + workspace scope.

---

## 14. REST API Specification

Base: `https://api.waslah.ai/v1`. All endpoints require `Authorization: Bearer <JWT>` unless marked PUBLIC. Envelope per §5.1. Pagination per §5.3. All listing endpoints tenant-scoped by workspace (from session).

### 14.1 Auth & Workspace
| Method | Path | Perm | Purpose |
|---|---|---|---|
| POST | `/auth/register` | PUBLIC | create account + workspace + trial (rate 10/min) |
| POST | `/auth/login` | PUBLIC | password login; `{ email, password, otp? }` |
| POST | `/auth/refresh` | PUBLIC | rotate refresh token |
| POST | `/auth/logout` | auth | revoke session |
| POST | `/auth/2fa/enable` | auth | TOTP enable (V2) |
| POST | `/auth/2fa/verify` | auth | confirm setup |
| GET | `/workspace` | owner+ | workspace profile incl. tax profile |
| PUT | `/workspace` | owner | update business info, currency, tz, tax profile |
| GET | `/workspace/users` | owner/admin | list members |
| POST | `/workspace/users` | owner/admin | invite (`{ email, role }`) |
| PUT | `/workspace/users/:id/role` | owner/admin | change role (audit) |
| DELETE | `/workspace/users/:id` | owner | remove member |
| POST | `/workspace/users/:id/resend` | owner/admin | resend invite |

### 14.2 Conversations & Messaging
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/conversations` | per RBAC | list w/ filters (channel, status, assigned_to, q, segment, date range) |
| GET | `/conversations/:id` | per RBAC | detail + customer sidebar data |
| GET | `/conversations/:id/messages` | per RBAC | paginated thread |
| POST | `/conversations/:id/messages` | agent+ | human send; `{ content, content_type }` |
| POST | `/conversations/:id/assign` | manager+ | assign `{ user_id }` |
| POST | `/conversations/:id/claim` | agent | claim unassigned |
| POST | `/conversations/:id/transfer` | manager+ | transfer `{ user_id }` |
| POST | `/conversations/:id/escalate` | agent+ | `{ reason }` |
| POST | `/conversations/:id/close` | agent+ | close + resolution |
| POST | `/conversations/:id/return-to-ai` | agent+ | hand back to Wasel |
| POST | `/conversations/:id/translate` | agent+ | translate message/thread (customer dialect → formal Arabic) |
| POST | `/conversations/:id/refresh-summary` | agent+ | regenerate AI summary + sentiment |
| GET | `/conversations/:id/timeline` | per RBAC | event log (NEW-FR-010 audit for dispute) |
| GET | `/templates` | agent+ | message templates list (`?scope=personal\|team`, defaults TEAM) |
| POST | `/templates` | owner/admin | create template (NEW-FR-019) |
| PUT | `/templates/:id` | owner/admin | update template |
| POST | `/templates/:id/approval` | owner/admin | request/refresh provider approval status (stateful action → POST) |
| GET | `/labels` | agent+ | list labels (team + personal) |
| POST | `/labels` | owner/admin | create label (`{ name, color }`) |
| PUT | `/labels/:id` | owner/admin | update label (audit) |
| DELETE | `/labels/:id` | owner/admin | delete label (removed from conversations) |
| PUT | `/conversations/:id/labels` | agent+ | set conversation labels `{ label_ids: [] }` (audited) |

### 14.3 AI Agents
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/agents` | owner/admin | list agent configs |
| GET | `/agents/:type` | owner/admin | config detail (wasel/aaed/hafeth) |
| PUT | `/agents/:type` | per RBAC | update config (owner/admin; manager w/ approval) |
| POST | `/agents/wasel/train` | owner/admin | FAQ/knowledge-base upload |
| GET | `/agents/aaed/followups` | manager+ | follow-up schedule/status |
| POST | `/agents/hafeth/rules` | owner/admin | margin rules CRUD |
| GET | `/agents/hafeth/decisions` | owner/admin/accountant | margin decision audit |
| POST | `/agents/hafeth/decisions/:id/approve` | owner | approve exception (within 1h) |
| POST | `/agents/hafeth/decisions/:id/reject` | owner | reject exception |

### 14.4 Catalog & Inventory
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/products` | all roles | list w/ filters + search |
| POST | `/products` | owner/admin | create (w/ variants; optional `currency` defaults to workspace currency) |
| GET | `/products/:id` | all roles | detail (cost filtered per NEW-SEC-001) |
| PUT | `/products/:id` | owner/admin | update (audit) |
| DELETE | `/products/:id` | owner/admin | soft-disable/delete |
| POST | `/products/import` | owner/admin | CSV/Excel (template download, preview, error report) |
| GET | `/products/export` | owner/admin | CSV export |
| GET | `/products/:id/variants` | all roles | variants |
| POST | `/products/:id/variants` | owner/admin | add variant |
| PUT | `/inventory/:productId` | owner/admin/manager | adjust stock (reason, audit) |
| GET | `/inventory/alerts` | owner/admin | low-stock/out-of-stock alerts |
| GET | `/categories` | all roles | category tree |
| POST | `/categories` | owner/admin | create category |

### 14.5 Customers (CRM)
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/customers` | per RBAC | list w/ segment filter + search |
| GET | `/customers/:id` | per RBAC | profile (history, LTV, AOV, segment) |
| PUT | `/customers/:id` | agent+ | update (tags, qualification override) |
| GET | `/customers/:id/orders` | per RBAC | order history |
| GET | `/customers/:id/conversations` | per RBAC | conversation history |
| GET | `/customers/:id/notes` | agent+ | internal notes |
| POST | `/customers/:id/notes` | agent+ | add note |
| GET | `/customers/segments` | per RBAC | segment sizes + values |
| POST | `/customers/:id/merge` | owner/admin | merge duplicates |

### 14.6 Orders / Invoices / Payments
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/orders` | per RBAC | list w/ filters |
| POST | `/orders` | agent+ | create order (margin check runs) |
| GET | `/orders/:id` | per RBAC | detail |
| PUT | `/orders/:id` | agent+ | edit items (audit) |
| PUT | `/orders/:id/status` | agent+ | state transition (machine-guarded) |
| POST | `/orders/:id/cancel` | manager+ (processing→cancel) | cancel w/ reason |
| GET | `/invoices` | owner/admin/accountant | order invoices |
| POST | `/invoices/:id/send` | agent+ | send invoice |
| POST | `/invoices/:id/void` | owner/accountant | void + reason |
| POST | `/payments/link` | agent+ | `{ order_id, method }` → `{ url, expires_at }` |
| POST | `/invoices/:id/payments` | owner/admin/accountant | record partial payment `{ amount, method }`; increments `amount_paid`, settles invoice when fully paid |
| GET | `/payments` | per RBAC | payment list (multiple rows per invoice for partial payments) |
| POST | `/payments/:id/refund` | owner/admin/accountant | refund (triggers attribution check) |
| GET | `/payments/:id` | per RBAC | detail + provider status |
| GET | `/orders/:id/timeline` | per RBAC | order event timeline |

### 14.7 Attribution & Disputes
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/attribution/events` | owner/admin/accountant | events list (filter by status) |
| GET | `/attribution/events/:id` | owner/admin/accountant | detail + reversal chain |
| GET | `/attribution/revenue` | owner/admin | MAR/recovered/conservative base summaries |
| GET | `/disputes` | owner/admin | dispute records |
| POST | `/disputes` | owner | open dispute on attribution event (reason) |
| POST | `/disputes/:id/resolve` | owner | resolve (hold releases / reversal) |
| GET | `/disputes/:id` | owner/admin | detail |

### 14.8 Analytics
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/analytics/dashboard` | per RBAC | today/week/month cards + sparklines |
| GET | `/analytics/revenue` | per RBAC | by day/week/month, channel, agent, product, segment |
| GET | `/analytics/conversations` | per RBAC | totals, AI resolution, escalation, abandonment, recovery |
| GET | `/analytics/team` | manager+ | per-agent metrics |
| GET | `/analytics/margin` | owner/admin/accountant | avg margin, guard events, discount depth |
| GET | `/analytics/collections` | owner/admin/accountant | invoiced/collected/DSO (V2 scaffolding) |
| GET | `/analytics/export` | owner/admin | CSV/PDF export of current view |
| POST | `/reports` | owner/admin | create report config — **V3-deferred** |
| GET | `/reports` | owner/admin | list — **V3-deferred** |
| GET | `/reports/:id` | owner/admin | run + fetch — **V3-deferred** |

### 14.9 Billing
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/billing/plans` | auth | plan catalog |
| GET | `/billing/subscription` | owner | current subscription + usage + limits |
| POST | `/billing/subscribe` | owner | subscribe/upgrade (prorated) |
| POST | `/billing/cancel` | owner | cancel end-of-period |
| GET | `/billing/usage` | owner | usage by period + alerts |
| GET | `/billing/invoices` | owner | billing invoices + statements |
| GET | `/billing/invoices/:id` | owner | detail incl. hold/disputed breakdown |
| POST | `/billing/payment-method` | owner | set payment method |
| GET | `/billing/revenue-share` | owner/accountant | monthly statements + fee credits |

### 14.10 Integrations
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/integrations` | per RBAC | list + status |
| POST | `/integrations` | owner/admin | connect provider (OAuth redirect) |
| GET | `/integrations/:id` | owner/admin | detail |
| PUT | `/integrations/:id` | owner/admin | config/reconnect |
| DELETE | `/integrations/:id` | owner/admin | disconnect (audit) |
| POST | `/integrations/:id/sync` | owner/admin | trigger sync |
| GET | `/integrations/:id/syncs` | owner/admin | sync runs + conflict log (NEW-FR-029) |

### 14.11 Notifications
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/notifications` | auth | inbox (paginated) |
| PUT | `/notifications/:id/read` | auth | mark read |
| PUT | `/notifications/read-all` | auth | mark all read |
| GET | `/notifications/preferences` | auth | preferences |
| PUT | `/notifications/preferences` | auth | update preferences |

### 14.12 Admin & Settings
| Method | Path | Perm | Purpose |
|---|---|---|---|
| GET | `/settings/workspace` | owner | workspace settings |
| PUT | `/settings/workspace` | owner | update |
| GET | `/settings/ai` | owner/admin | AI config |
| PUT | `/settings/ai` | owner/admin | update (model, temperature, confidence) |
| GET | `/settings/assignment-rules` | owner/admin | auto-assignment rule config |
| PUT | `/settings/assignment-rules` | owner/admin | update (strategy, skills, enabled) |
| GET | `/settings/escalation-rules` | owner/admin | escalation rules (manager: read) |
| PUT | `/settings/escalation-rules` | owner/admin (manager w/ approval) | upsert/order escalation rules |
| GET | `/settings/security` | owner | security summary |
| POST | `/settings/export` | owner/admin | data export (GDPR/PDPL) |
| GET | `/audit-log` | owner/admin | audit entries (filterable, paginated) |
| GET | `/health` | PUBLIC | liveness/readiness incl. db/redis |
| GET | `/health/deep` | PUBLIC | dependency checks |

---

## 15. Webhooks (PUBLIC)

| Endpoint | Provider | Verification | Notes |
|---|---|---|---|
| `POST /webhooks/whatsapp` | Meta | `X-Hub-Signature-256` HMAC-SHA256 | messages + statuses; 24h session logic |
| `POST /webhooks/instagram` | Meta Graph | `X-Hub-Signature-256` | IG DM inbox |
| `POST /webhooks/messenger` | Meta Graph | `X-Hub-Signature-256` | Messenger inbox |
| `POST /webhooks/payments/fawry` | Fawry | provider HMAC | payment result |
| `POST /webhooks/payments/mada` | Gateway | gateway HMAC | via HyperPay/Tap |
| `POST /webhooks/payments/tabby` | Tabby | signature | checkout result |
| `POST /webhooks/payments/paymob` | Paymob | HMAC `PAYMOB-SIGNATURE` | Egypt-critical; payment result/refund (NEW-FR-022 v2.2) |
| `POST /webhooks/payments/stripe` | Stripe | `Stripe-Signature` (webhook secret) | international cards; payment_intent / charge events |
| `POST /webhooks/ecommerce/shopify` | Shopify | HMAC `X-Shopify-Hmac-Sha256` | orders/products/customers |
| `POST /webhooks/ecommerce/woocommerce` | Woo | secret | orders/products |
| `POST /webhooks/ecommerce/salla` | Salla | signature | orders/products |
| `POST /webhooks/ecommerce/zid` | Zid | signature | orders/products |
| `POST /webhooks/shipping/bosta` | Bosta | signature | delivery status (shipped/delivered/failed) |
| `POST /webhooks/shipping/aramex` | Aramex | signature | delivery status |
| `POST /webhooks/shipping/smsa` | SMSA | signature | delivery status |

Shipping `delivered` events are the COD attribution trigger (RES-01: COD credit on delivery confirmation) → feed `attribution.evaluate`.

Processing contract: verify signature → **idempotent dedupe** (`provider + event_id`) → persist → enqueue `webhook.process` → return `200 OK` fast. Failure → retry with backoff → DLQ (NEW-FR-018/020).

---

## 16. Integrations Reference

| Provider | Type | Protocol | Auth | Sync | Constraints |
|---|---|---|---|---|---|
| WhatsApp Business API | channel | REST + webhook | Meta OAuth2/BSP | — | 80 msg/s; templates pre-approved (NEW-FR-019); session ≤24h; media upload/download |
| Instagram DM | channel | Graph API + webhook | Meta OAuth2 | — | IG-specific types; 200 calls/h |
| Messenger | channel | Graph API + webhook | Meta OAuth2 | — | as IG |
| Shopify | e-commerce | REST/GraphQL + webhook | OAuth2 | full + webhooks | products/orders/customers/inventory |
| WooCommerce | e-commerce | REST + webhook | consumer key/secret | full + webhooks | as Shopify |
| Salla | e-commerce | REST | OAuth2 | bidirectional, last-write-wins + conflict log | KSA-critical |
| Zid | e-commerce | REST | API keys | bidirectional, last-write-wins + conflict log | KSA-critical |
| Fawry | payment | REST | API key + HMAC | — | link gen/status/refund |
| Mada | payment | REST (HyperPay/Tap) | keys | — | card via gateway |
| Tabby / Tamara | payment (BNPL) | REST | OAuth2/keys | — | checkout session, status |
| Paymob | payment | REST + webhook | API key + HMAC | — | Egypt-critical; link gen/status/refund |
| Stripe | payment | REST + webhook | API key | — | international cards |
| Bosta | shipping | REST + webhook | API key | — | Egypt; delivery events → COD attribution |
| Aramex | shipping | REST + webhook | API key | — | delivery events → COD attribution |
| SMSA | shipping | REST + webhook | API key | — | KSA; delivery events → COD attribution |
| Twilio | comms | REST | keys | — | SMS fallback (NEW-FR-020) |
| SendGrid | comms | REST | key | — | email notifications |
| Firebase (FCM) | comms | REST (`firebase-admin` SDK) | service account | -- | Push notifications to owner; **required for margin:exception approval flow** (1h auto-reject window per RES-15; FCM triggered by `margin.exception` queue worker); future mobile app notifications |
| Voice transcription | AI media | provider abstraction | key | — | AR/EN/Arabizi (NEW-FR-023) |
| Image recognition | AI media | provider abstraction | key | — | catalog matching (NEW-FR-024) |

All provider credentials encrypted at rest (AES-256); never logged.

---

## 17. Security Requirements

- AuthN: JWT access (15m) + rotating refresh (30d), bcrypt password (≥12 chars policy, complexity).
- 2FA (TOTP + SMS fallback) — **V2** (RES-10); enforced at login when enabled.
- Transport TLS 1.3; at-rest AES-256; secrets in env/vault only.
- Webhook HMAC verification + idempotency (NEW-FR-018).
- Rate limits (§5.8). Parameterized queries/ORM (SQLi). Output encoding + CSP + `helmet` (XSS).
- Cost price confidentiality (NEW-SEC-001). PCI: never store card data; tokenize via providers.
- Audit logging (NEW-FR-017). Data export + deletion (GDPR/PDPL) + retention (RES-13/NEW-NFR-002). PDPL residency option (NEW-NFR-001).
- Session timeout 30 min idle; session revocation on password change/security event.

---

## 18. Non-Functional Requirements

| Category | Target |
|---|---|
| AI response first-byte / full | < 3s / < 5s |
| Dashboard API | < 2s |
| API p95 | < 500ms |
| Message ingestion | < 3s |
| Concurrent conversations / workspace | > 1,000 |
| Throughput | > 10,000 msgs/min |
| Uptime | 99.9% (RTO < 4h, RPO < 1h) |
| Backups | point-in-time, 30-day retention |
| Scalability | horizontal auto-scale on queue depth; read replicas; PgBouncer; Redis cache 99% catalog hit |
| Observability | structured logs, Prometheus/Grafana, OpenTelemetry traces, Sentry, LLM call logging (NEW-NFR-004) |
| AI cost | blended < $0.05/conversation (NEW-BR-001) |
| Retention | conversations cold-archive 365d; analytics 730d; financial 10y (RES-13) |

---

## 19. Testing Strategy

- **Unit (must-have):** `src/core/**` — attribution (incl. reversal/COD), margin guard bands, follow-up cadence (max 3, 48h, stop conditions), billing (trial/proration/overage/soft-lock/fee credit/dispute hold), assignment policy (round-robin/load-balanced), escalation-rule trigger evaluation, money rounding. Target coverage > 90% for core.
- **Integration:** service + DB (Postgres test container); state-machine transitions; RBAC matrix; idempotent webhook replay; queue worker happy/error paths; partial-payment recording + invoice settlement; labels CRUD + auto-label; auto-assignment on new conversation; escalation-rule actions. AI translation/sentiment/auto-label run against the `mock` provider in CI.
- **E2E:** register → connect sandbox channel → message → AI respond → payment link (mock) → paid → attribution event created.
- **Perf/load:** message ingestion, AI path latency, dashboard under concurrency.
- Commands: `npm run typecheck`, `npm test` (vitest), `npm run build` must be green on CI.

---

## 20. CI/CD & Ops

- CI: lint → typecheck → unit → integration → build → e2e (sandbox). Env-secrets via vault; migrations run as release step.
- Deploy: Docker images; auto-scale workers on queue depth; cron in a dedicated scheduler; rollback = previous image + migration-safe code.
- Alerts: P0 (downtime, ingestion failure), P1 (AI error rate, queue depth, billing job failures), P2 (latency, cost per conversation).

---

## 21. Acceptance Criteria (backend ship gate)

- [ ] Auth/RBAC enforced on every endpoint per §8.3; owner-only powers verified.
- [ ] Attribution events persisted & reversible per NEW-FR-010/011; fee base conservative; refund/dispute reversal tests pass.
- [ ] Margin guard runs pre-quote/payment-link; bands + 1h auto-reject + audit pass (NEW-FR-027).
- [ ] Follow-up cadence (max 3 / 48h / stop conditions) enforced (NEW-FR-028).
- [ ] Subscription lifecycle incl. trial, proration, overage 80/100% alerts, 48h soft-lock (NEW-FR-014/015).
- [ ] Billing invoice + dispute hold + fee credit + VAT (when enabled) verified (NEW-FR-013/016/021).
- [ ] Money is Decimal(14,2); deterministic core only (NEW-FR-012/NEW-NFR-003).
- [ ] Webhook idempotency + retry/DLQ verified by replay tests (NEW-FR-018/020).
- [ ] WhatsApp + IG + Messenger sandbox round-trip; Salla/Zid sync with conflict log (NEW-FR-022/029).
- [ ] Voice transcription + image recognition wired via provider abstraction (mock OK) (NEW-FR-023/024).
- [ ] Labels CRUD + AI auto-labeling + auto-assignment + escalation-rule config verified (NEW-FR-025/026).
- [ ] Translation, sentiment, and summary-refresh endpoints serve the V2 UI (mock OK).
- [ ] Partial payments recorded; invoice `amount_paid`/remaining tracked until PAID.
- [ ] Multi-currency product pricing stored and returned (per-product currency).
- [ ] Shipping webhooks (Bosta/Aramex/SMSA) drive COD attribution; Paymob/Stripe links verified in sandbox (NEW-FR-011).
- [ ] Custom reports + team leaderboard + revenue-opportunity score are NOT built in V2 (V3-deferred).
- [ ] State machines enforced; audit log populated on all listed events (NEW-FR-017).
- [ ] Cost price hidden from Agent/Viewer/AI (NEW-SEC-001).
- [ ] Metrics/observability/retention jobs operational.

---

*Backend SRS v2.2 · Supersedes conflicting detail in the base SRS · Trace IDs: FR-, NEW-FR-, US-, RES- (see docs/Waslah_AI_Revenue_Guardian_SRS_V2.md).*
