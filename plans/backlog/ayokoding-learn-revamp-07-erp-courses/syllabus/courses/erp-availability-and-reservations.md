# ERP Availability and Reservations (By Example)

**Course ID**: `erp-availability-and-reservations` · **Format**: By Example.

**Scope note**: Builds availability-to-promise from on-hand, reserved, allocated, inbound, and safety stock, with reservation lifecycles, allocation priority, and concurrent allocation. It excludes planning (production-planning-and-mrp) and costing.

**Short summary**: Availability is a promise policy built from on-hand, inbound, allocated, and safety-stock states.

## Why this exists · the big idea

- **The problem before the solution**: Two orders promise the same stock because availability is read from one number that means different things to different modules.
- **Keep-this-if-you-forget-everything**: Say exactly which stock states a promise counts, and make allocation safe under concurrency.

## Learning objectives

After this course you can:

1. compute available-to-promise from stock states and inbound supply.
2. reserve and release stock, with expiry on a virtual clock.
3. allocate scarce stock by priority.
4. distinguish soft and hard reservations.
5. allocate concurrently with SKIP LOCKED and explain every promise afterwards.

## Prerequisites

- **Prior courses**: `inventory-and-warehouse-management`, `production-planning-and-mrp`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Stock ledger and MRP outputs from the previous courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 8 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on SELECT ... FOR UPDATE SKIP LOCKED.
- Stable domain facts about availability to promise; the exact term set varies by vendor and this course defines its own.

## Concepts

- **co-01 · on-hand** — physical stock in available status.
- **co-02 · reserved** — stock set aside for a specific demand.
- **co-03 · allocated** — stock committed to a pick or shipment.
- **co-04 · available-to-promise** — quantity that can be promised to a new order.
- **co-05 · capable-to-promise** — promising against capacity as well as stock.
- **co-06 · safety-stock-buffer** — stock held back from promising.
- **co-07 · inbound-supply** — dated supply that may be promised.
- **co-08 · reservation-expiry** — automatic release after a deadline.
- **co-09 · allocation-priority** — the rule that orders competing demands.
- **co-10 · backorder-promising** — promising later supply to a short order.
- **co-11 · soft-vs-hard-reservation** — an advisory hold versus an enforced hold.
- **co-12 · multi-location-sourcing** — choosing which location fills an order.
- **co-13 · cumulative-atp** — availability carried forward across periods.
- **co-14 · reservation-race** — two reservations competing for the last units.
- **co-15 · release-on-cancel** — returning reserved stock when demand is cancelled.
- **co-16 · promise-audit** — an explanation of why a promise was made.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each availability rule and reservation behaviour is a small numeric or state scenario with a checkable result, which By Example teaches as many short cases that end in concurrent allocation.

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

- **Cluster: Availability arithmetic** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · atp-from-states** (Python 3.14) — compute ATP from on-hand, reserved, allocated, and safety stock, then verify each state's contribution is shown.
- **Cluster: Reserving stock** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · reserve-and-release** (Python 3.14) — reserve and release stock for an order, then verify availability returns after release.
- **Cluster: Allocation priority** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · priority-allocation** (Python 3.14) — allocate scarce stock across three orders by priority, then verify lower priorities are short first.

### Intermediate (28 examples)

- **Cluster: Inbound and cumulative ATP** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · cumulative-atp** (Python 3.14) — carry availability across periods with inbound supply, then verify later promises use later supply only.
- **Cluster: Expiry** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · reservation-expiry-virtual-clock** (Python 3.14) — expire a reservation on a virtual clock, then verify the stock is available at the deadline and not before.
- **Cluster: Soft and hard reservations** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · soft-hard-reservation** (Python 3.14) — override a soft reservation but not a hard one, then verify the overridden demand is notified.

### Advanced (25 examples)

- **Cluster: Concurrent reservations** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · skip-locked-allocation** (PostgreSQL 18) — run two scripted sessions that allocate with SKIP LOCKED, then verify no unit is allocated twice.
- **Cluster: Multi-location sourcing** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · split-sourcing** (Python 3.14) — fill an order from two locations by distance rank, then verify the split sums to the order quantity.
- **Cluster: Promise audit** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · promise-explanation** (Python 3.14) — record the inputs behind each promise, then verify the explanation reproduces the promised date.

## Capstone spec

Build an availability service with a reservation lifecycle, ATP, allocation priority, multi-location sourcing, a concurrent allocation test, and promise explanations. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide reserve, allocate, or forecast for a transfer order; explain a broken promise; set a safety-stock buffer.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: compute ATP from states; allocate by priority; expire a reservation on a virtual clock.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Time uses a virtual clock only.
- The concurrent allocation script never sleeps.

## Lineage

- The archived syllabus file [erp-availability-and-reservations](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/erp-availability-and-reservations.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 20 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 20 of 30.
