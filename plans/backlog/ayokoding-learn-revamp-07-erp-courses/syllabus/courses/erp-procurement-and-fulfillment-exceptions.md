# ERP Procurement and Fulfillment Exceptions (By Example)

**Course ID**: `erp-procurement-and-fulfillment-exceptions` · **Format**: By Example.

**Scope note**: Handles mismatches, cancellations, returns, partial fulfilment, disputes, and write-offs on both purchasing and sales flows. It excludes supplier or customer strategy.

**Short summary**: Exceptions are first-class state transitions, not side-channel edits.

## Why this exists · the big idea

- **The problem before the solution**: Ordinary flows hide the decisions needed when evidence disagrees, so people fix problems by editing data.
- **Keep-this-if-you-forget-everything**: Exceptions are first-class state transitions, never side-channel edits.

## Learning objectives

After this course you can:

1. handle quantity and price variances with holds and approvals.
2. cancel, return, and backorder without losing evidence.
3. put a claim in dispute and block settlement until resolved.
4. correct a wrong fulfilment with a compensating event.
5. age open exceptions with a virtual clock and route escalation.

## Prerequisites

- **Prior courses**: `procure-to-pay-systems`, `order-to-cash-systems`, `just-enough-python`.
- **Assumed knowledge**: Document lifecycles and the two process courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about exception handling; thresholds and owners are invented policy values.

## Concepts

- **co-01 · quantity-variance** — the difference between commitment and execution.
- **co-02 · price-variance** — the difference between expected and claimed value.
- **co-03 · cancellation** — an accountable withdrawal before completion.
- **co-04 · return-authorization** — a governed reverse-logistics decision.
- **co-05 · partial-fulfilment** — completion of only a documented subset.
- **co-06 · dispute-state** — a controlled hold pending resolution.
- **co-07 · compensating-event** — a correction that preserves the original evidence.
- **co-08 · escalation-owner** — the accountable resolver for a blocked flow.
- **co-09 · over-delivery-handling** — accept, reject, or return surplus quantity.
- **co-10 · substitution** — delivering an approved alternative item.
- **co-11 · backorder** — an unfilled quantity kept open for later.
- **co-12 · write-off-policy** — who may close a small difference and how it is booked.
- **co-13 · supplier-chargeback** — recovering cost from a supplier for a defect or delay.
- **co-14 · exception-aging** — how long an exception has been open.
- **co-15 · sla-timers** — deadlines driven by a virtual clock, not the wall clock.
- **co-16 · exception-analytics** — counting exceptions by cause and owner.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each exception is a small scenario with a clear before and after, which By Example teaches as many short runnable cases over the two flows.

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

- **Cluster: Quantity exceptions** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · short-receipt** (Python 3.14) — accept a partial delivery, then verify the residual commitment stays open.
- **Cluster: Price exceptions** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · price-variance-hold** (Python 3.14) — hold an invoice whose price exceeds the order, then verify settlement cannot proceed.
- **Cluster: Cancellations** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · cancel-before-receipt** (Python 3.14) — cancel an order line before receipt, then verify commitment is released and the cancel is audited.

### Intermediate (28 examples)

- **Cluster: Disputes** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · disputed-price** (Python 3.14) — place a claim in a dispute state, then verify the payment run skips it.
- **Cluster: Returns** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · return-to-vendor** (Python 3.14) — return goods to a supplier, then verify stock, payable, and accrual all adjust together.
- **Cluster: Backorders and substitutions** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · backorder-release** (Python 3.14) — release a backorder when stock arrives, then verify allocation order follows priority.

### Advanced (25 examples)

- **Cluster: Compensating events** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · correction-event** (Python 3.14) — reverse an incorrect fulfilment, then verify the original evidence remains visible.
- **Cluster: Aging and SLAs** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · aging-with-virtual-clock** (Python 3.14) — age open exceptions with a virtual clock and escalate past a deadline, then verify the escalation owner is named.
- **Cluster: Write-offs** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · write-off-approval** (Python 3.14) — write off a small difference within a delegated limit, then verify larger amounts need a second approval.

## Capstone spec

Build an exception layer over the procure-to-pay and order-to-cash engines with holds, disputes, compensating events, aging, escalation, and approved write-offs. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose cancel, return, or credit for a described case; set a write-off limit; trace a disputed claim.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: hold a price variance; release a backorder in priority order; escalate an aged exception.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Time uses a virtual clock only.

## Lineage

- The archived syllabus file [erp-procurement-and-fulfillment-exceptions](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-procurement-and-fulfillment-exceptions.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 3 of 5 (Business process cycles) · position 12 of 27.
- `skills/sharia-erp` — Phase 3 of 6 (Business process cycles) · position 12 of 30.
