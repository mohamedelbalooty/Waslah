# Waslah — AI Revenue Guardian
## Software Requirements Specification — V2
### Version 2.1 | August 2026

> **How to read this document:** This is the **V2 baseline** requirements document. It builds on the v2.0 product SRS (`Waslah_AI_Revenue_Guardian_SRS.md`, "the base SRS") and the flattened `Waslah_Feature_List.md`, and **resolves every open question, risk, contradiction, ambiguity, assumption, and missing requirement** identified in the requirements audit. It is the authoritative input for the V2 backend implementation.

---

## 01 Purpose & Relationship to Prior Documents

| Concern | Value |
|---|---|
| **Purpose** | Consolidated, implementation-ready requirements for **V2** ("Wasel + Aaed + Hafeth"), including the MVP foundations V2 depends on |
| **Base documents** | Waslah SRS v2.0 (Aug 2026) · Waslah Feature List |
| **V2 identity** | Months 4–8. "Natural expansion from sales to recovery to margin." (SRS §08) |
| **Decisions baked in** | All resolved business decisions (RES-xx), resolved risks, resolved open questions, new functional requirements (NEW-FR-xx), state machines, RBAC matrix, assumptions, and remaining stakeholder-owned questions |
| **Compliance rule** | Where this document differs from the base SRS, **this document wins**. Every intentional change is cross-referenced to its decision ID |

---

## 02 V2 Scope

### 02.1 In scope (V2)

| Area | Feature | Source |
|---|---|---|
| Channels | **Instagram DM** + **Facebook Messenger** adapters (unified inbox) | SRS §08 |
| Recovery | **Aaed** — Follow-up & Recovery Agent, abandonment detection, re-engagement | SRS §08 |
| Margin | **Hafeth** — Margin Guard basic rules engine + exception approval workflow | SRS §08 |
| Multi-user | Owner/Admin/Manager/Agent/Accountant/Viewer RBAC, invites, conversation assignment & ownership | SRS §08 |
| CRM | Basic CRM — customer profiles, conversation history, order history, notes, auto-segments | SRS §08 |
| E-commerce | **Salla** and **Zid** integration | SRS §08 |
| Media | Voice note transcription · image recognition (customer sends product photo) | SRS §08 |
| Billing | Automated invoicing, revenue-share fee engine, trial, overage policy, dispute hold | Feature List §7 |
| Analytics | Revenue by agent/channel/product/segment; margin dashboard; full conversational metrics | Feature List §6 |
| App | Mobile app (iOS/Android) — **DEFERRED** (decision: web-first; mobile is a separate workstream) | DECISION |

### 02.2 Explicitly out of V2

Munjiz (Collections) · Rased (Inventory) · Murshid (Team Performance) · Thaqib (Daily Briefing) · native mobile apps · ERP integrations (Odoo/Zoho) · Voice AI calls · Third-party agent marketplace · Video commerce · Multi-number WhatsApp (future) · COD fraud scoring · e-invoicing engine.

**Decision RES-07:** ERP (Odoo/Zoho) is removed from any near-term scope per SRS §10 triage and Feature List "Out of Scope". QuickBooks/Xero **accounting** integrations remain V3.

---

## 03 V2 Dependencies on MVP

V2 is built on the MVP core. The following MVP capabilities are **required preconditions** and are treated as in-scope for the V2 implementation effort:

1. WhatsApp Business API ingestion (webhooks, message storage, delivery status)
2. Product catalog (CRUD, variants, bulk import, Shopify/WooCommerce sync)
3. Wasel (AI Sales Closer) — Arabic/English/Arabizi, intent classification, knowledge retrieval, response generation
4. Payment links (Fawry/COD minimum) + order/invoice creation
5. Human escalation with full context transfer
6. Revenue attribution (MVP conservative model)
7. Owner dashboard (mobile-responsive web)
8. Billing foundations: plans, usage counter, manual plan handling

**Decision RES-11:** MVP is owner-only. The onboarding "team invitation" step is **hidden/disabled** in MVP and **enabled in V2** with RBAC.

---

## 04 Architecture (V2)

Layered modular backend, single codebase, queue-driven async processing.

```
API Gateway (REST /v1) ──► Auth + RBAC ──► Domain Modules
                                              ├─ Auth & Workspace
                                              ├─ Catalog & Inventory
                                              ├─ Conversations & Routing
                                              ├─ AI Engine (Wasel, Aaed, Hafeth)
                                              ├─ CRM
                                              ├─ Orders / Invoices / Payments
                                              ├─ Attribution
                                              ├─ Analytics
                                              ├─ Billing & Revenue Share
                                              ├─ Notifications + Template Library
                                              └─ Integrations (channels, ecommerce, payments)
Queues (BullMQ/Redis): message.ingest · ai.generate · followup.schedule · analytics.aggregate ·
                       billing.invoice · notification.send · catalog.sync · payment.process
Events (publish on state change): MessageReceived · ConversationAssigned · ConversationEscalated ·
                                  OrderCreated · PaymentReceived · AttributionCreated · ...
```

| Constraint | Value |
|---|---|
| Language/Runtime | TypeScript / Node.js ≥20 |
| Data store | PostgreSQL (Prisma ORM), JSONB for flexible config |
| Queues | BullMQ on Redis |
| API | REST `/api/v1`; JSON schema validated; OAuth2+JWT |
| Money | Decimal(14,2); see DECISION RES-08 |
| AI | Provider abstraction (`openai` \| `anthropic` \| `mock`), cost-metered, logged |

---

## 05 Resolved Business Decisions

> These are the outcomes of the requirements audit. Each has a decision ID, a decision, and the affected requirements. **Do not reintroduce the ambiguity these resolve.**

### DECISION RES-01 — Attribution model (three distinct concepts)

The single biggest financial ambiguity. Resolved by separating **reporting**, **fee base**, and **reversal**:

| Concept | Rule | Sources honored |
|---|---|---|
| **1. Attribution credit (reporting/MAR)** | Order credited to AI when linked to a conversation where purchase completes within the 24h window. Multiple conversations for one order → **first-touch** default. AI+human in one conversation → **default split = AI 0%** (conservative), configurable per workspace | FR-009, US-006, US-004 |
| **2. Revenue-share fee base** | Only **100% AI-handled** conversations (no human participation) count for the success fee | BR-ATT-004, US-004, §09 |
| **3. Reversal** | Refund within 7 days of the **attribution event** reverses attribution → fee credit offsets next invoice (RES-08) | BR-ATT-003, US-006 |

Attribution **must** be persisted as an `AttributionEvent` (NEW-FR-010). Attribution computations are **deterministic logic — never AI** (NEW-NFR-003).

### DECISION RES-02 — "AI credit" semantics

"AI credit" = **internal cost-monitoring meter only** (LLM tokens/cost per workspace). **Never billable** in MVP/V2. The conversation counter is the sole billing meter.

### DECISION RES-03 — Metric hierarchy

- **MAR** = sum of all attributed revenue (Wasel closes + Aaed recoveries) per period — North Star.
- **Revenue Recovered** (dashboard headline) = the Aaed-recovered subset of MAR.
- **Total attributed revenue** = full MAR base across all channels/agents (fee inputs per RES-01).

### DECISION RES-04 — Confidence thresholds (3-tier, replaces binary <70%)

| Band | Behavior |
|---|---|
| ≥ 70% | Fully autonomous action |
| 50–70% | AI responds; conversation flagged + logged for **human monitoring** (no customer-visible interruption) |
| < 50% | **Immediate escalation**; AI does not respond autonomously |

Revises FR-002's "fallback if confidence <70%" → **"fallback if confidence <50%"**. Reconciled with the "Human Escalation Rate <20%" KPI.

### DECISION RES-05 — Aaed follow-up cadence

Two clocks coexist:
- **Detection clock:** a follow-up attempt is *scheduled* after 24h of customer silence (state event).
- **Send clock (hard cap):** send time = `max(optimal_time, last_followup_sent_at + 48h)`.

| Rule | Value |
|---|---|
| Max follow-ups per abandoned conversation | 3 |
| Min interval between follow-ups to same customer | 48h |
| Customer opt-out / "bought elsewhere" / "no" / blocked | Stop immediately, log outcome |

### DECISION RES-06 — Collections schedule (informational for V2; Munjiz is V3)

Canonical 5-stage sequence resolved for forward reference: −3d (gentle) · 0d (due) · +1d (soft) · +3d (firm + **payment-plan offer**) · +7d (urgent + owner escalation, sequence ends). Day +14 = human handoff **task**, not an automated reminder (preserves "max 5 reminders").

### DECISION RES-07 — ERP integrations deferred; QuickBooks/Xero stay V3

### DECISION RES-08 — Fee credit on reversal

Reversed attribution → fee credit **automatically offset against the next monthly billing invoice**. On cancellation with outstanding credit → manual refund.

### DECISION RES-09 — Dispute hold (shipped with V2 billing)

Monthly revenue-share statements list disputed amounts as **"pending"**; disputed fees are **held** from the invoice until resolution (default auto-resolve after 14 days, owner-adjudicated). Full dispute *workflow* remains V3, but the hold mechanic ships with V2.

### DECISION RES-10 — 2FA timing

All NFR security controls apply from MVP **except 2FA**, which ships in **V2** (Feature List phase authority). MVP login: password ≥12 chars, rate-limited (10/min), 30-min idle timeout, JWT.

### DECISION RES-11 — MVP owner-only; V2 enables RBAC + invites

### DECISION RES-12 — Margin guard evaluation scope

Margin guard evaluates the **order/quote aggregate**: `margin = (Σprice − Σcost) / Σprice` after all discounts. Bulk discounts therefore apply to the whole order (matches BR-MAR-006). Per-line floors optional per category.

### DECISION RES-13 — Retention schedule (formalized)

| Data | Retention |
|---|---|
| Conversations / messages | Cold archive at 365 days (preserved, not hot-queryable) |
| Analytics snapshots | 730 days |
| Billing / financial records | 10 years (tax) |
| GDPR/PDPL deletion | Overrides retention unless legal hold |

### DECISION RES-14 — WhatsApp template dependency is an explicit requirement

A per-workspace **template message library** (NEW-FR-019) is required for Aaed (and later Munjiz/Thaqib) proactive messaging. Template approval status tracked; resubmission guidance surfaced.

### DECISION RES-15 — Margin exception bands

| Condition | Outcome |
|---|---|
| Margin ≥ floor (default 20%) | Auto-approve |
| 0 < margin < floor | Exception → owner approval workflow (1h auto-reject default, configurable) |
| Margin ≤ 0 (at/below cost) | **Hard block** + alternatives (bundle/upsell/smaller discount) + owner notification |

Per-category hard floor configurable (default = cost). All decisions audit-logged (NEW-FR-017).

### DECISION RES-16 — Overage policy

1. Alert at **80%** and **100%** of plan conversation limit.
2. Beyond limit: AI **continues** handling new conversations to end of current billing period (protects merchant's customers).
3. If prior period exceeded the limit and no upgrade occurred: at renewal, AI is **soft-locked for new conversations** after 48h notice until upgrade.
4. **No per-conversation overage charge** (manual MVP billing; performance-pricing thesis). No card requirement for trial.

### DECISION RES-17 — COD attribution event

COD attribution is recorded at the **delivery-confirmation event** using the **confirmed order value**. The 7-day reversal window starts at that event, not at order creation.

### DECISION RES-18 — State transition matrices

See §09 (Domain Entities & State Machines).

### DECISION RES-19 — Role & permission additions

See §10 (Actors, Roles & Permissions). Includes **Viewer** definition, owner-only powers, Admin exclusions, and **cost-price confidentiality** (NEW-SEC-001).

### DECISION RES-20 — Trial & subscription lifecycle

- **14-day free trial**, no card required, MVP feature scope.
- `trialing → active | cancelled`; `active → past_due` (3-day grace) `→ active | cancelled`.
- Cancellation effective **end-of-period** (no mid-period refunds); upgrades **prorated** mid-period; downgrades effective next period.
- Post-cancellation: 30-day read-only data grace + export, then archival per retention.

---

## 06 Risks — Resolved

| Risk (base SRS) | V2 mitigation | Decision ref |
|---|---|---|
| R04 Attribution disputes / fee loss | Conservative fee base + dispute hold + persisted attribution events | RES-01, RES-09, NEW-FR-010/016 |
| R02 LLM hallucination | 3-tier confidence + existing guardrails (never disclose cost, never promise delivery, no link if margin < floor) + knowledge-grounding logging | RES-04, BR-AI-001..003 |
| R05 WhatsApp/BSP downtime | Retry with exponential backoff + DLQ + idempotent webhooks + Twilio SMS fallback (where configured) | NEW-FR-018/020 |
| R06 Data breach | Existing NFR stack (AES-256, TLS 1.3, RBAC, audit) + webhook idempotency prevents duplicate financial events | NEW-FR-018 |
| R01 Meta policy changes | Channel abstraction + BSP relationship + template library | RES-14 |
| Overage revenue leakage (Waslah-side) | Grace + upgrade prompt + repeat-overage soft-lock | RES-16 |
| Margin misimplementation | Order-level deterministic guardrail + exception bands + audit | RES-12/15, NEW-NFR-003 |
| COD mis-crediting | Delivery-confirmation attribution event | RES-17 |

---

## 07 New Functional Requirements (V2)

> Numbered `NEW-FR-xxx` to avoid collision with base-SRS FR-001..015. All are testable.

**NEW-FR-010 — Attribution record.** The system SHALL persist an immutable attribution event for every order–conversation link containing: workspace, order, conversation, attributed amount, type (`AI_FULL | SPLIT | HUMAN | FOLLOWUP`), model (`first_touch | split | conservative`), status (`ACTIVE | REVERSED`), reversal reason, timestamps. Attribution SHALL be reversible only via refund or dispute resolution; each SHALL create a reversal event. *(Acceptance: 100% of paid orders have ≥1 attribution event; reversal correctness verified for refunds and disputes.)*

**NEW-FR-011 — COD attribution event.** For COD orders, attribution SHALL be recorded at delivery confirmation using the confirmed order value; the 7-day reversal window SHALL start at that event.

**NEW-FR-012 — Money precision.** All monetary computations SHALL use 2-decimal precision with half-up rounding applied only at display/invoice boundaries; margin-guard and fee comparisons SHALL operate on unrounded values; success fee = `round(attributed_base × tier_rate, 2)`.

**NEW-FR-013 — Tax/VAT on fees.** Billing invoices SHALL include VAT at the workspace country's standard rate (Egypt 14%, KSA 15%) applied to subscription and success fees, plus the merchant's registered tax ID; tax application SHALL be disabled until a tax profile exists. *(Flagged OPEN-02.)*

**NEW-FR-014 — Subscription lifecycle.** Enforce per RES-20 (trial, transitions, proration, grace, export). *(Acceptance: state machine tests for all transitions + proration math.)*

**NEW-FR-015 — Usage overage policy.** Enforce per RES-16 (80%/100% alerts, period-end grace, renewal soft-lock with 48h notice).

**NEW-FR-016 — Attribution dispute hold.** Revenue-share statements SHALL mark disputed amounts "pending"; disputed fees SHALL be excluded from the invoice until resolved; unresolved disputes SHALL auto-resolve after 14 days.

**NEW-FR-017 — Audit log scope.** SHALL capture: authentication, product CRUD, order status changes, margin decisions (requests/approvals/rejections), attribution events and reversals, subscription/plan changes, integration connect/disconnect, user/role changes.

**NEW-FR-018 — Webhook idempotency.** All payment and messaging webhooks SHALL be processed idempotently using provider event IDs; duplicate deliveries SHALL be detected and discarded without duplicate payment/order/attribution side-effects.

**NEW-FR-019 — Template message library.** Per-workspace Meta-approved template catalog (variables, language, category, provider approval status) for proactive messaging; SHALL surface actionable resubmission guidance on rejection.

**NEW-FR-020 — Message reliability.** Outbound channel deliveries SHALL retry with exponential backoff, route to a dead-letter queue after max retries, and fall back to SMS (Twilio) where configured.

**NEW-FR-021 — Billing module acceptance.** Plans list, subscribe, cancel, usage-counter accuracy (within 0.1% of ingested conversation events), overage notifications at configured thresholds, monthly invoice generation with fee recomputation from active attribution events, statement with dispute hold, invoice history/download SHALL be verifiable.

**NEW-FR-022 — V2 channels.** Instagram DM and Facebook Messenger SHALL connect via Meta Graph API, ingest messages into the unified inbox, and support sending with delivery/read receipts. *(Acceptance: round-trip in sandbox; rate-limit handling; error surfacing.)*

**NEW-FR-023 — Voice note transcription.** Customer voice notes (WhatsApp/IG) SHALL be transcribed (Arabic/English/Arabizi) and the transcript SHALL be injected into the conversation context as a message with `contentType=VOICE` and metadata holding transcription and confidence.

**NEW-FR-024 — Image recognition.** Customer product photos SHALL be matched against the catalog (image matching); on ≥ threshold match, Wasel SHALL respond with the matched product's grounded info; on no-match, SHALL ask a clarifying question. *(Interface is provider-abstraced; mock provider for dev.)*

**NEW-FR-025 — CRM (V2).** Customer profile SHALL include contact, conversation/order history, LTV, AOV, tags, notes, and auto-segment per NEW-SEG-001. *(Acceptance: segment computation on sample data.)*

**NEW-FR-026 — Assignment & ownership (V2).** Conversations SHALL support auto-assignment (round-robin / load-balanced), manual assignment, claim/unclaim, and transfer with full context. Managers SHALL reassign; agents SHALL see only assigned conversations (RES-19).

**NEW-FR-027 — Margin exception workflow (Hafeth).** Quote interception, bands per RES-15, exception request with justification, owner approval/rejection via app/WhatsApp, 1h auto-reject, alternatives suggestion, audit log. *(Acceptance: band matrix tests — NEW-MAR tests.)*

**NEW-FR-028 — Follow-up engine (Aaed).** Abandonment detection (2h inactivity + buying intent), personalized message referencing context, timing = `max(optimal, last+48h)`, max 3 attempts, opt-out/blocked/“bought elsewhere” handling, recovery tracking. *(Acceptance: cadence tests — NEW-FOL tests.)*

**NEW-FR-029 — Salla/Zid sync.** Bidirectional product/order/customer sync; initial full sync + webhooks; conflict resolution = last-write-wins by timestamp with conflict log and manual-resolution UI.

**NEW-FR-030 — Multi-user RBAC.** Roles and permission matrix per §10 enforced server-side on every endpoint; user invites by email; session management; audit of role changes.

---

## 08 Non-Functional Requirements (V2 additions)

| ID | Requirement |
|---|---|
| NEW-NFR-001 | **Data residency** — workspace data SHALL be stored in the region of the workspace's home market by default (KSA workspaces in-region); consent management and DPA available for PDPL/GDPR. *(Flagged OPEN-03.)* |
| NEW-NFR-002 | **Retention schedule** — per RES-13. |
| NEW-NFR-003 | **Deterministic financial logic** — margin, attribution, fee computation, overage counting, and guardrail enforcement SHALL be deterministic business logic, never AI-delegated. |
| NEW-NFR-004 | **AI observability** — every LLM call SHALL be logged (input, output, latency, cost, confidence, model, agent); hallucination/guardrail-trigger detection alerts. Target blended cost < $0.05/conversation. |
| NEW-NFR-005 | **Performance (V2)** — AI first-byte < 3s, full < 5s; dashboard < 2s; API p95 < 500ms; message ingestion < 3s; concurrent conversations > 1,000/workspace; throughput > 10,000 msgs/min. |

Base-SRS NFRs (§13) continue to apply unchanged except: **2FA → V2** (RES-10), retention per NEW-NFR-002, money per NEW-FR-012.

---

## 09 Domain Entities & State Machines

### 09.1 Entity catalog (V2 additions highlighted)

MVP entities (User, Workspace, WorkspaceUser, Session, Product, ProductVariant, Category, InventoryLog, Customer, CustomerNote, Conversation, Message, Order, OrderItem, Invoice, Payment, Integration, AgentConfig, LLMCall, MetricSnapshot, Report, Notification, NotificationPreference, Plan, Subscription, UsageRecord, BillingInvoice).

**New V2 entities** (added by audit — all have persisted models):

| Entity | Purpose | Rules |
|---|---|---|
| `AttributionEvent` | Persisted attribution + reversals | NEW-FR-010/011 |
| `MarginDecision` | All margin-guard decisions (audit) | NEW-FR-017/027, BR-MAR-004 |
| `FollowUpAttempt` | Aaed attempts, cadence, outcomes | NEW-FR-028, BR-FOL-001..007 |
| `DisputeRecord` | Attribution disputes + hold | NEW-FR-016 |
| `Refund` | Refunds + reversal linkage | NEW-FR-010, RES-08 |
| `PaymentPlan` | Collections payment plans (V3 consumer; model now) | RES-06 |
| `TemplateMessage` | WhatsApp template library | NEW-FR-019 |
| `AuditLog` | Immutable audit trail | NEW-FR-017 |

### 09.2 State machines (RES-18 — definitive)

**Order** — `pending → confirmed → paid → processing → shipped → delivered`; `pending/confirmed → cancelled` (releases stock); COD path `pending/confirmed → shipped` (after address confirmation) `→ delivered → paid`; `paid/delivered → refunded`. `processing → cancelled` requires manager/owner approval. No `cancelled` from `paid/shipped/delivered` except via `refunded`.

- **NEW-ORD-001 — Inventory commitment:** stock reserved at order creation, committed at `confirmed`; `cancelled`/`refunded` restores stock.
- **NEW-ORD-002 — Late refunds:** refunds after the 7-day window do **not** reverse attribution (prevents fee-gaming) but remain permitted and audited.

**Invoice (order)** — `draft → sent → (paid | overdue)`; `overdue → paid`; `draft/sent/overdue → cancelled` (void with reason; owner/accountant only). **NEW-INV-001 — numbering:** sequential per workspace, format `WS-YYYY-NNNNN`.

**Payment** — `pending → paid | failed | expired`; `failed/expired → pending` (retry/regenerate); `paid → refunded`. **NEW-PAY-001 — link regeneration:** a new link invalidates the previous one-time token (BR-PAY-001).

**Conversation** — `open → closed → archived`; `closed → open` on new inbound message. Handler ownership lives in `stage` (`AI_HANDLING → HUMAN_MONITORING → HUMAN_HANDLING → FOLLOWUP → CLOSED`). **NEW-CONV-001:** auto-close on resolution or archive-as-cold.

**Subscription** — per RES-20 (NEW-FR-014).

**Integration** — `pending → active | error | disabled`; `error → active` via reconnect with retry + owner notification (NEW-INT-001).

---

## 10 Actors, Roles & Permissions (V2 — RES-19)

| Capability | Owner | Admin | Manager | Agent | Accountant | Viewer |
|---|---|---|---|---|---|---|
| View all conversations | ✓ | ✓ | ✓ (team) | ✗ (assigned only) | ✗ | ✓ |
| Assign / reassign | ✓ | ✓ | ✓ | ✓ (claim/unclaim) | ✗ | ✗ |
| Escalate / close | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Product CRUD | ✓ | ✓ | ✗ | read | ✗ | read |
| Quote within guardrails | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Approve margin exceptions** | ✓ (sole) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Financial data | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Manage users/roles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Billing / plan changes / workspace deletion | ✓ (sole) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Resolve attribution disputes | ✓ (sole) | ✗ | ✗ | ✗ | ✗ | ✗ |
| Configure agents/scripts | ✓ | ✓ | ✓ (with approval) | ✗ | collections rules only (with approval) | ✗ |
| View **cost price** | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |

**NEW-SEC-001 — Cost-price confidentiality:** cost price visible only to Owner/Admin/Accountant. Agents and AI see the margin floor and permissible discount range, never absolute cost. (Extends BR-AI-001 to humans.)

**NEW-SEG-001 — Auto-segment definitions (V2, configurable):**

| Segment | Rule |
|---|---|
| NEW | First contact < 30 days, no purchase |
| ONE_TIME | 1 purchase, none in last 60 days |
| FREQUENT | ≥ 3 purchases in 90 days |
| VIP | Top 10% by total spend OR ≥ 5 purchases |
| AT_RISK | Previously frequent, no purchase in 60 days |

**NEW-QUAL-001 — Lead qualification (MVP foundation, refined for V2):** HOT = explicit buying intent or payment request; WARM = product/price/availability engagement; COLD = browse/general. AI-suggested, human-overridable.

---

## 11 Attribution & Revenue Logic (final, deterministic)

1. **Trigger:** order reaches its attribution event — digital payment received **or** COD delivery confirmed (NEW-FR-011).
2. **Credit determination (per RES-01):**
   - Conversation 100% AI-handled, purchase within 24h window → `AI_FULL` credit.
   - Human participated → `SPLIT` with default AI share 0% (configurable).
   - Aaed recovery → `FOLLOWUP` credit (distinct for "Revenue Recovered").
   - Multiple conversations per order → first-touch (configurable).
3. **Persistence:** `AttributionEvent` created (NEW-FR-010); immutable; reversal events on refund/dispute.
4. **Reversal:** refund within 7 days of attribution event → reverse; fee credit offset next invoice (RES-08); late refunds do not reverse (NEW-ORD-002).
5. **Fee computation:** conservative base (100% AI-handled only) × tier rate (Growth 1%, Pro 0.5%); `round(base × rate, 2)`; disputed amounts held (NEW-FR-016).
6. **Metrics:** MAR / Revenue Recovered / Total attributed per RES-03.

---

## 12 Billing & Subscription (V2)

| Item | Rule |
|---|---|
| Plans | Starter $49/500 convos · Growth $149/2,000 + 1% · Pro $399/10,000 + 0.5% · Enterprise custom (unchanged) |
| Trial | 14 days, no card, MVP scope (RES-20) |
| Lifecycle | NEW-FR-014 state machine (RES-20) |
| Overage | RES-16 / NEW-FR-015 |
| Success fee | RES-01 conservative base; RES-08 credit; NEW-FR-016 dispute hold |
| Currency | Plans/fees in USD; invoices in workspace currency at documented month-end rate (A1) |
| Tax | NEW-FR-013, disabled until tax profile configured (OPEN-02) |
| Precision | NEW-FR-012 |
| Dispute | NEW-FR-016: hold + 14-day auto-resolve |

---

## 13 AI Agent Specifications (V2)

### 13.1 Wasel (Sales Closer) — MVP foundation, refined
- 3-tier confidence (RES-04): ≥70 autonomous · 50–70 human-monitored · <50 escalate.
- Inputs: message (text/voice/image), last 20 messages, catalog via RAG, customer profile, margin guardrails.
- Tools: `product_search · check_inventory · calculate_price · generate_payment_link · create_order · escalate_to_human · schedule_followup`.
- Guardrails: never disclose cost price · never promise unlisted delivery dates · never generate payment link if margin < floor · never rude/pushy · all answers grounded in catalog (BR-COM-001).
- Cost target < $0.05/conversation; every call logged (NEW-NFR-004).

### 13.2 Aaed (Follow-up & Recovery) — NEW
- Inputs: conversation state, abandonment reason, customer segment, purchase history, product availability, timing model.
- Detection: 2h inactivity + buying intent (BR-FOL-006).
- Cadence: max 3 attempts; send at `max(optimal, last_sent + 48h)` (RES-05); detection window 24h.
- Message: references specific products discussed; urgency only if stock low/price changing; must feel personal (BR-FOL-003).
- Stop conditions: customer "no", "bought elsewhere", opt-out, blocked → log outcome, stop (BR-FOL-004/005/007).
- Fallback: timing model failure → default next day 10:00 local.
- Success: recovery rate > 10% of abandoned conversations (FR-011).

### 13.3 Hafeth (Margin Guard) — NEW
- Deterministic decision engine (NEW-NFR-003), bands per RES-15, order-level evaluation (RES-12).
- Inputs: proposed price, cost, rules, customer segment, order context.
- Decision: auto-approve / exception→owner / auto-block. Alternatives suggestion is the only AI-assisted part.
- Audit: every decision logged (NEW-FR-017); owner approval sole (RES-19).
- Success: 100% of quotes checked; >90% within guardrails (KPI).

---

## 14 Integrations (V2)

| Integration | Type | Auth | Notes |
|---|---|---|---|
| WhatsApp Business API | Channel | Meta OAuth2 via BSP | template library (NEW-FR-019), session messages ≤24h, rate limits 80 msg/s, HMAC webhooks |
| Instagram DM | Channel (NEW) | Meta Graph API OAuth2 | unified inbox; IG-specific message types |
| Facebook Messenger | Channel (NEW) | Meta Graph API OAuth2 | unified inbox |
| Shopify / WooCommerce | E-commerce | OAuth2 / API keys | MVP sync |
| Salla / Zid | E-commerce (NEW) | OAuth2 / API keys | bidirectional sync, last-write-wins + conflict log (NEW-FR-029) |
| Fawry / COD | Payment | API key + HMAC | MVP |
| Mada / Tabby | Payment (V2) | gateway keys / OAuth2 | via HyperPay/Tap for Mada |
| Twilio / SendGrid / Firebase | Comms | keys | SMS fallback, email, push |
| Voice transcription / image recognition | AI media (NEW) | provider abstraction | mock provider for dev (NEW-FR-023/024) |

Webhook processing: HMAC verification + **idempotency** (NEW-FR-018) + retry/DLQ (NEW-FR-020).

---

## 15 Resolved Open Questions (original Q1–Q12 → decisions)

| Original | Decision | Ref |
|---|---|---|
| Q1 Overage enforcement | Grace + upgrade prompt + renewal soft-lock; no per-unit charge | RES-16 |
| Q2 Attribution model & AI credits | 3-concept model; credits informational | RES-01/02 |
| Q3 Trial & downgrade | 14-day no-card trial; end-of-period cancel; proration | RES-20 |
| Q4 Margin exception thresholds | 0..floor exception; ≤0 hard block; category floors | RES-15 |
| Q5 COD attribution basis | Order value at delivery confirmation | RES-17 |
| Q6 Fee credit on reversal | Offset next invoice | RES-08 |
| Q7 Currency of billing | USD plans; local-currency invoices at month-end rate | A1 |
| Q8 Money precision | 2dp half-up; unrounded comparisons | NEW-FR-012 |
| Q9 State transitions | Definitive matrices | RES-18/§09 |
| Q10 Conversation statuses | open/closed/archived + stage | RES-18 |
| Q11 Attribution persistence | AttributionEvent entity | NEW-FR-010 |
| Q12 Tax/VAT | Per-country rates; disabled until configured | NEW-FR-013 / OPEN-02 |

---

## 16 Remaining Open Questions (stakeholder-owned only)

> These **cannot** be safely resolved from document logic — each is a commercial/legal/infra decision. They do **not** block V2 architecture; they parameterize configuration.

| # | Question | Why open | Impact of each answer | Owner |
|---|---|---|---|---|
| OPEN-01 | Trial terms (length, card, scope) | GTM decision | Long trial → slower ARR; card → signup friction | CEO / Product Owner |
| OPEN-02 | VAT applicability & timing (incl. success fee, ZATCA e-invoicing timing) | Legal/financial | Non-compliance vs overcharge | Finance / Legal |
| OPEN-03 | KSA data residency commitment (in-region hosting) | Infra/cost | PDPL risk vs infra cost | CTO / Ops |
| OPEN-04 | Overage commercial policy (grace+upgrade vs per-conversation charge) | Revenue model | Under-billing vs churn vs friction | CEO / Product Owner |
| OPEN-05 | Attribution split default (AI 0% when human participated) | Trust posture | Lower MAR narrative vs dispute risk | Product Owner |
| OPEN-06 | Billing processor for Waslah's own subscription collection | Vendor choice | Collection reliability, FX | CTO / Finance |
| OPEN-07 | Rased & Murshid AI specs (needed before V3) | Not V2-scoped | Rework at V3; non-blocking | Product Owner |
| OPEN-08 | KSA launch timing relative to Egypt | Market sequence | Resourcing, dialect scope | CEO |

---

## 17 Assumptions (A1–A14)

1. **A1** Plans/fees USD; invoices in workspace currency at documented month-end rate.
2. **A2** Trial 14 days, no card, MVP scope.
3. **A3** Overage grace + upgrade, no per-unit charge.
4. **A4** Split attribution default AI 0% when human participated; configurable.
5. **A5** Margin hard block at ≤0% margin (cost); per-category floors configurable, default = cost.
6. **A6** Payment-plan offer at +3d collections stage; +14d is a human task.
7. **A7** Segment thresholds per NEW-SEG-001.
8. **A8** Lead qualification definitions per NEW-QUAL-001.
9. **A9** Late refunds (>7d) do not reverse attribution.
10. **A10** Cost price hidden from agents and AI.
11. **A11** VAT disabled until tax profile configured.
12. **A12** "AI credit" informational only.
13. **A13** Invoice numbering `WS-YYYY-NNNNN`.
14. **A14** Follow-up send = `max(optimal, last + 48h)`.

---

## 18 Traceability & Impact (vs base SRS)

| Base SRS section | Change introduced by |
|---|---|
| §01 KPIs | RES-03 metric hierarchy |
| §02 Constraints | RES-14 template dependency |
| §07 Workflows 2/4 | RES-05/06 cadence & schedule |
| §09 Billing & Plans | RES-16/20, NEW-FR-014/015/016/021 |
| §09 US-006..010 | RES-01/04/05/06/15 |
| §10 Prioritization | RES-07 (ERP deferred) |
| §12 FR-002/009/010/011 | RES-04/01/15/05 |
| §13 NFR | RES-10 (2FA V2), NEW-NFR-001..005, NEW-FR-012 |
| §14 Agent specs | RES-04 (Wasel), RES-05 (Aaed), RES-15 (Hafeth) |
| §15 Backend | NEW-FR-010..021 entities/services, RES-18 matrices |
| §16 Frontend | RES-11 (invites in V2), RES-10 (2FA V2) |
| §18 Database | new entities table (§09.1), attribution index |
| Feature List | §9 MVP tag corrected (RES-11); §7 dispute hold (RES-09) |

---

## 19 Acceptance Criteria Summary (V2 ship gate)

- [ ] WhatsApp + Instagram + Messenger unified inbox round-trip in sandbox (NEW-FR-022)
- [ ] Aaed cadence honored: 3 max, 48h min, stop conditions (NEW-FR-028 tests)
- [ ] Hafeth band matrix + exception workflow + audit (NEW-FR-027 tests)
- [ ] Attribution events persisted; reversal on refund/dispute; fee base conservative (NEW-FR-010/011/016 tests)
- [ ] Subscription lifecycle incl. trial, proration, overage alerts, soft-lock (NEW-FR-014/015 tests)
- [ ] RBAC enforced across all endpoints (NEW-FR-030 tests)
- [ ] Salla/Zid sync with conflict log (NEW-FR-029)
- [ ] Voice transcription + image recognition wired via provider abstraction (NEW-FR-023/024, mock OK)
- [ ] Money precision & deterministic financial logic verified (NEW-FR-012, NEW-NFR-003)
- [ ] Webhook idempotency + retry/DLQ (NEW-FR-018/020)
- [ ] Billing invoice + dispute hold + fee credit verified (NEW-FR-021)

---

*Document version: 2.1 · Status: Approved-for-implementation (V2) · Decisions supersede base SRS where they conflict.*
