# Managerial and Cost Accounting (Annotated-Concept)

**Course ID**: `managerial-and-cost-accounting` · **Format**: Annotated-Concept.

**Scope note**: Teaches the internal side of accounting: cost behavior, cost-volume-profit analysis,
job and process costing, overhead allocation, activity-based costing, budgets, standard costs and
variances, and relevant-cost decisions. It excludes inventory valuation and cost of goods sold postings
(`inventory-and-cogs-accounting`) and external reporting rules.

**Short summary**: Managers need different numbers than investors. You build cost models in Python
that answer "what does this product really cost", "how many must we sell to break even", and "why did
we spend more than planned" — and you see how allocation choices change the answers.

## Why this exists · the big idea

- **The problem before the solution**: a cost report that spreads overhead by a careless rule makes
  profitable products look unprofitable and leads to wrong decisions, even though every number adds
  up.
- **Keep-this-if-you-forget-everything**: every cost figure answers a question; choose the costing
  method that fits the question, and show the assumption.

## Learning objectives

- Classify costs as fixed, variable, or mixed, and compute contribution margin and break-even.
- Cost jobs and processes, including equivalent units.
- Allocate overhead with a single rate and with activity-based costing, and compare the results.
- Build static and flexible budgets and compute price and quantity variances.
- Decide make-or-buy, special orders, and product mix with relevant costs.

## Prerequisites

- **Prior courses**: `financial-statements-and-close-cycle` (the income statement the internal reports
  start from), `just-enough-python`.
- **Assumed knowledge**: basic algebra.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: the course teaches decision models; many are
  clearest as annotated tables and charts, and the rest as small Python models.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Use cost information to
  support business decisions."); `estimatedHours` from the drift test.

## Accuracy notes

- Cost behavior, CVP, job and process costing, ABC, standard costing, and relevant costing: stable
  domain facts taught with original numbers.

## Concepts

- **co-01 · cost-behavior** — fixed, variable, and mixed costs over a relevant range.
- **co-02 · contribution-margin** — price minus variable cost, per unit and in total.
- **co-03 · break-even-and-cvp** — the volume where profit is zero, and what-if analysis.
- **co-04 · cost-objects** — products, jobs, customers, or departments that collect costs.
- **co-05 · job-costing** — costs traced to individual jobs.
- **co-06 · process-costing** — costs averaged over units, with equivalent units.
- **co-07 · overhead-rate** — a predetermined rate and its under- or over-application.
- **co-08 · activity-based-costing** — overhead assigned by activities and their drivers.
- **co-09 · budgets** — static and flexible budgets.
- **co-10 · standard-costs** — expected price and quantity per unit.
- **co-11 · variances** — price, quantity, and overhead variances, and how to read them.
- **co-12 · relevant-costs** — future costs that differ between options; sunk costs ignored.
- **co-13 · responsibility-reporting** — reports by the manager who controls the cost.
- **co-14 · cost-model-assumptions** — every allocation is an assumption to state and test.

## Worked examples

### Theme A — Cost behavior and CVP (`learning/theme-a-cost-behavior-and-cvp.md`)

- **ex-01 · classify-costs** — classify 12 costs — verify the table. (co-01)
- **ex-02 · high-low-split** — split a mixed cost with the high-low method — verify the fixed and
  variable parts. (co-01)
- **ex-03 · regression-split** — split it with least squares (pure Python) — verify the coefficients.
  (co-01)
- **ex-04 · contribution-margin** — compute unit and ratio margins — verify. (co-02)
- **ex-05 · break-even-units** — compute break-even units — verify. (co-03)
- **ex-06 · target-profit** — compute units for a target profit — verify. (co-03)
- **ex-07 · cvp-chart** — draw a cost-volume-profit chart as an SVG from Python — verify the
  crossing point. (co-03)
- **ex-08 · sales-mix-break-even** — break even with two products — verify. (co-03)
- **ex-09 · operating-leverage** — compare two cost structures — verify the leverage factor. (co-01,
  co-03)

### Theme B — Job and process costing (`learning/theme-b-job-and-process-costing.md`)

- **ex-10 · job-cost-sheet** — collect materials, labor, and overhead per job — verify the sheet.
  (co-05)
- **ex-11 · applied-overhead** — apply overhead by a predetermined rate — verify. (co-07)
- **ex-12 · under-over-applied** — compute and dispose of the difference — verify the entry. (co-07)
- **ex-13 · job-profitability** — compare job price and cost — verify. (co-05)
- **ex-14 · process-flow-diagram** — draw departments and transfers (Mermaid) — verify. (co-06)
- **ex-15 · equivalent-units** — compute equivalent units (weighted average) — verify. (co-06)
- **ex-16 · cost-per-equivalent-unit** — compute it — verify. (co-06)
- **ex-17 · transferred-in-costs** — carry costs to the next department — verify. (co-06)
- **ex-18 · costing-postings** — post work-in-process flows — verify balances. (co-05, co-06)

### Theme C — Overhead and activity-based costing (`learning/theme-c-overhead-and-abc.md`)

- **ex-19 · single-rate-distortion** — allocate overhead by labor hours for two products — verify the
  result. (co-07, co-14)
- **ex-20 · activity-pools** — define activities and drivers — verify the pool totals. (co-08)
- **ex-21 · abc-allocation** — allocate by drivers — verify the new product costs. (co-08)
- **ex-22 · compare-methods** — compare single-rate and ABC — verify the reversal of ranking.
  (co-08, co-14)
- **ex-23 · customer-profitability** — apply ABC to customers — verify. (co-04, co-08)
- **ex-24 · idle-capacity** — keep unused capacity out of product costs — verify. (co-08)
- **ex-25 · allocation-as-config** — keep drivers as configuration data — verify a driver change
  re-costs products. (co-14)
- **ex-26 · reciprocal-services** — allocate support departments with the step-down method — verify.
  (co-07)
- **ex-27 · allocation-audit-trail** — record which rule produced each allocated amount — verify.
  (co-14)

### Theme D — Budgets, standards, and variances (`learning/theme-d-budgets-and-variances.md`)

- **ex-28 · static-budget** — build a static budget — verify. (co-09)
- **ex-29 · flexible-budget** — flex it to actual volume — verify. (co-09)
- **ex-30 · standard-cost-card** — define standard price and quantity — verify the unit cost. (co-10)
- **ex-31 · material-variances** — compute price and quantity variances — verify signs. (co-11)
- **ex-32 · labor-variances** — compute rate and efficiency variances — verify. (co-11)
- **ex-33 · overhead-variances** — compute spending and volume variances — verify. (co-11)
- **ex-34 · variance-postings** — post standard-cost variances — verify. (co-10, co-11)
- **ex-35 · variance-report** — report by responsible manager — verify. (co-13)
- **ex-36 · favorable-is-not-good** — show a favorable price variance caused by poor quality — verify
  the narrative against the numbers. (co-11)
- **ex-37 · rolling-forecast** — roll a budget forward a month — verify. (co-09)

### Theme E — Decisions with relevant costs (`learning/theme-e-relevant-cost-decisions.md`)

- **ex-38 · sunk-cost-trap** — show a decision changed by ignoring sunk cost — verify. (co-12)
- **ex-39 · make-or-buy** — compare relevant costs — verify the choice. (co-12)
- **ex-40 · special-order** — evaluate a one-off order with spare capacity — verify. (co-12)
- **ex-41 · drop-a-product** — evaluate dropping a product with shared fixed costs — verify. (co-12)
- **ex-42 · constrained-resource** — rank products by margin per bottleneck hour — verify. (co-02,
  co-12)
- **ex-43 · transfer-price-preview** — compare market and cost-based transfer prices — verify. (co-13)
- **ex-44 · kpi-tree** — build a KPI tree from margin to drivers (Mermaid) — verify. (co-13)
- **ex-45 · decision-memo** — produce a decision memo with stated assumptions — verify each number is
  traced. (co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-break-even-uses-total-cost`, `kata-02-equivalent-units-wrong`,
  `kata-03-variance-sign-flipped`, `kata-04-sunk-cost-included`, `kata-05-overhead-double-allocated`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A product-cost and decision model.** For a fictional workshop with three products, the reader
builds a Python model that computes costs under a single rate and under ABC, flexes the budget to
actuals, computes variances, and answers one make-or-buy question with a memo. The `run.yaml`
compares the model's report with the expected output.

## Code and harness

- Python standard library only; charts are written as SVG text so the output is deterministic.

## Lineage

- Replaces the 239-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 3 (Assets, costs, and inventory), position 8 · the cost
  concepts inventory valuation builds on.
- `skills/sharia-accounting` — Phase 3 (Assets, costs, and inventory), position 8.
