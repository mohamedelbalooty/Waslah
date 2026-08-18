# Waslah — AI Revenue Guardian
## Frontend Developer SRS (Web Application Specification)
### Version 2.2 | August 2026

> **Changelog (v2.2):** closes all findings from the v2.1 review — added labels + auto-assignment + escalation-rules UI, translation/sentiment (now backed by API), partial-payment UI, multi-currency product pricing, Shipping integration group (Bosta/Aramex/SMSA), Paymob/Stripe; fixed the `/messages` endpoint reference in §13; tagged leaderboard/custom-reports/revenue-opportunity score as V3-deferred.
>
> **Read me first.** This document is the authoritative specification for the **web frontend** of Waslah V2 (web-first; native mobile is a separate, deferred workstream per decision). It defines screens, components, states, RTL/bilingual behavior, routing, state management, real-time behavior, accessibility, and the API integration map.
>
> **Traceability.** Requirement IDs trace to `docs/Waslah_AI_Revenue_Guardian_SRS.md`, `docs/Waslah_Feature_List.md`, and `docs/Waslah_AI_Revenue_Guardian_SRS_V2.md` (resolved decisions RES-xx). On any conflict, **SRS_V2 wins**.
>
> **Companion.** Server behavior is specified in `development/Backend_SRS.md`. Both share the API contract (see Backend_SRS §14) and the RBAC matrix (Backend_SRS §8.3). The frontend consumes the REST API + the WebSocket API (Backend_SRS §13).

---

## 1. Purpose

Give the frontend team the complete contract for the Waslah web application:

- **What to build** — every screen, route, component, and interaction in scope (MVP + V2).
- **How it must behave** — role-aware views, RTL/bilingual, real-time inbox, all loading/empty/error states.
- **How to build it** — tech stack, design system, state management, data-fetching patterns.
- **How to know it works** — acceptance criteria in §14.

---

## 2. Scope & Deliverables

| Stream | Deliverables | Phase |
|---|---|---|
| Foundation | Design system, i18n (AR/EN) + RTL, app shell, auth screens, onboarding wizard | MVP |
| Owner home | Dashboard with revenue/conversation/margin cards | MVP |
| Conversations | Unified inbox (WhatsApp MVP) + chat detail, AI/human handoff UX, templates | MVP |
| Catalog | Product grid/detail/import, inventory | MVP |
| Billing | Plans, subscription, usage | MVP (V2 deepens) |
| V2 inbox | Instagram + Messenger channels in the unified inbox | V2 |
| V2 agents | Aaed follow-up configuration + activity; Hafeth margin exceptions approval | V2 |
| V2 multi-user | Team/invites, assignment, role-aware navigation | V2 |
| V2 CRM | Customer profiles, segments, notes | V2 |
| V2 analytics | Revenue/margin/conversations/team dashboards, exports | V2 |
| V2 settings | Workspace, users, AI config, integrations, notifications, security (2FA), audit log | V2 |
| V2 conversation ops | Labels + AI auto-labeling, auto-assignment, escalation-rules config, translation + sentiment panels | V2 |
| V2 payments | Paymob/Stripe cards, partial-payment recording on invoices | V2 |
| V2 shipping | Bosta/Aramex/SMSA integration cards + delivery-state indicators | V2 |
| V2 multi-currency | Per-product currency selector + localized display | V2 |

**V3-deferred (do NOT build in V2):** custom reports builder + schedule, team leaderboard widget, revenue-opportunity score panel. Keep these UI elements hidden in V2.

**Mobile app (iOS/Android): DEFERRED.** All screens must be fully usable on small screens (mobile web) — see §12.

---

## 3. Tech Stack & Conventions

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19, TypeScript (strict) |
| Styling | Tailwind CSS + design tokens; CSS variables for theming |
| Charts | Recharts (RTL-aware) or Chart.js |
| Data fetching | TanStack Query (server state); SWR-alternative acceptable |
| Client state | Zustand or Context for UI state |
| Forms | react-hook-form + zod (shared with backend schemas) |
| Validation | zod schemas mirroring Backend_SRS §5 |
| Real-time | WebSocket client (Socket.IO) with SSE fallback; auto-reconnect |
| i18n | next-intl (or compatible) with AR/EN locale dictionaries |
| Dates/currency | date-fns + Intl.NumberFormat (AR/EGP/SAR formats) |
| Testing | vitest + React Testing Library; Playwright E2E |

**Conventions**
- All UI text MUST come from locale dictionaries (never hardcoded strings).
- Server-side permissions drive which routes/tabs render (see §6).
- Every interactive element has explicit loading, empty, error, and (for financial data) permission-denied states.
- Money is displayed from the API's unrounded source formatted via `Intl.NumberFormat` (locale + currency). No client-side money math (Backend_SRS §5.5).

---

## 4. Design System

### 4.1 Tokens
- Colors: brand (green/emerald = revenue/money), success, warning (margin exceptions), danger (blocked/escalations), neutral scale; semantic tokens for `surface`, `surface-2`, `text`, `text-muted`, `border`, `primary`, `accent`, `danger`, `warning`, `success`.
- Typography: supports Arabic script (Cairo / IBM Plex Sans Arabic) + Latin (Inter) with proper line-height for Arabic; scale 12/14/16/18/20/24/32.
- Spacing: 4px base scale. Radius: 6/8/12/16. Shadows: subtle elevation for cards/dialogs.
- Icons: line icons (Lucide or similar); channel icons (WhatsApp/IG/Messenger).

### 4.2 Components (shared library)
`Button` (variants/loading) · `Input` / `Select` / `Textarea` / `Toggle` / `Checkbox` / `Radio` · `Field` (label + error) · `Badge` (status/segments/channels) · `Avatar` · `Card` · `Modal`/`Dialog` · `Drawer` (mobile detail) · `Toast` · `Tooltip` · `Tabs` · `Table` (sortable/paginated) · `EmptyState` · `Skeleton` · `ErrorState` · `PageHeader` · `FilterBar` · `DateRangePicker` · `Sparkline`/`Line`/`Bar`/`Donut` charts · `Pagination` · `StatusPill`.

### 4.3 States
Every data-driven component supports: **loading** (skeleton, no layout shift) · **empty** (illustration + CTA) · **error** (message + retry) · **empty-filter** (no results for active filters + clear-filters action) · **permission-denied** (for hidden-if-forbidden actions, show disabled + tooltip).

---

## 5. Localization & RTL (NFR §Localization)

- Languages: Arabic (default) and English; full **RTL/LTR** mirroring with `dir` attribute + logical properties (no left/right hardcoding).
- Dialects: UI in Modern Standard Arabic; AI transcripts display customer dialect as-is.
- Number formatting: `Intl.NumberFormat` — Arabic-Indic numerals option controlled by a **workspace-level `numeral_format` setting** (`ARABIC_INDIC` | `WESTERN`, default `WESTERN`) stored in the `Workspace` model (see Backend_SRS §7.3). The setting is configurable per-workspace in Settings → Workspace. Currency (EGP/SAR/USD) with correct grouping; dates both Gregorian + Hijri option, `Africa/Cairo` / `Asia/Riyadh` / `Asia/Dubai`.
- Time: 24h/AM-PM per locale; relative times ("5 min ago") localized.
- Charts must mirror correctly under RTL (axis/reverse-series as needed).
- All copy ships in both locales; truncation/sizing must tolerate Arabic (wider glyphs, no mid-word breaks).

---

## 6. Routing & App Shell

### 6.1 App shell
- **Sidebar** (desktop) / **bottom nav** (mobile): Dashboard, Conversations, Catalog, Customers, Analytics, Billing, Integrations, Settings, Notifications.
- **Topbar**: workspace switcher (future), search, notifications bell (unread badge, real-time), user menu (profile, 2FA, language toggle, logout).
- Role-aware nav: Viewer sees read-only analytics/reports; Agent sees Conversations + Catalog + their profile; Accountant sees Analytics + Billing + Customers (read); Manager adds Team; Owner/Admin see all incl. Settings/Users. Hidden routes must also be blocked by the API (Backend_SRS §8.3).

### 6.2 Routes (App Router)
```
/                        → redirect to /dashboard
/login  /register  /forgot-password  /reset-password
/onboarding              → wizard (5 steps; team step hidden for MVP/RES-11)
/dashboard
/conversations           → inbox (list)
/conversations/[id]      → conversation detail (mobile: overlay)
/catalog                 → products
/catalog/import
/catalog/[id]            → product detail/edit
/customers               → CRM list
/customers/[id]          → customer profile
/analytics               → tabs: revenue, conversations, team, margin, collections
/analytics/reports
/agents/aaed             → follow-up config + activity
/agents/hafeth           → margin rules + exception queue (owner)
/billing                 → plan, usage, invoices, revenue-share statement
/integrations
/settings                → tabs: workspace, users, ai, assignments/escalation, labels, integrations, notifications, security, billing
/settings/audit-log
/notifications
```
- Route guards: `RequireAuth`, `RequireRole(...roles)`, `RequirePlanActive` (soft-lock banner), redirect to 403 screen when denied.
- Bilingual URLs optional; primary = Arabic path aliases.

---

## 7. Auth & Onboarding Flows

### 7.1 Login
Email + password (+ OTP field when 2FA enabled, V2). Loading, error (invalid credentials / rate-limit), forgot-password, success → redirect. 2FA challenge step after credential success.

### 7.2 Register → onboarding
1. Create account + workspace (business name, type, currency, timezone).
2. **Connect WhatsApp** — guided Meta verification; sandbox mode indicator; status: pending/connected/error with actionable recovery.
3. **Product catalog** — CSV template download + drag-drop upload w/ preview + row-error report; or "skip, add later".
4. **AI configuration** — Wasel tone (professional/friendly/persuasive), operating hours, confidence threshold, language.
5. **Team invite** — visible in V2 (hidden in MVP per RES-11); skip allowed.
Progress bar, per-step validation, back/next, saving states, and exit-and-resume from saved draft.

### 7.3 Sessions
Idle timeout warning (30 min) + refresh flow; logout revokes everywhere.

---

## 8. Feature Screens

### 8.1 Dashboard (role-aware home)
- **Revenue card** (Owner/Admin/Accountant/Viewer): attributed revenue today vs yesterday/last week, sparkline, currency-localized. Sub-lines: Revenue Recovered (Aaed), total attributed.
- **Conversations card**: active, AI-handled, escalated (Agent/Manager see their metrics + queue).
- **Margin guard card** (Owner/Admin): events today (blocked/approved/pending); pending exceptions link to Hafeth queue.
- **Aaed card** (V2): recoveries this week, recovery rate, abandoned now.
- **Quick actions**: view conversations, add product, margin exceptions, billing.
- **States**: skeleton on load; empty state on first day (guidance CTA); error + retry; real-time updates via WS.
- Responsive: card grid 4-col desktop → stacked mobile.

### 8.2 Conversations Inbox
- **Left list**: avatar, name, last message preview (1 line), time, unread badge, channel icon (WhatsApp/IG/Messenger), assignment/status indicators. Sort: newest/oldest/priority/waiting. Filters: channel, status, stage, assignee, **label**, segment, date range, search (name/phone/content/order). Auto-assigned conversations show the assignment source.
- **Bulk actions**: assign, label, close, export (selection toolbar).
- **Right detail** (see 8.3). **Mobile**: list-only; detail opens as drawer overlay.
- Real-time: new-message toast + row reorder; typing indicator; read receipt.
- Empty inbox / no results / loading states.

### 8.3 Conversation Detail
- **Header**: customer name, phone, channel icon, status pill, stage pill (AI handling / human monitoring / human / follow-up), assign/claim/transfer menu, close, escalate.
- **Message thread**: bubbles — customer left, AI/human right; timestamps; delivery/read status; attachments (image/document/voice); AI messages have subtle "AI" indicator on hover (customer never sees labels per FR-008 — labels are internal-only).
- **Composer**: input, template quick-insert, attachment, language/translation toggle; AI suggestion panel when human is typing (accept/edit/reject).
- **Customer sidebar**: profile snapshot, LTV/AOV, order history, notes, tags, segment; qualification (HOT/WARM/COLD) editable.
- **AI summary panel**: auto-summary (refreshable via `/conversations/:id/refresh-summary`), intents, sentiment (POSITIVE/NEUTRAL/NEGATIVE), next-best-action, translation (dialect → formal Arabic). The revenue-opportunity score panel is **V3-deferred** (hidden in V2).
- **Timeline**: event log (AI handled, human took over, order created, payment received, follow-up sent) — filterable, exportable (dispute evidence).
- **States**: AI handling (read-only + pause), human active (editable), closed (read-only, reopen), archived.
- RTL: bubbles flip correctly; thread mirrors.

### 8.4 Product Catalog
- Grid/table toggle; search + filter chips (category, status, stock); per-row actions; bulk toolbar.
- Product card: image, name, price, stock, status badge (low-stock/out-of-stock callout).
- Import entry: template download, upload, progress (background job → notification), error report download.
- **Role-aware**: cost/price columns hidden for Agent/Viewer (NEW-SEC-001) — only discount-range indicator shown.

### 8.5 Product Detail / Edit
- Image gallery (upload/order); form: name, description, SKU, base price, **currency** (defaults to workspace currency; drives localized price display), **cost price (owner/admin/accountant only)**, stock, category, variants (name/SKU/price-adjustment/stock/attributes).
- **Margin preview**: live margin % computed from price+discount vs cost (with cost); for non-cost roles show floor compliance indicator only.
- Validation: required, positive numbers, unique SKU, dirty-form warning, save/cancel; deletion requires confirmation + impact notice.
- Variants editor (table w/ add/remove).

### 8.6 Customers (CRM)
- List w/ search + segment filter; segment badges (NEW/ONE_TIME/FREQUENT/VIP/AT_RISK), total spend, order count, last order.
- Customer profile: contact, segment (auto + manual override), tags, notes (add/thread), order history, conversation history, LTV/AOV/frequency, first/last purchase, journey timeline, churn-risk indicator, next-best-action.

### 8.7 Orders & Invoices
- Orders list w/ status filter + search; status pills with legal transitions (state machine per Backend_SRS §10).
- Order detail: items, quantities, prices, discounts, shipping, totals, margin summary (owner/accountant), payment method/status, invoice, notes, status transition actions (guarded), refund action (owner/admin/accountant).
- Invoices list (owner/admin/accountant): number (`WS-YYYY-NNNNN`), amount, **amount paid / remaining**, due date, status; send/void actions; PDF view.
- Partial payments: record a payment against an invoice (amount + method); progress bar toward full settlement; remaining balance shown after each payment.
- Payments: list + detail (multiple rows per invoice when partially paid), link regeneration (invalidates old token), refunds.

### 8.8 Analytics
- **Date range picker** + comparison to previous period.
- **Tabs**: Revenue · Conversations · Team · Margin · Collections.
  - Revenue: total attributed, by agent (Wasel/Aaed/Human), channel, product, segment; line/bar/donut.
  - Conversations: totals, AI resolution %, response times, escalation %, abandonment %, Aaed recovery rate.
  - Team (manager+): per-agent conversations/conversion/response time/satisfaction (leaderboard widget is **V3-deferred**).
  - Margin (owner/admin/accountant): avg margin/order, guard events (approved/blocked/escalated), discount frequency + depth, margin trend, profitability by product.
  - Collections (owner/admin/accountant): invoiced/collected/DSO/overdue (V2 scaffolding).
- Export: current view → CSV/PDF (owner/admin).
- Custom reports: config builder + schedule (**V3-deferred** — hide the Reports tab in V2).
- Charts responsive + RTL-aware; states: loading, no data, error.

### 8.9 Margin Guard — Hafeth (V2, Owner/Admin)
- **Rules**: global floor, per-category floors (add/edit/disable), hard-floor (cost) override; discount budget per agent/period (config).
- **Exception queue**: pending exception cards — customer, product, requested price/discount, computed margin, justification; **approve/reject** with 1-tap + optional note; countdown to auto-reject (1h); approve=sole owner (Admin sees but cannot approve).
- **Decision log**: filterable table (auto-approved/exceptions/blocked) with reasons + margin impact in currency.
- **Mobile specification (critical — owner is typically on mobile for real-time approvals):** The exception queue MUST be fully functional at ≤ 375px width. Each exception card must render approve/reject as large touch targets (≥ 44px) without horizontal scroll. The 1h auto-reject countdown must be prominently displayed as a live timer. An optional push notification (via Firebase) deep-links directly into the exception detail screen. WebSocket `margin:exception` events must trigger a notification badge on the mobile bottom nav.

### 8.10 Aaed Follow-ups (V2)
- Config: enable/disable, max attempts (default 3), min interval (48h), detection window, templates per stage, opt-out handling notice.
- Activity: scheduled/attempted/recovered; per-conversation timeline of attempts + outcomes; recovery KPIs.

### 8.11 Billing & Subscription (Owner)
- Plan cards (Starter/Growth/Pro/Enterprise contact) with current plan highlighted; feature comparison; **usage bar** vs limit with 80%/100% alert badges.
- Trial banner: days remaining; upgrade CTA (no card for trial).
- Overage notices + upgrade prompt; soft-lock banner w/ 48h countdown when applicable.
- Invoices/statements: list, download, **disputed/pending breakdown with hold indicator** (NEW-FR-016).
- Revenue-share statement: fee base, rate, fee, credits, VAT (if enabled), total.
- Cancel flow: confirm end-of-period cancellation + consequences (30-day read-only grace + export).

### 8.12 Integrations
- Cards per provider grouped: Channels, E-commerce, Payments, Shipping, Comms.
- Payments group: Fawry, Mada, Tabby/Tamara, **Paymob, Stripe**.
- Shipping group: **Bosta, Aramex, SMSA**; status pills reflect delivery-state webhooks (shipped/delivered/failed); delivered events surface as COD attribution feeds.
- Status pills: connected/pending/error/disabled; connect via OAuth redirect; disconnect confirm (audit); **error recovery** with actionable message + retry.
- Sync panel: last sync, trigger manual sync, sync runs + conflict log with manual-resolution UI (NEW-FR-029).

### 8.13 Settings
- **Workspace**: business info, logo upload, currency, timezone, language, holiday calendar, tax profile (country, tax ID, VAT enable — NEW-FR-013).
- **Users** (owner/admin): invite by email + role; list w/ roles; change role (audit); remove; pending invites w/ resend/revoke.
- **Labels**: team label CRUD (name/color), applied in inbox/conversation detail; AI auto-labeling toggle per label (owner/admin).
- **AI**: model selection, temperature, max tokens, confidence threshold (3-tier), agent toggles (Wasel/Aaed/Hafeth), operating hours, language priority.
- **Assignments & escalation** (owner/admin only for mutation; manager read-only): auto-assignment strategy (manual / round-robin / load-balanced / skill-based) + skill→agent mapping — configurable by owner/admin only (RES-19 RBAC matrix; manager has no assignment-rule configure capability). Escalation rules keyed to time inactivity / negative sentiment / low confidence / keyword / explicit request, each with a target action — owner/admin edit; manager can request changes (owner/admin approval required).
- **Integrations**: (link to §8.12).
- **Notifications**: channel toggles (in-app/email/WhatsApp/push) per event type (new lead, escalation, margin alert, payment received, usage alerts, briefing).
- **Security**: password change, **2FA enable/disable (TOTP)**, active sessions (view/revoke), data export request, retention note.
- **Billing**: (link to §8.11).

### 8.14 Notifications Center
Inbox list (paginated, filters by type/read), mark read / read-all, deep-link to related screen, preference shortcut. Real-time push via WS.

### 8.15 Audit Log (Owner/Admin)
Filterable table: actor, action, entity, before/after diff (expandable), IP, timestamp. Read-only; export CSV.

---

## 9. Component & State Patterns

- **Server state**: TanStack Query per resource with cache keys `[workspace, resource, filters]`; optimistic updates for toggles/labels; invalidations on WS events.
- **Mutations**: `useMutation` with shared error extraction (API error codes → localized messages). Idempotent retry hints.
- **Auth state**: session store (access/refresh tokens, user, workspace, roles); refresh interceptor on 401; redirect to login on expiry.
- **Permission helper**: `can(role: WorkspaceRole, capability: Capability): boolean` — imports `Capability` enum and `ROLE_CAPABILITIES` map from `packages/shared-types/src/rbac.ts` (see Backend_SRS §8.5). Used for both conditional rendering (`{can(role, Capability.APPROVE_MARGIN_EXCEPTION) && <ApproveButton />}`) and route guards. Never duplicate capability strings — always import from `shared-types`.
- **Feature flags**: read from `/settings/ai` + env-driven sandbox flag (mock channel shown as "Demo mode").
- **Currency/timezone formatting** centralized in a `format` util (single source of truth).

---

## 10. Real-Time Behavior

- WebSocket via Backend_SRS §13: subscribe to `conversation:new`, `conversation:update`, `message:new`, `typing`, `notification:new`, `margin:exception`, `attribution:update`.
- Inbox: live append/reorder + unread badge updates; dedupe on WS/HTTP overlap.
- Conversation detail: live message streaming w/ typing indicator; optimistic send + delivery state (sent/delivered/read/failed) with retry.
- Reconnect w/ exponential backoff; on disconnect show banner; resync on reconnect (cursor-based).
- SSE fallback if WS unavailable.

---

## 11. Accessibility (WCAG 2.1 AA)

- Full keyboard navigation + tab order; focus trap in modals/drawers; skip-to-content link.
- ARIA labels on all interactive elements; semantic landmarks; screen-reader announcements for new messages (polite), notifications.
- Color contrast ≥ 4.5:1; not color-only indicators (status has text + icon); fonts scalable to 200% without breakage.
- RTL + Arabic screen-reader support; alternative text for product images; chart data available as accessible tables (not only visual).

---

## 12. Responsive Behavior (mobile-first web)

- Breakpoints: base (mobile) → 640 → 768 → 1024 → 1280.
- Dashboard cards stack; inbox list-only on mobile with detail drawer; catalog grid 2-col mobile → 4-col desktop.
- Bottom navigation on mobile (Dashboard/Inbox/Catalog/Analytics/More); sidebar on ≥1024.
- Touch targets ≥ 44px; swipe actions (assign/close/label) on inbox rows.
- Performance budget: LCP < 2.5s on mid-tier mobile; route-level code splitting; no layout shift (skeletons).

---

## 13. API Integration Map

| Screen | REST endpoint(s) (Backend_SRS §14) | Realtime |
|---|---|---|
| Login/Register | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/2fa/*` | — |
| Onboarding | `/workspace`, `/integrations` (whatsapp), `/products/import`, `/agents/wasel` | — |
| Dashboard | `/analytics/dashboard` | `notification:new`, `margin:exception`, `attribution:update` |
| Inbox list | `/conversations` | `conversation:new/update`, `message:new` |
| Conversation detail | `/conversations/:id`, `/conversations/:id/messages`, `/conversations/:id/translate`, `/conversations/:id/refresh-summary`, `/conversations/:id/labels`, `/templates` | `message:new`, `typing`, `read` |
| Assign/transfer/escalate/close | `/conversations/:id/assign\|claim\|transfer\|escalate\|close\|return-to-ai` | `conversation:update` |
| Labels | `/labels`, `/labels/:id` | — |
| Catalog | `/products`, `/products/:id`, `/products/import`, `/inventory/*`, `/categories` | — |
| CRM | `/customers`, `/customers/:id`, `/customers/:id/*`, `/customers/segments` | — |
| Orders | `/orders`, `/orders/:id`, `/orders/:id/status`, `/payments/*`, `/invoices/*`, `/invoices/:id/payments` | `notification:new` |
| Analytics | `/analytics/*`, `/analytics/export` (`/reports` V3-deferred) | — |
| Hafeth | `/agents/hafeth/*`, `/agents/hafeth/decisions/*` | `margin:exception` |
| Aaed | `/agents/aaed/*` | — |
| Billing | `/billing/*` | — |
| Integrations | `/integrations`, `/integrations/:id/*` | — |
| Settings | `/settings/*`, `/workspace/*`, `/auth/*`, `/notifications/preferences`, `/settings/assignment-rules`, `/settings/escalation-rules` | — |
| Notifications | `/notifications`, `/notifications/:id/read` | `notification:new` |
| Audit log | `/audit-log` | — |

---

## 14. Acceptance Criteria (frontend ship gate)

- [ ] Full AR/EN localization with RTL/LTR mirroring across all screens incl. charts (NFR Localization).
- [ ] Onboarding wizard completes end-to-end (register → channel → catalog → AI → dashboard) incl. skip paths.
- [ ] Unified inbox streams WhatsApp/IG/Messenger conversations in real time w/ unread badges + read receipts (NEW-FR-022).
- [ ] Conversation detail supports AI/human handoff UX, templates, attachments, voice/image rendering (NEW-FR-023/024).
- [ ] Role-aware navigation: Agent sees only assigned; Viewer read-only; Owner-only actions hidden (RES-19).
- [ ] Cost price hidden from Agent/Viewer; margin preview shows compliance only for non-cost roles (NEW-SEC-001).
- [ ] Hafeth exception queue: approve/reject by owner w/ auto-reject countdown; decision log (NEW-FR-027).
- [ ] Aaed config + activity screens reflect cadence rules (NEW-FR-028).
- [ ] Billing screens: plan cards, usage bar w/ 80/100% alerts, trial banner, dispute-hold breakdown on statements (NEW-FR-015/016).
- [ ] Labels + auto-assignment + escalation-rules config UI wired to `/settings/assignment-rules` & `/settings/escalation-rules` (NEW-FR-025/026).
- [ ] Translation toggle + sentiment/summary panels consume `/conversations/:id/translate` and `/conversations/:id/refresh-summary`.
- [ ] Partial-payment recording on invoices; paid/remaining progress updates (NEW-FR-021).
- [ ] Multi-currency product pricing editable per product; prices display localized.
- [ ] Shipping integration cards (Bosta/Aramex/SMSA) show delivery-state pills from webhook data.
- [ ] Paymob/Stripe listed in the Payments integration group.
- [ ] Leaderboard, custom reports, and revenue-opportunity score are NOT shipped in V2 (V3-deferred).
- [ ] Analytics dashboards load < 2s, all states handled, exports work (FR-015).
- [ ] WebSocket reconnect/resync works; SSE fallback functional (Backend_SRS §13).
- [ ] WCAG 2.1 AA: keyboard nav, contrast, ARIA, RTL screen-reader verified.
- [ ] Responsive: all flows usable on ≤ 375px width; LCP < 2.5s mid-tier.

---

*Frontend SRS v2.2 · Supersedes conflicting detail in the base SRS · Trace IDs: FR-, NEW-FR-, US-, RES- (see docs/Waslah_AI_Revenue_Guardian_SRS_V2.md).*
