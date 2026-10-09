# Financial Reporting Standards: IFRS vs GAAP (Annotated-Concept)

**Course ID**: `financial-reporting-standards-ifrs-vs-gaap` · **Format**: Annotated-Concept.

**Scope note**: Compares how IFRS and US GAAP recognize, measure, and present the events earlier
courses taught (revenue, inventory, fixed assets, leases, intangibles, consolidation), explains how
standards change over time, and designs systems that report under more than one framework. It
excludes Sharia frameworks (`sharia-accounting-and-aaoifi-standards`) and machine-readable tagging
(`financial-reporting-and-xbrl`).

**Short summary**: The same transaction can produce different numbers under different rulebooks. You
learn where IFRS and US GAAP differ, how to track which rule applies on which date, and how a ledger
reports under two frameworks without keeping two separate sets of books by hand.

## Why this exists · the big idea

- **The problem before the solution**: a system that hard-codes one framework's rules cannot serve a
  group with a US parent and IFRS subsidiaries, and breaks every time a standard changes.
- **Keep-this-if-you-forget-everything**: a reporting framework is a versioned policy with an
  effective date; model it as data, not as code paths sprinkled through the ledger.

## Learning objectives

- Explain who sets IFRS and US GAAP and how a new standard reaches a ledger.
- Identify the main recognition, measurement, and presentation differences for the topics taught
  earlier in the path.
- State effective dates explicitly, including IFRS 18 from 1 January 2027.
- Design multi-framework reporting with adjustment ledgers or framework-specific books.
- Map a national framework that adopts IFRS (Indonesia's PSAK numbering) to the IFRS standards it
  mirrors.

## Prerequisites

- **Prior courses**: `accrual-accounting-and-revenue-recognition`, `fixed-assets-and-depreciation`,
  `inventory-and-cogs-accounting`, `lease-and-intangible-asset-accounting`,
  `consolidation-and-multi-entity-accounting` (each comparison builds on its course),
  `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: the course is comparative reasoning; side-by-side
  tables and annotated cases carry most of it, with Python where two frameworks produce different
  schedules from the same input.
- **Worked examples**: floor 45 in five themes; at least 23 code-bearing (about half, because many
  comparisons are tables). **Words**: at least 22,000. **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Compare how IFRS and US
  GAAP recognize, measure, and present the same events."); `estimatedHours` from the drift test.

## Accuracy notes

- IFRS standard pages for IFRS 9, 10, 15, 16, 18 and IAS 2, 16, 21, 38 on `https://www.ifrs.org/`,
  accessed 2026-10-09; IFRS 18 is effective 1 January 2027 and replaces IAS 1.
- US GAAP facts rest on secondary sources found on 2026-10-09 (FASB's site returned HTTP 403; Deloitte
  DART key-dates page `https://dart.deloitte.com/USDART/home/publications/deloitte/key-dates/key-dates`).
  The maker cites a primary FASB or SEC source for every US GAAP rule it states, or words it as a
  difference to check.
- Indonesia renumbered its standards from 1 January 2024: IFRS-based PSAK use the 1xx and 2xx ranges
  (for example PSAK 115 for IFRS 15, PSAK 116 for IFRS 16, PSAK 109 for IFRS 9, PSAK 202 for IAS 2),
  per the IAI table
  `https://web.iaiglobal.or.id/assets/files/file_publikasi/Perubahan_Penomoran_PSAK_ISAK_dalam_SAK_Indonesia.pdf`,
  accessed 2026-10-09.

## Concepts

- **co-01 · standard-setters** — IASB and FASB, due process, and adoption by jurisdictions.
- **co-02 · conceptual-frameworks** — the shared ideas behind both rulebooks.
- **co-03 · effective-dating** — standards and amendments apply from stated dates, sometimes with
  early adoption.
- **co-04 · revenue-differences** — a largely converged model with remaining differences.
- **co-05 · inventory-differences** — LIFO allowed only under US GAAP; write-down reversals.
- **co-06 · ppe-differences** — components, revaluation, and impairment reversal.
- **co-07 · lease-differences** — single lessee model versus finance and operating leases.
- **co-08 · intangible-differences** — development costs and internal-use software.
- **co-09 · consolidation-differences** — control model versus the variable-interest model.
- **co-10 · presentation** — IAS 1 today, IFRS 18 from 2027, and US GAAP presentation.
- **co-11 · national-adoption** — a jurisdiction adopting IFRS under its own numbering.
- **co-12 · multi-framework-design** — primary book plus adjustment ledgers, or parallel books.
- **co-13 · policy-as-data** — accounting policies stored as versioned configuration.
- **co-14 · transition** — moving from one standard to another with comparatives.

## Worked examples

### Theme A — Who sets the rules (`learning/theme-a-who-sets-the-rules.md`)

- **ex-01 · standard-setting-diagram** — draw due process from project to effective date (Mermaid) —
  verify. (co-01)
- **ex-02 · adoption-map** — tabulate how five jurisdictions adopt IFRS — verify each row cites a
  source. (co-01, co-11)
- **ex-03 · effective-date-table** — model standards with effective dates in Python — verify which
  apply on three dates. (co-03)
- **ex-04 · early-adoption** — allow an entity to adopt early — verify the policy lookup. (co-03)
- **ex-05 · psak-mapping** — map PSAK numbers to IFRS standards — verify the collision note (PSAK 109
  is now IFRS 9). (co-11)
- **ex-06 · conceptual-framework-elements** — compare element definitions — verify the table. (co-02)
- **ex-07 · change-pipeline** — show how a new standard reaches a ledger (impact, config, tests) —
  verify the checklist. (co-03, co-13)
- **ex-08 · standards-register** — keep a register of standards in force — verify. (co-03)

### Theme B — Recognition differences (`learning/theme-b-recognition.md`)

- **ex-09 · revenue-converged** — run one contract through both models — verify equal results. (co-04)
- **ex-10 · revenue-difference-case** — show one case where the results differ — verify. (co-04)
- **ex-11 · development-costs** — capitalize under IFRS, expense under US GAAP (outside software) —
  verify the profit difference. (co-08)
- **ex-12 · internal-use-software** — compare the US GAAP stages with IAS 38 — verify. (co-08)
- **ex-13 · lessee-recognition** — compare the lessee expense pattern — verify by year. (co-07)
- **ex-14 · consolidation-scope** — show an entity consolidated under one model only — verify. (co-09)
- **ex-15 · provisions-threshold-preview** — compare recognition thresholds for provisions — verify.
  (co-02)
- **ex-16 · contingent-assets-preview** — compare treatment — verify. (co-02)
- **ex-17 · recognition-table** — summarize recognition differences — verify each row links an
  example. (co-04–co-09)
- **ex-18 · recognition-config** — encode two differences as policy data — verify switching policy
  changes the output. (co-13)

### Theme C — Measurement differences (`learning/theme-c-measurement.md`)

- **ex-19 · lifo-vs-fifo** — compute both on one item — verify why IFRS forbids LIFO. (co-05)
- **ex-20 · inventory-write-down-reversal** — reverse under IFRS, not under US GAAP — verify. (co-05)
- **ex-21 · component-depreciation** — compare component and composite depreciation — verify. (co-06)
- **ex-22 · revaluation-model** — revalue under IFRS; not allowed under US GAAP — verify. (co-06)
- **ex-23 · impairment-models** — compare one-step and two-step impairment — verify outcomes. (co-06)
- **ex-24 · impairment-reversal** — reverse under IFRS only — verify. (co-06)
- **ex-25 · lease-measurement** — compare measurement for an operating lease — verify. (co-07)
- **ex-26 · fx-differences-preview** — note where translation rules differ in practice — verify. (co-10)
- **ex-27 · measurement-table** — summarize measurement differences — verify. (co-05–co-07)
- **ex-28 · dual-schedule-engine** — run one asset under two policies — verify both schedules. (co-12,
  co-13)

### Theme D — Presentation and disclosure (`learning/theme-d-presentation.md`)

- **ex-29 · ias1-vs-ifrs18** — present one income statement under IAS 1 and IFRS 18 — verify the new
  subtotals. (co-10)
- **ex-30 · ifrs18-categories** — classify income and expenses into IFRS 18 categories — verify.
  (co-10)
- **ex-31 · management-performance-measures** — show the IFRS 18 disclosure for a non-IFRS measure —
  verify the reconciliation. (co-10)
- **ex-32 · us-gaap-presentation** — present the same data under US GAAP — verify. (co-10)
- **ex-33 · comparatives-on-transition** — restate comparatives on IFRS 18 adoption — verify. (co-14)
- **ex-34 · disclosure-data-model** — model note data as structured records — verify. (co-10)
- **ex-35 · presentation-config** — keep layouts as configuration per framework and date — verify.
  (co-13)
- **ex-36 · presentation-checks** — check every presented subtotal ties to the ledger — verify. (co-10)

### Theme E — Systems for more than one framework (`learning/theme-e-multi-framework-systems.md`)

- **ex-37 · design-options** — compare parallel books and adjustment ledgers (Mermaid) — verify the
  trade-off table. (co-12)
- **ex-38 · adjustment-ledger** — post framework adjustments to a separate ledger — verify both
  results. (co-12)
- **ex-39 · parallel-books** — post to two books from one event — verify. (co-12)
- **ex-40 · policy-versioning** — version policies by effective date — verify which applies. (co-13)
- **ex-41 · transition-run** — run a transition from one standard to another — verify the opening
  adjustment. (co-14)
- **ex-42 · reconciliation-between-frameworks** — reconcile equity between frameworks — verify. (co-12)
- **ex-43 · tests-per-framework** — test each policy combination — verify the matrix. (co-13)
- **ex-44 · sharia-framework-preview** — show how a third framework (AAOIFI) fits the same design —
  verify. (co-12)
- **ex-45 · framework-review-pack** — produce a review pack of differences for one year — verify.
  (co-12, co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-lifo-under-ifrs`, `kata-02-reversal-under-us-gaap`,
  `kata-03-policy-hard-coded`, `kata-04-wrong-effective-date`, `kata-05-adjustment-ledger-unbalanced`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A two-framework reporting run.** One year of events for a small group reported under IFRS and US
GAAP from one primary book plus an adjustment ledger, with a framework reconciliation and an IFRS 18
income statement. The `run.yaml` compares both statement sets and the reconciliation.

## Code and harness

- Python standard library only.

## Lineage

- Replaces the 199-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 4 (Groups, currencies, and standards), position 14.
- `skills/sharia-accounting` — Phase 4 (Groups, currencies, and standards), position 14 · the
  framework model that AAOIFI later joins.
