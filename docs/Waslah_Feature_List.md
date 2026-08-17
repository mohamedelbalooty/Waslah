# Waslah — Project Feature List
### Derived from Waslah AI Revenue Guardian SRS v2 · Plus Future Features (market/engineering judgment)

This document is a flattened, at-a-glance feature list for planning, backlog grooming, and stakeholder communication — the SRS remains the source of truth for requirements detail. Every feature below carries a phase tag matching Section 10 (Feature Prioritization) of the SRS:

- 🟢 **MVP** — required for the core value proposition to exist at all
- 🟡 **V2** — proven value driver, not required for first revenue proof
- 🔵 **V3 / Could-Have** — completes the "Business OS" vision, needs proven PMF first
- ⚪ **Future (this document only)** — new ideas beyond the current SRS, added below based on market/engineering judgment, not yet discovery-validated

---

## 1. Conversations

| Feature | Phase |
|---|---|
| Real-time unified inbox (WhatsApp, IG, Messenger) | 🟢 MVP |
| Sort/filter by channel, status, agent, date, segment | 🟢 MVP |
| Search by name/phone/message content/order ID | 🟢 MVP |
| Full thread view with customer profile sidebar | 🟢 MVP |
| AI vs. human message indicators | 🟢 MVP |
| Internal notes (team-only) | 🟢 MVP |
| Message status (sent/delivered/read/failed) | 🟢 MVP |
| Attachment viewer (images, docs, voice notes) | 🟢 MVP |
| Saved reply templates with dynamic variables | 🟡 V2 |
| Dialect → formal Arabic translation toggle | 🟡 V2 |
| AI-generated conversation summary | 🟡 V2 |
| Sentiment analysis (positive/neutral/negative) | 🟡 V2 |
| Revenue opportunity score (0–100) | 🔵 V3 |
| Full event timeline (exportable for disputes) | 🟡 V2 |
| Auto-assignment rules (round-robin, load-balanced, skill-based) | 🟡 V2 |
| Manual assignment, claim/unclaim, transfer with context | 🟢 MVP |
| Escalation rules (time/sentiment/keyword-based) | 🟢 MVP (basic) / 🟡 V2 (advanced) |
| Custom labels/tags, AI auto-labeling | 🟡 V2 |
| No-code automation rule builder | 🔵 V3 |
| A/B testing for message variants | 🔵 V3 |
| Per-conversation metrics (response/resolution time, revenue attributed) | 🟢 MVP (basic) / 🟡 V2 (full) |
| Post-conversation CSAT survey | 🔵 V3 |

## 2. AI Agents

| Feature | Phase |
|---|---|
| Agent enable/disable, tone/personality config | 🟢 MVP |
| Confidence threshold + escalation trigger config | 🟢 MVP |
| **Wasel** — Sales Closer: product KB, FAQ training, objection handling, upsell rules, discount limits | 🟢 MVP |
| **Aaed** — Follow-up & Recovery: abandonment detection, timing optimization, frequency caps | 🟡 V2 |
| **Hafeth** — Margin Guard: per-product/category rules, exception approval workflow | 🟡 V2 |
| **Munjiz** — Collections: invoice import, staged reminder templates, payment plans | 🔵 V3 |
| **Rased** — Inventory: reorder points, dead-stock ID, demand forecasting | 🔵 V3 |
| **Murshid** — Team Performance: benchmarks, coaching alerts, leaderboard | 🔵 V3 |
| **Thaqib** — Executive Briefing: scheduled multi-module digest | 🔵 V3 |

## 3. Product Catalog

| Feature | Phase |
|---|---|
| Manual product CRUD, variants, images, categories | 🟢 MVP |
| Cost price + auto margin calculation | 🟢 MVP |
| Bulk CSV/Excel import/export | 🟢 MVP |
| Shopify / WooCommerce auto-sync | 🟢 MVP |
| Salla / Zid auto-sync | 🟡 V2 |
| Sync conflict resolution | 🟡 V2 |
| Dynamic pricing rules (time/inventory-based), bundles, wholesale tiers | 🔵 V3 |
| Multi-currency (EGP, SAR, USD, AED) | 🟡 V2 |

## 4. Customers (Lightweight CRM)

| Feature | Phase |
|---|---|
| Customer profile: contact, conversation/order history, LTV, AOV | 🟢 MVP |
| Auto-segments (VIP, Frequent, At-Risk, New, One-Time) | 🟡 V2 |
| Custom rules-based segment builder | 🔵 V3 |
| Customer journey timeline + churn risk score | 🔵 V3 |

## 5. Orders & Payments

| Feature | Phase |
|---|---|
| Order creation (manual/AI/imported), full status lifecycle | 🟢 MVP |
| Order editing with audit trail, notes | 🟢 MVP |
| Invoice/receipt generation | 🟢 MVP |
| Payment link generation + tracking | 🟢 MVP |
| Payment methods: Fawry, Mada, Tabby, COD, bank transfer | 🟢 MVP (Fawry/COD) → 🟡 V2 (Mada, Tabby, others) |
| COD reconciliation (delivery confirmation) | 🟡 V2 |
| Partial payments, refund processing | 🟡 V2 |
| Invoice aging report, overdue list | 🔵 V3 |
| Automated reminder log, payment plan tracking | 🔵 V3 |

## 6. Analytics & Reporting

| Feature | Phase |
|---|---|
| Revenue Recovered dashboard (headline metric) | 🟢 MVP |
| Revenue by agent/channel/product/segment | 🟡 V2 |
| Conversational metrics (AI resolution rate, response time, escalation/abandonment/recovery rate) | 🟢 MVP (core) / 🟡 V2 (full) |
| Margin dashboard (avg. margin, Margin Guard events, discount trend) | 🟡 V2 |
| Team performance metrics + leaderboard | 🔵 V3 |
| Collections metrics (DSO, collection rate) | 🔵 V3 |
| Inventory metrics (stockout, turnover) | 🔵 V3 |
| Custom report builder, scheduled exports | 🔵 V3 |

## 7. Billing & Plans

| Feature | Phase |
|---|---|
| Plan tiers (Starter/Growth/Pro/Enterprise) | 🟢 MVP (manual) / 🟡 V2 (automated) |
| Usage tracking (conversation counter, overage alerts) | 🟢 MVP |
| Monthly invoicing, card/bank/Fawry payment | 🟡 V2 |
| Attributed-revenue fee calculation engine | 🟡 V2 |
| Dispute handling workflow | 🔵 V3 |

## 8. Integrations

| Feature | Phase |
|---|---|
| WhatsApp Business API (Meta, via BSP) | 🟢 MVP |
| Instagram DM, Facebook Messenger | 🟡 V2 |
| TikTok Messages | 🔵 V3 |
| Shopify, WooCommerce | 🟢 MVP |
| Salla, Zid | 🟡 V2 |
| Fawry, COD | 🟢 MVP |
| Mada, Tabby, Tamara, Paymob, Stripe | 🟡 V2 |
| Shipping: Bosta, Aramex, SMSA | 🟡 V2 |
| QuickBooks, Xero, Odoo (accounting) | 🔵 V3 |
| Analytics: GA, Meta Pixel, Mixpanel, Amplitude | 🔵 V3 |

## 9. Settings & Administration

| Feature | Phase |
|---|---|
| Workspace settings (business info, currency, timezone, hours) | 🟢 MVP |
| User invites + role assignment (Owner/Staff) | 🟢 MVP |
| Full permission matrix (Admin/Manager/Agent/Accountant/Viewer) | 🟡 V2 |
| Notification preferences (channel, event type, frequency) | 🟢 MVP (basic) / 🟡 V2 (full) |
| Two-factor authentication | 🟡 V2 |
| IP whitelist, session management | 🔵 V3 |
| Audit log | 🟢 MVP (core actions) / 🟡 V2 (full) |
| Data export / retention policy (GDPR/PDPL) | 🟡 V2 |

## Explicitly Out of Scope (per SRS Section 10, "Won't-Have")

ERP integrations · Voice AI phone calls · Third-party agent marketplace · Video commerce — too complex, too early, or not tightly enough tied to the Revenue/Margin KPI for the current roadmap horizon.

---

## Future Features (beyond the current SRS)

Everything above reflects what's already in the SRS. What follows is **new** — features I'd flag as strong candidates for a later roadmap based on general market patterns in MENA e-commerce/SaaS and standard product-evolution paths for this category, **not** yet run through the discovery process (JTBD, opportunity sizing, etc.) the rest of this SRS went through. Treat these as a prioritized hypothesis list for the next discovery cycle, not committed scope.

| Feature | Why it's a strong candidate | Rough horizon |
|---|---|---|
| **COD Fraud & Risk Scoring** — AI flags high-risk cash-on-delivery orders (repeat rejections, address/behavior patterns) before dispatch | COD is still dominant in Egypt and much of the Gulf, and failed/rejected COD deliveries are a well-documented, direct margin killer for regional e-commerce — this sits exactly on the Margin KPI and is a natural extension of the existing Hafeth (Margin Guard) agent | Post-V2 |
| **AI Voice-Note Replies (full duplex)** — not just transcribing customer voice notes (already V2), but replying in kind with a natural-sounding dialect voice note | Voice notes are a dominant communication style on WhatsApp in the region, especially for less tech-formal small sellers and their customers; text-only replies leave real conversion on the table | V3+ |
| **AI Social Content Agent** — auto-generates Instagram/TikTok captions and product posts from the catalog, feeding traffic into the same WhatsApp/DM funnel Wasel already closes | Closes the loop from "get attention" to "convert attention" in one product, and is a logical Marketing-domain extension once Sales/Margin domains are proven | V3+ |
| **Embedded Working Capital ("Waslah Capital")** — short-term inventory/cash-flow financing offered or brokered using the platform's real-time visibility into a merchant's revenue | This is the standard next move once a platform has clean, real-time SME revenue data (see Shopify Capital, Amazon Lending) — high margin, strong retention lock-in, and directly serves SME cash-flow pain already flagged in Section 02's Margin Leakage Map | Future Vision (requires regulatory/lending partner work) |
| **E-Invoicing / Tax Compliance Agent** — auto-generates ZATCA-compliant e-invoices in Saudi Arabia and equivalent compliant documents in Egypt from Orders data | Both markets have (or are rolling out) mandatory e-invoicing regimes; solving a real compliance headache most small merchants currently outsource or do manually increases stickiness independent of the AI-sales value prop | V2/V3 candidate — worth pulling forward if it proves to be a fast, low-complexity win |
| **Multi-Store / Franchise Console** — roll-up dashboard and settings across multiple branches/locations for one merchant | Natural expansion once individual single-location merchants are retained — this is where ARPU grows without adding new logos | V3+ |
| **White-Label / Agency Partner Program** — let marketing/social-media agencies that already manage WhatsApp/IG for multiple small merchants resell or manage Waslah on their clients' behalf | A GTM multiplier — agencies already touch the exact customer base at scale; this converts a channel competitor into a channel partner | Post-pilot, once unit economics are proven with direct merchants |
| **Marketplace Catalog Expansion (Amazon.sa, noon, Jumia)** | Broadens the catalog data source beyond Shopify/Salla/Zid for merchants who sell primarily on marketplaces rather than owned stores | V3+ |
| **Predictive LTV & Cohort Analytics** | Deeper financial planning tool for owners who graduate past "did I recover revenue today" into "what is my customer base worth" — a natural Analytics-domain maturity step | V3+ |
| **AI Negotiation Strategy A/B Testing** — systematically test and auto-optimize different closing styles per customer segment | This becomes possible only once there's enough conversation volume/data — but it's a genuine, hard-to-copy data moat once it exists, worth flagging early even though it can't be built early | Future Vision |
| **"Waslah Trusted" Merchant Directory** — a light, consumer-facing badge/directory of merchants using Waslah (implying fast, reliable response) | Creates a small network effect and brand halo pulling in the reverse direction — customers start expecting/seeking the badge, which becomes a sales argument for new merchants | Future Vision, speculative — needs real usage volume before it has any credibility |
| **Public API / Developer Platform** | Standard SaaS maturity step once there's a stable core product — lets larger merchants and agencies build custom automations rather than waiting on the roadmap | V3+/Future |
| **Gulf Dialect Expansion (UAE, Kuwait, Qatar)** | Already flagged as a geographic expansion path in the SRS's Market Analysis (Section 03) — formalizing it here as a product feature-flag (dialect pack) rather than just a GTM note | Post-KSA/Egypt traction |
| **In-Chat Loyalty/Rewards Agent** — automated points or repeat-purchase incentives issued directly inside the WhatsApp thread | Drives repeat purchase (Revenue KPI) without requiring a separate app most small-merchant customers won't install — fits the "meet the customer where they already are" thesis the whole product is built on | V3+ |

**A caution on this section specifically:** these are pattern-matched from how comparable platforms (Shopify, HubSpot, regional fintechs) have evolved, and from known regional pain points (COD fraud, e-invoicing mandates) — not from primary research on Waslah's actual merchants. Before committing any of these to a real roadmap, they need the same JTBD/Opportunity-Solution-Tree treatment Section 06 gave the core product, ideally informed by real MVP/V2 usage data rather than this document alone.
