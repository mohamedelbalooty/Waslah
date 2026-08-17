# AGENTS.md

Documentation-only repo: the Waslah "AI Revenue Guardian" requirements corpus. There is **no code, build, test, or CI** — do not run npm/package commands.

## Document hierarchy (authority order)

1. `docs/Waslah_AI_Revenue_Guardian_SRS_V2.md` — **authoritative V2 baseline.** Where it differs from any other doc, it wins; each intentional change is cross-referenced to a `RES-xx` decision ID.
2. `docs/Waslah_AI_Revenue_Guardian_SRS.md` — base product SRS (discovery + MVP requirements).
3. `docs/Waslah_Feature_List.md` — flattened feature list with phase tags: 🟢 MVP / 🟡 V2 / 🔵 V3 / ⚪ future.
4. `docs/development/Backend_SRS.md`, `docs/development/Frontend_SRS.md` — implementation specs tracing to the above; they share one API contract and one RBAC matrix.

## Editing rules

- Do not reintroduce ambiguity resolved by a `RES-xx` decision (SRS_V2 §05). Preserve decision IDs and cross-references when editing.
- Keep requirement IDs collision-free: `FR-001..015` (base SRS), `NEW-FR-010..030` (V2 additions), `BR-*` (business rules), `NEW-SEC-*`, `NEW-NFR-*`, `OPEN-xx` (stakeholder-owned, unresolved — do not resolve these from document logic).
- V3-deferred items (custom reports, team leaderboard, revenue-opportunity score; agents Munjiz/Rased/Murshid/Thaqib) are explicitly out of V2 scope — never add them to V2 scope tables.
- Backend_SRS §4 layout (`src/core/**`, `prisma/schema.prisma`, …) and commands (`npm run typecheck`, `npm test`) describe the **target** code repo, which does not exist yet — specifications, not files here.
- The Feature List "Future Features" section is unvalidated hypothesis, not committed scope; keep it tagged as such.
