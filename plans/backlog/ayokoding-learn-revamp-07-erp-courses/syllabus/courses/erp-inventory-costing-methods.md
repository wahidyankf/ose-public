# ERP Inventory Costing Methods (By Example)

**Course ID**: `erp-inventory-costing-methods` · **Format**: By Example.

**Scope note**: Shows how a system applies FIFO layers, moving average, and standard cost, with landed cost, variances, revaluation, and reproducible valuation. It excludes accounting-policy theory (inventory-and-cogs-accounting) and concurrency (erp-inventory-integrity-and-concurrency).

**Short summary**: Inventory valuation needs an explicit cost-flow policy and a reproducible layer history.

## Why this exists · the big idea

- **The problem before the solution**: Without a defined cost flow, the same movements produce different margins depending on who ran the report and when.
- **Keep-this-if-you-forget-everything**: Valuation is a pure function of movement history and policy, so it can always be re-run.

## Learning objectives

After this course you can:

1. value issues with FIFO layers and with moving average and compare the margins.
2. use standard cost and record purchase price variance on receipt.
3. allocate landed cost across receipt lines.
4. restate valuation after a backdated receipt.
5. reproduce any valuation report from movements and policy and reconcile it to the GL.

## Prerequisites

- **Prior courses**: `inventory-and-warehouse-management`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Cost of goods sold basics from the accounting course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 9 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `inventory-and-cogs-accounting`.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- IFRS Foundation text of IAS 2 Inventories for the permitted cost formulas. IAS 2 does not permit LIFO. Verify the paragraph against the current text before stating it; US GAAP differs.
- Python decimal documentation for exact costs and rounding.

## Concepts

- **co-01 · cost-layer** — a receipt quantity with its unit cost.
- **co-02 · fifo-flow** — issues consume the oldest layers first.
- **co-03 · moving-average** — unit cost recomputed after each receipt.
- **co-04 · standard-cost** — a fixed planned cost per unit.
- **co-05 · purchase-price-variance** — the difference between actual and standard cost on receipt.
- **co-06 · landed-cost-allocation** — freight and duty spread over receipt lines.
- **co-07 · cost-revaluation** — restating inventory value after a cost change.
- **co-08 · backdated-receipt-impact** — how a receipt dated in the past changes later issues.
- **co-09 · negative-stock-costing** — costing an issue made before the receipt is entered.
- **co-10 · cogs-posting** — the entry created when stock is issued to a sale.
- **co-11 · valuation-report** — quantity and value by item at a date.
- **co-12 · cost-rounding** — where cents are lost and how it is controlled.
- **co-13 · cost-method-per-item** — one method per item or item group.
- **co-14 · method-change-control** — switching method with approval and revaluation.
- **co-15 · nrv-writedown-hook** — lowering value when net realizable value is below cost.
- **co-16 · reproducibility** — rerunning valuation from the movement history.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each method and each edge case (backdating, negative stock, method change) is a small numeric scenario with a checkable value, which By Example teaches as many short runs over the same movement history.

| Target             | Value                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                     |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                         |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                       |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                    |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 1 of 9 anchors; Python 3.14, standard library only (no lockfile) in 8 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: FIFO layers** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · fifo-issue** (Python 3.14) — issue 120 units across two receipt layers, then verify cost of goods sold uses the oldest cost first.
- **Cluster: Moving average** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · average-after-receipt** (Python 3.14) — recompute average cost after each receipt, then verify the issue cost uses the current average.
- **Cluster: COGS posting** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · cogs-entry-on-issue** (Python 3.14) — post cost of goods sold from a sale, then verify the inventory credit equals the layer cost.

### Intermediate (28 examples)

- **Cluster: Standard cost** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · ppv-on-receipt** (Python 3.14) — receive at an actual price above standard, then verify the variance posts to its own account.
- **Cluster: Landed cost** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · freight-allocation** (Python 3.14) — allocate freight across receipt lines by value, then verify the allocation sums exactly to the freight.
- **Cluster: Valuation report** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · valuation-reconciles-to-gl** (PostgreSQL 18) — compute valuation by item in SQL, then verify its total equals the GL inventory control account.

### Advanced (25 examples)

- **Cluster: Backdated receipts** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · backdated-receipt-two-methods** (Python 3.14) — insert a backdated receipt and restate under FIFO and average, then verify the restated issues and the margin change.
- **Cluster: Negative stock** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · issue-before-receipt** (Python 3.14) — issue before the receipt is entered and true up on receipt, then verify the correction is posted and visible.
- **Cluster: Method change and NRV** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · method-switch-revaluation** (Python 3.14) — switch an item from average to FIFO with revaluation, then verify the revaluation entry equals the value difference.

## Capstone spec

Build a costing engine that replays one movement history under FIFO, moving average, and standard cost, posts COGS and variances, handles backdating, and reconciles valuation to the GL. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: explain a margin difference between two methods; decide on a method change; locate a valuation drift.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: issue across layers; allocate landed cost exactly; restate after a backdated receipt.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- The claim that IAS 2 prohibits LIFO is verified against the IFRS text or removed.
- Unit costs keep enough precision; rounding is explicit.

## Lineage

- The archived syllabus file [erp-inventory-costing-methods](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/erp-inventory-costing-methods.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 15 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 15 of 30.
