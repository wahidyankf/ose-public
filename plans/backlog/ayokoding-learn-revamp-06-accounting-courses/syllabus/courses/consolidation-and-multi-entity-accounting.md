# Consolidation and Multi-entity Accounting (Annotated-Concept)

**Course ID**: `consolidation-and-multi-entity-accounting` · **Format**: Annotated-Concept.

**Scope note**: Teaches how a group combines its entities' books: control, the consolidation
worksheet, intercompany reconciliation and eliminations, non-controlling interests, goodwill basics,
and translation before consolidation, and how a system keeps it auditable. It excludes equity-method
accounting in depth, business-combination fair-value work in depth, and framework comparisons
(`financial-reporting-standards-ifrs-vs-gaap`).

**Short summary**: A group reports as if it were one company, so everything the companies did with
each other must disappear. You build a consolidation worksheet in Python, eliminate intercompany
items, and keep every elimination traceable.

## Why this exists · the big idea

- **The problem before the solution**: adding entity balances together double-counts intercompany
  sales, loans, and profits, and a group that eliminates them with untracked spreadsheet adjustments
  cannot explain its own numbers.
- **Keep-this-if-you-forget-everything**: consolidated statements show only transactions with the
  outside world; every elimination is an explicit, reviewable entry.

## Learning objectives

- Explain control and decide which entities are consolidated.
- Build a consolidation worksheet from entity trial balances mapped to a group chart.
- Reconcile intercompany balances and eliminate intercompany balances, revenue, and unrealized profit.
- Compute non-controlling interests and goodwill in simple acquisitions.
- Translate foreign subsidiaries before consolidation and design an auditable consolidation process.

## Prerequisites

- **Prior courses**: `chart-of-accounts-and-data-modeling` (group charts and partner dimensions),
  `financial-statements-and-close-cycle`, `multi-currency-accounting-and-fx-translation`,
  `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: consolidation mixes judgement (control, scope)
  with worksheet mechanics; annotated worksheets and Python eliminations fit that mix.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Combine the books of
  related companies and remove internal transactions."); `estimatedHours` from the drift test.

## Accuracy notes

- IFRS 10 "Consolidated Financial Statements" (issued May 2011, effective 1 January 2013):
  `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-10-consolidated-financial-statements/`,
  accessed 2026-10-09.
- ASC 810's variable-interest-entity model is mentioned for contrast only; the maker cites a primary
  source before describing it.

## Concepts

- **co-01 · group-structure** — parent, subsidiaries, and ownership percentages.
- **co-02 · control** — power, exposure to variable returns, and the link between them.
- **co-03 · consolidation-scope** — which entities are consolidated and from when.
- **co-04 · group-mapping** — entity accounts mapped to the group chart.
- **co-05 · worksheet** — entity columns, adjustments, eliminations, and the consolidated column.
- **co-06 · intercompany-reconciliation** — matching both sides of intercompany balances.
- **co-07 · balance-eliminations** — removing intercompany receivables, payables, and loans.
- **co-08 · revenue-eliminations** — removing intercompany sales and purchases.
- **co-09 · unrealized-profit** — removing profit on goods still held inside the group.
- **co-10 · investment-elimination** — removing the parent's investment against subsidiary equity.
- **co-11 · non-controlling-interest** — the part of a subsidiary the parent does not own.
- **co-12 · goodwill-basics** — consideration above the share of net assets, in a simple case.
- **co-13 · translate-then-consolidate** — foreign subsidiaries translated first.
- **co-14 · auditable-consolidation** — eliminations as versioned, explained entries in a
  consolidation ledger.

## Worked examples

### Theme A — Groups and control (`learning/theme-a-groups-and-control.md`)

- **ex-01 · group-chart-diagram** — draw a group with ownership percentages (Mermaid) — verify. (co-01)
- **ex-02 · control-tests** — apply the control elements to four investees — verify the decisions.
  (co-02)
- **ex-03 · effective-ownership** — compute indirect ownership through two levels — verify. (co-01)
- **ex-04 · scope-by-date** — include an acquired subsidiary from its acquisition date — verify. (co-03)
- **ex-05 · entity-register** — model entities, currencies, and parents — verify validation. (co-01)
- **ex-06 · reporting-calendar-alignment** — align a subsidiary with a different year end — verify.
  (co-03)
- **ex-07 · accounting-policy-alignment** — adjust a subsidiary to group policy — verify. (co-05)
- **ex-08 · scope-report** — produce the consolidation scope report — verify. (co-03)

### Theme B — The worksheet (`learning/theme-b-the-worksheet.md`)

- **ex-09 · load-entity-tbs** — load three entity trial balances — verify each balances. (co-05)
- **ex-10 · map-to-group-chart** — map local accounts to the group chart — verify completeness. (co-04)
- **ex-11 · aggregate-columns** — build the aggregated column — verify. (co-05)
- **ex-12 · worksheet-layout** — print the worksheet — verify column totals. (co-05)
- **ex-13 · adjustments-column** — add policy-alignment adjustments — verify. (co-05)
- **ex-14 · eliminations-column** — add an empty eliminations column with checks — verify. (co-05)
- **ex-15 · consolidated-statements** — produce consolidated statements — verify they balance. (co-05)
- **ex-16 · worksheet-diagram** — draw the worksheet flow (Mermaid) — verify. (co-05)
- **ex-17 · worksheet-checks** — check that every column balances — verify. (co-05)

### Theme C — Intercompany and eliminations (`learning/theme-c-intercompany-and-eliminations.md`)

- **ex-18 · intercompany-tagging** — find intercompany lines by partner dimension — verify. (co-06)
- **ex-19 · intercompany-matching** — match both sides by partner and reference — verify. (co-06)
- **ex-20 · mismatch-report** — explain differences (timing, FX, missing entries) — verify. (co-06)
- **ex-21 · balance-elimination** — eliminate a receivable and payable — verify. (co-07)
- **ex-22 · loan-elimination** — eliminate a loan and its interest — verify. (co-07)
- **ex-23 · sales-elimination** — eliminate intercompany sales and purchases — verify. (co-08)
- **ex-24 · unrealized-profit-inventory** — eliminate profit on goods still held — verify. (co-09)
- **ex-25 · unrealized-profit-reversal** — release it when the goods are sold outside — verify. (co-09)
- **ex-26 · dividend-elimination** — eliminate an intercompany dividend — verify. (co-07)
- **ex-27 · elimination-rules** — generate eliminations from rules — verify. (co-14)
- **ex-28 · eliminations-balance** — check every elimination balances — verify. (co-14)

### Theme D — Non-controlling interests and goodwill (`learning/theme-d-nci-and-goodwill.md`)

- **ex-29 · investment-elimination** — eliminate investment against equity for a 100% subsidiary —
  verify. (co-10)
- **ex-30 · goodwill-simple** — compute goodwill in a simple acquisition — verify. (co-12)
- **ex-31 · nci-at-acquisition** — compute NCI as a share of net assets — verify. (co-11)
- **ex-32 · nci-share-of-profit** — split profit between parent and NCI — verify. (co-11)
- **ex-33 · nci-in-equity** — present NCI in equity — verify. (co-11)
- **ex-34 · post-acquisition-reserves** — split retained earnings since acquisition — verify. (co-10)
- **ex-35 · change-in-ownership** — buy more shares without losing control — verify the equity
  transaction. (co-11)
- **ex-36 · loss-of-control-preview** — outline deconsolidation — verify the steps. (co-03)

### Theme E — Currencies and system design (`learning/theme-e-currencies-and-systems.md`)

- **ex-37 · translate-then-consolidate** — translate a EUR subsidiary first — verify. (co-13)
- **ex-38 · fx-differences-on-intercompany** — explain intercompany mismatches caused by FX — verify.
  (co-06, co-13)
- **ex-39 · translation-reserve-and-nci** — split the translation reserve with NCI — verify. (co-11,
  co-13)
- **ex-40 · consolidation-ledger** — store eliminations as entries in a separate ledger — verify. (co-14)
- **ex-41 · versioned-runs** — version each consolidation run — verify a rerun reproduces it. (co-14)
- **ex-42 · topside-adjustments** — control manual top-side entries with approval — verify. (co-14)
- **ex-43 · drill-down** — trace a consolidated number to entity lines and eliminations — verify.
  (co-14)
- **ex-44 · segment-preview** — report by segment from entity tags — verify. (co-05)
- **ex-45 · consolidation-pack** — produce the pack with checks — verify all checks pass. (co-05,
  co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-intercompany-not-eliminated`, `kata-02-unrealized-profit-missed`,
  `kata-03-nci-wrong-share`, `kata-04-translate-after-consolidate`, `kata-05-elimination-unbalanced`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A consolidation engine.** Three entities (one EUR, one 80%-owned), group mapping, intercompany
matching with a mismatch report, rule-based eliminations, NCI, translation, and a versioned
consolidation run with drill-down. The `run.yaml` runs one year and compares the consolidated
statements and the pack.

## Code and harness

- Python standard library only.

## Lineage

- Replaces the 200-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 4 (Groups, currencies, and standards), position 13.
- `skills/sharia-accounting` — Phase 4 (Groups, currencies, and standards), position 13.
