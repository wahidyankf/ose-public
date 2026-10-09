# Inventory and Warehouse Management (By Example)

**Course ID**: `inventory-and-warehouse-management` · **Format**: By Example.

**Scope note**: Models stock identity, location, quantity, status, ownership, movements, and counts. It excludes costing methods (erp-inventory-costing-methods), concurrency (erp-inventory-integrity-and-concurrency), and planning (production-planning-and-mrp).

**Short summary**: Warehouse execution must preserve the identity, location, quantity, and ownership of stock.

## Why this exists · the big idea

- **The problem before the solution**: A stock number that only shows the latest balance cannot explain where stock went, so counts never reconcile.
- **Keep-this-if-you-forget-everything**: Stock is the sum of its movements; keep the movements.

## Learning objectives

After this course you can:

1. derive balances from an immutable movement ledger.
2. model sites, warehouses, and bins and move stock between them, including in transit.
3. track lots and serials and trace them forward and backward.
4. pick by expiry and handle quality holds and consigned stock.
5. reconcile the stock ledger to physical counts and to the GL control account.

## Prerequisites

- **Prior courses**: `erp-subledger-to-gl-architecture`, `inventory-and-cogs-accounting`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Inventory and cost of goods sold from the accounting course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 8 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `inventory-and-cogs-accounting`, `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on aggregate functions and window functions for the balance example.
- Stable domain facts about warehouse movements; item and location names are invented.

## Concepts

- **co-01 · stock-ledger** — an immutable history of stock movements.
- **co-02 · on-hand-balance** — a balance derived from movements.
- **co-03 · location-hierarchy** — site, warehouse, and bin.
- **co-04 · lot-and-serial** — the identity of a batch or a single unit.
- **co-05 · stock-status** — available, quality hold, or blocked.
- **co-06 · goods-movement-types** — receipt, issue, transfer, and adjustment.
- **co-07 · putaway-and-picking** — choosing where to store and what to pick.
- **co-08 · cycle-count** — counting a subset and posting the variance.
- **co-09 · stock-uom** — the unit in which stock is held and moved.
- **co-10 · ownership** — own, consigned, or customer-owned stock.
- **co-11 · in-transit-stock** — stock that has left one location and not arrived at another.
- **co-12 · negative-stock-policy** — whether and when stock may go below zero.
- **co-13 · reservation-vs-allocation** — a preview of the terms the availability course defines.
- **co-14 · valuation-hook** — each movement carries a value reference for costing.
- **co-15 · expiry-and-fefo** — first-expired-first-out picking.
- **co-16 · stock-reconciliation** — ledger versus physical versus GL.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Stock behaviour is a catalogue of small movement scenarios (receive, move, pick, count, hold) that each have a checkable balance. By Example fits well, with SQL doing much of the work.

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

- **Cluster: Stock as movements** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · balance-from-movements** (PostgreSQL 18) — derive on-hand from a movement table with SQL, then verify the balance equals receipts minus issues.
- **Cluster: Locations** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · bin-hierarchy** (Python 3.14) — model site, warehouse, and bin, then verify a bin resolves to its warehouse and site.
- **Cluster: Lots and serials** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · lot-traceability** (Python 3.14) — trace a lot from receipt to issue, then verify forward and backward traces agree.

### Intermediate (28 examples)

- **Cluster: Goods movements** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · transfer-in-transit** (Python 3.14) — transfer stock between warehouses through an in-transit location, then verify stock is never counted twice.
- **Cluster: Putaway and picking** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · pick-by-fefo** (Python 3.14) — pick the earliest-expiring lot first, then verify an expired lot is never picked.
- **Cluster: Cycle counts** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · count-variance-adjust** (Python 3.14) — post a count variance as an adjustment, then verify the balance and the movement history both explain it.

### Advanced (25 examples)

- **Cluster: Stock status** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · quality-hold-excluded** (Python 3.14) — place a lot on quality hold, then verify it is excluded from availability but kept in on-hand.
- **Cluster: Ownership** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · consignment-stock** (Python 3.14) — receive consigned stock without a payable, then verify ownership changes on consumption.
- **Cluster: Reconciliation** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · ledger-vs-gl-reconcile** (Python 3.14) — compare the stock ledger value with the GL control account, then verify a seeded difference is located.

## Capstone spec

Build a warehouse stock ledger with locations, lots, serials, in-transit stock, counts, holds, consignment, and reconciliation to a GL control account. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: trace a missing lot; decide how to treat in-transit stock; plan a cycle-count programme.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: derive on-hand from movements; pick by earliest expiry; post a count variance.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Stock quantities use exact decimals; no float.

## Lineage

- The archived syllabus file [inventory-and-warehouse-management](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/inventory-and-warehouse-management.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 14 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 14 of 30.
