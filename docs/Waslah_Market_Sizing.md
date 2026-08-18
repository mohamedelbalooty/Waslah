# Waslah — Market Sizing Analysis
### TAM / SAM / SOM · August 2026
### Methodology: Bottom-up merchant count × ARPU, validated top-down

> **Status:** First-pass sizing for strategic planning and investor conversations. All figures use publicly available data (cited) combined with conservative operational assumptions derived from the SRS pricing model. Update after first 50 merchant interviews.

---

## 1. Market Context — Why MENA WhatsApp Commerce

WhatsApp is the dominant commerce channel for SME merchants in Egypt and the Gulf — not an emerging experiment. Key structural facts:

| Fact | Source / Basis |
|---|---|
| WhatsApp penetration Egypt | ~93% of internet users (DataReportal 2025) |
| WhatsApp penetration KSA | ~96% of internet users (DataReportal 2025) |
| MENA e-commerce GMV 2025 | ~$57B (Statista 2025); Egypt ~$12B, KSA ~$20B |
| WhatsApp as primary customer-service channel for SMEs | ~68% of Egyptian SME merchants (Meta Business Survey 2024) |
| COD still dominant | ~65% of MENA e-commerce transactions (Bain & Company 2024) |
| WhatsApp Business users (MENA) | >8M businesses (Meta 2025) |

The core pain — merchants manually handle hundreds of WhatsApp conversations daily, losing sales to slow response and abandonment — is validated by market structure, not just anecdote.

---

## 2. TAM — Total Addressable Market

**Definition:** All e-commerce-active SME merchants in Egypt + KSA who use WhatsApp as a sales/customer-service channel.

### Merchant count methodology (bottom-up)

| Geography | E-commerce active SMEs (est.) | WhatsApp-using subset (est. %) | WhatsApp Commerce Merchants |
|---|---|---|---|
| Egypt | ~350,000 | ~72% | ~252,000 |
| KSA | ~280,000 | ~78% | ~218,000 |
| **Total Phase 1 TAM** | **~630,000** | — | **~470,000** |

*Sources: Egypt SME Development Authority (2024) · Saudi General Authority for SMEs — Monshaat (2024) · Meta WhatsApp Business penetration estimates.*

### ARPU baseline (TAM level — minimum viable buyer)

At the TAM level we assume Starter plan only ($49/month), no success fee. This is maximally conservative.

```
TAM = 470,000 merchants × $49/month × 12 months
TAM = $276M ARR (Egypt + KSA, conservative Starter-only)
```

**Top-down cross-check:** MENA conversational commerce SaaS market estimated at $420M–$600M by 2027 (Grand View Research 2025). Our bottom-up $276M at Starter-only sits at the lower end, supporting a reasonable range of **$250M–$450M TAM** depending on ARPU mix.

**Selected TAM: ~$310M ARR** (blended ARPU assumption: 60% Starter / 30% Growth / 10% Pro, no success fee).

---

## 3. SAM — Serviceable Addressable Market

**Definition:** Merchants who (a) have sufficient conversation volume to meaningfully benefit from AI, (b) generate enough GMV that the success fee creates a defensible ROI narrative, and (c) are reachable by Waslah's direct + partner GTM in Years 1–3.

### SAM filters applied to TAM

| Filter | Criterion | Reduction |
|---|---|---|
| Conversation volume threshold | ≥ 200 WhatsApp conversations/month (Starter plan useful, Growth plan attractive) | Retain ~35% of TAM |
| GMV threshold | ≥ $5,000/month GMV (success fee has dollar impact; ROI case clear) | Retain ~60% of volume-qualified merchants |
| Digital sophistication | Uses Shopify / WooCommerce / Salla / Zid OR comfortable connecting an API (Waslah's integration set) | Retain ~55% |
| Geography reachability | Egypt urban (Cairo, Alexandria, Giza) + KSA (Riyadh, Jeddah, Dammam) — first-city targeting | Retain ~70% |

**Cumulative SAM retention:** 35% × 60% × 55% × 70% ≈ **8% of TAM merchants**

```
SAM merchants = 470,000 × 8% ≈ 37,600 merchants

Blended ARPU (SAM level): $149/month average (Growth plan likely fit + partial success fee)
  = 37,600 × $149 × 12 ≈ $67M ARR

Add success fee contribution (conservative 0.5% on 40% of GMV attributed):
  37,600 merchants × ~$8,000/month GMV × 40% attribution × 0.5% fee = ~$720K/month = ~$8.6M ARR incremental

SAM ≈ $75M ARR
```

**Selected SAM: ~$75M ARR**

---

## 4. SOM — Serviceable Obtainable Market

**Definition:** What Waslah can realistically capture through Years 1–3 (MVP through V2) given team size, sales capacity, and competitive dynamics.

### SOM build-up by year

| Year | Milestone | New Merchants | Cumulative | Est. Monthly Churn | Net Active | Avg MRR/merchant | ARR |
|---|---|---|---|---|---|---|---|
| Y1 (MVP) | 12 months, founder-led sales, EG focus, 1 channel (WA) | 150 | 150 | 3% | ~138 | $75 (mostly Starter + early Growth) | ~$124K |
| Y2 (V2) | 3 channels, Aaed + Hafeth live, KSA entry, first CS team | 600 | ~738 | 3% | ~650 | $120 (Growth mix shifting in) | ~$936K |
| Y3 (V2 mature) | Partner channel (agencies), Salla/Zid native integration, word-of-mouth | 1,400 | ~1,950 | 2.5% | ~1,700 | $150 (Growth dominant, Pro growing) | ~$3.06M |

**Success fee incremental (Y3):** ~1,700 merchants × $3,000 avg monthly attributed revenue × 0.75% blended rate = ~$38K/month = ~$460K ARR incremental.

```
SOM Year 3 = $3.06M (subscription) + $0.46M (success fees) ≈ $3.5M ARR
SOM % of SAM = $3.5M / $75M ≈ 4.7% — achievable for a focused, well-funded 3-year plan
```

---

## 5. Summary Table

| | Merchants | ARR |
|---|---|---|
| **TAM** (Egypt + KSA, WhatsApp-active SMEs) | ~470,000 | ~$310M |
| **SAM** (qualified by volume, GMV, tech, geography) | ~37,600 | ~$75M |
| **SOM Year 1** | ~138 | ~$124K |
| **SOM Year 2** | ~650 | ~$936K |
| **SOM Year 3** | ~1,700 | ~$3.5M |

---

## 6. Key Assumptions & Sensitivities

| Assumption | Base Case | Bear Case | Bull Case |
|---|---|---|---|
| WhatsApp-active SME merchants (Egypt+KSA) | 470,000 | 350,000 | 650,000 |
| SAM conversion rate | 8% | 5% | 12% |
| Y1 merchant acquisition | 150 | 80 | 250 |
| Monthly churn | 3% | 5% | 2% |
| Blended ARPU Y3 | $150/month | $100/month | $200/month |
| Success fee as % of subscription ARR | 15% | 5% | 30% |

**Biggest risk to upside:** Monthly churn. At 5% churn (vs 3% base), Y3 net active merchants drop to ~1,100 (vs 1,700), cutting ARR by ~35%.  
**Biggest lever for upside:** ARPU growth from Growth → Pro upgrades as merchants scale conversation volume.

---

## 7. Geographic Expansion (Post-Y3 TAM Extension)

| Market | Est. WhatsApp-active SMEs | Incremental SAM | Priority |
|---|---|---|---|
| UAE | ~85,000 | ~$14M ARR | High (wealth, sophistication, Gulf dialect close to KSA) |
| Kuwait / Qatar | ~40,000 | ~$7M ARR | Medium (smaller market, high ARPU potential) |
| Jordan / Lebanon | ~60,000 | ~$5M ARR | Low (smaller wallets, lower GMV threshold) |
| Morocco | ~120,000 | ~$10M ARR | Medium (Darija dialect investment needed) |

Gulf expansion (UAE → Kuwait → Qatar) is the natural post-Egypt/KSA move and extends SAM to **~$111M ARR**.

---

## 8. Data Sources

- DataReportal Digital 2025 (Egypt, KSA internet/WhatsApp penetration)
- Statista MENA e-commerce GMV 2025
- Saudi Monshaat SME Census 2024
- Egypt SME Development Authority report 2024
- Meta WhatsApp Business global stats Q1 2025
- Bain & Company MENA Retail & E-Commerce 2024
- Grand View Research: MENA Conversational Commerce SaaS 2025

> **Caution:** Merchant count estimates are extrapolated from partial census data and Meta's self-reported business counts. Primary research (merchant interviews, Salla/Zid partner data) would sharpen the SAM filter conversion rates significantly.

---

*Document owner: CEO / Head of Strategy · Review cycle: Quarterly or after 50+ merchant interviews · Not for public distribution.*
