# Quality Management and Inspection (By Example)

**Course ID**: `quality-management-and-inspection` · **Format**: By Example.

**Scope note**: Models inspection plans, lots, sampling, usage decisions, holds, nonconformance, disposition, corrective action, and lot genealogy. It excludes regulatory certification and industry-specific quality standards.

**Short summary**: Quality events must control disposition without erasing the material's trace.

## Why this exists · the big idea

- **The problem before the solution**: A failed lot gets mixed into good stock because the quality decision and the stock record live in different places.
- **Keep-this-if-you-forget-everything**: A quality decision changes stock status and keeps the trace.

## Learning objectives

After this course you can:

1. create inspection plans and lots from receipts and production.
2. apply sampling rules and record usage decisions.
3. block failed stock with quality holds that other modules respect.
4. record nonconformances with disposition and corrective actions.
5. trace a failed lot to affected orders and customers in both directions.

## Prerequisites

- **Prior courses**: `erp-procurement-and-fulfillment-exceptions`, `erp-bom-and-routing-architecture`, `inventory-and-warehouse-management`, `just-enough-python`.
- **Assumed knowledge**: Exceptions, structures, and stock from the previous courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about inspection and nonconformance handling; sampling tables in examples are invented teaching tables, not a published standard.
- If a published sampling standard is cited, verify its current edition and quote only what its licence allows.

## Concepts

- **co-01 · inspection-plan** — what to check, how, and against which limits.
- **co-02 · inspection-lot** — a batch under inspection.
- **co-03 · sampling-plan** — how many units to inspect from a lot.
- **co-04 · inspection-characteristic** — one measured property with limits.
- **co-05 · usage-decision** — accept, reject, or accept with condition.
- **co-06 · quality-hold-status** — a stock status that blocks use.
- **co-07 · nonconformance** — a recorded deviation from requirement.
- **co-08 · disposition** — use as is, rework, scrap, or return.
- **co-09 · corrective-action** — work to remove the cause of a nonconformance.
- **co-10 · supplier-quality-score** — a metric over supplier lots and defects.
- **co-11 · lot-genealogy** — forward and backward links between lots.
- **co-12 · certificate-of-analysis** — supplier evidence attached to a lot.
- **co-13 · calibration-status** — whether a measuring tool is in date.
- **co-14 · recall-scope** — the set of lots and orders affected by a defect.
- **co-15 · in-process-inspection** — checks during production.
- **co-16 · cost-of-quality** — failure and prevention cost tracked by cause.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Quality flows are chains of small state-and-decision cases with checkable stock effects, which By Example teaches as many short runs that end in a recall trace.

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

- **Cluster: Inspection plans** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · plan-by-material** (Python 3.14) — select an inspection plan by material, then verify an unplanned material is reported.
- **Cluster: Inspection lots** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · lot-created-on-receipt** (Python 3.14) — create an inspection lot when a receipt arrives, then verify stock stays on hold until a decision.
- **Cluster: Usage decisions** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · accept-reject-decision** (Python 3.14) — record accept and reject decisions against limits, then verify a reject moves stock to blocked.

### Intermediate (28 examples)

- **Cluster: Sampling** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · sample-size-table** (Python 3.14) — look up sample sizes from a table by lot size, then verify larger lots never get smaller samples.
- **Cluster: Holds and stock** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · hold-blocks-issue** (Python 3.14) — try to issue held stock, then verify the issue is refused with the hold reason.
- **Cluster: Nonconformance and disposition** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · ncr-disposition** (Python 3.14) — record a nonconformance and a scrap disposition, then verify the scrap posts a stock adjustment.

### Advanced (25 examples)

- **Cluster: Genealogy and recall** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · trace-failed-lot** (Python 3.14) — trace a failed component lot to finished lots and customers, then verify forward and backward traces agree.
- **Cluster: Supplier scoring** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · supplier-score** (Python 3.14) — score suppliers from lot results, then verify the score changes with a new rejected lot.
- **Cluster: Corrective action** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · capa-linked-to-ncr** (Python 3.14) — link a corrective action to its nonconformance, then verify the nonconformance cannot close while the action is open.

## Capstone spec

Build a quality module with plans, lots, sampling, usage decisions, holds, disposition, corrective actions, and a genealogy trace to affected orders. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: trace a failed incoming lot to affected orders; choose a disposition; decide whether a recall scope is complete.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: look up a sample size; block held stock; trace a lot both ways.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Sampling tables are invented teaching tables; any named standard is verified for edition and licence.

## Lineage

- The archived syllabus file [quality-management-and-inspection](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/quality-management-and-inspection.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 21 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 21 of 30.
