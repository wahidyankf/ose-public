# Production Planning and MRP (By Example)

**Course ID**: `production-planning-and-mrp` · **Format**: By Example.

**Scope note**: Translates demand, supply, lead times, and structure into dated planned orders with netting, lot sizing, safety stock, pegging, and action messages. It excludes demand forecasting (demand-and-supply-planning) and capacity optimization.

**Short summary**: MRP turns demand, supply, lead times, and structure into dated proposals.

## Why this exists · the big idea

- **The problem before the solution**: Buyers and planners order from gut feel, so shortages and excess stock appear together.
- **Keep-this-if-you-forget-everything**: Net requirements by time bucket, offset by lead time, and keep the pegging so every order can explain itself.

## Learning objectives

After this course you can:

1. net gross requirements against on-hand and scheduled receipts by time bucket.
2. offset planned order releases by lead time and apply lot sizing rules.
3. run a multi-level explosion in low-level-code order.
4. apply safety stock and scrap factors.
5. peg supply to demand and produce action messages, then compare net-change with regenerative runs.

## Prerequisites

- **Prior courses**: `inventory-and-warehouse-management`, `erp-bom-and-routing-architecture`, `just-enough-python`.
- **Assumed knowledge**: Stock and bills of materials from the previous courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Orlicky, Material Requirements Planning (McGraw-Hill, 1975).
- Vollmann, Berry, Whybark, and Jacobs, Manufacturing Planning and Control for Supply Chain Management (McGraw-Hill).

## Concepts

- **co-01 · gross-requirements** — total demand in a time bucket.
- **co-02 · on-hand-and-scheduled-receipts** — supply already available or on order.
- **co-03 · net-requirements** — demand not covered by supply.
- **co-04 · planned-order-release** — the dated order that covers a net requirement.
- **co-05 · lead-time-offset** — moving a release earlier by the lead time.
- **co-06 · lot-sizing** — lot-for-lot, fixed quantity, and period-based rules.
- **co-07 · safety-stock** — a buffer held against variation.
- **co-08 · low-level-code** — the deepest level at which an item appears.
- **co-09 · pegging** — linking supply to the demand it serves.
- **co-10 · time-bucket** — the period grain of the plan.
- **co-11 · action-message** — expedite, de-expedite, or cancel advice.
- **co-12 · regenerative-vs-net-change** — replanning everything versus only what changed.
- **co-13 · firm-planned-order** — a planned order the planner has frozen.
- **co-14 · mrp-exception** — a condition the planner must resolve.
- **co-15 · scrap-factor** — extra quantity planned to cover expected loss.
- **co-16 · time-fence** — the horizon inside which the plan is frozen or restricted.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Netting, offsetting, lot sizing, and pegging are numeric procedures best learned by running many small, hand-checkable cases that grow to a full multi-level run. By Example fits.

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

Anchor runtimes: Python 3.14, standard library only (no lockfile) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: One-item netting** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · single-item-net** (Python 3.14) — net weekly demand against on-hand and receipts, then verify the net requirement is hand-checkable.
- **Cluster: Lead-time offset** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · offset-release-date** (Python 3.14) — offset planned releases by lead time, then verify each release precedes its need date by the lead time.
- **Cluster: Lot sizing** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · lot-for-lot-vs-fixed** (Python 3.14) — plan the same demand under two lot rules, then verify the order counts and leftover stock differ as expected.

### Intermediate (28 examples)

- **Cluster: Multi-level explosion** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · mrp-two-level-run** (Python 3.14) — run MRP over a two-level bill, then verify a component's gross requirement equals parent releases times quantity per.
- **Cluster: Safety stock** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · safety-stock-netting** (Python 3.14) — include safety stock in netting, then verify planned stock never falls below it.
- **Cluster: Low-level coding** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · low-level-code-order** (Python 3.14) — assign low-level codes and plan in code order, then verify a shared component is planned once, after all parents.

### Advanced (25 examples)

- **Cluster: Pegging** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · peg-demand-to-supply** (Python 3.14) — peg each planned order to the demands it covers, then verify every demand has a covering supply or a shortage.
- **Cluster: Action messages** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · reschedule-actions** (Python 3.14) — move a demand date and generate action messages, then verify expedite, de-expedite, and cancel advice is correct.
- **Cluster: Net change and time fence** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · net-change-vs-regenerative** (Python 3.14) — replan with net change and with regenerative, then verify both give the same plan outside the time fence.

## Capstone spec

Build an MRP engine over a bill of materials, stock, and demand that prints planned orders, pegging, and exceptions, with a golden-output regression test. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: find the first constrained component; choose a lot rule; read an action message list.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: net one item by week; apply lot-for-lot versus fixed lot; peg a planned order.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Item and product names are invented; planned outputs are pinned by a golden file.

## Lineage

- The archived syllabus file [production-planning-and-mrp](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/production-planning-and-mrp.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 18 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 18 of 30.
