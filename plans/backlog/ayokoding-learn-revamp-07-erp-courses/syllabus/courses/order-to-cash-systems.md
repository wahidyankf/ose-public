# Order to Cash Systems (By Example)

**Course ID**: `order-to-cash-systems` · **Format**: By Example.

**Scope note**: Models customer order, allocation, shipment, invoice, and collection evidence. It excludes revenue-recognition policy (the accounting courses) and mismatch handling in depth (erp-procurement-and-fulfillment-exceptions).

**Short summary**: Receivables need a traceable line from order to fulfilment to cash.

## Why this exists · the big idea

- **The problem before the solution**: Sales and collections drift apart when fulfilment has no shared trace, so invoices are disputed and cash is misapplied.
- **Keep-this-if-you-forget-everything**: Receivables require traceable order-to-fulfilment evidence.

## Learning objectives

After this course you can:

1. create orders, allocate stock, and record shipment evidence.
2. invoice from shipments and keep the link to source evidence.
3. apply pricing conditions with explicit precedence.
4. hold orders on credit exposure and release them with approval.
5. apply cash to invoices, including short and over payments, and issue returns and credit notes.

## Prerequisites

- **Prior courses**: `erp-subledger-to-gl-architecture`, `just-enough-python`.
- **Assumed knowledge**: Customer and invoice basics.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `accounts-receivable-and-order-to-cash`.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about order-to-cash controls; prices, limits, and customers are invented values.
- Python decimal documentation for exact amounts.

## Concepts

- **co-01 · sales-order** — an approved customer commitment.
- **co-02 · allocation** — reserved quantity set aside for fulfilment.
- **co-03 · shipment-evidence** — proof of operational fulfilment.
- **co-04 · customer-invoice** — an accountable claim linked to fulfilment.
- **co-05 · receivable** — a customer balance from a valid claim.
- **co-06 · collection** — an attributable settlement event.
- **co-07 · credit-hold** — a policy-based stop on progression.
- **co-08 · return-flow** — controlled reverse fulfilment evidence.
- **co-09 · pricing-conditions** — price lists, discounts, and surcharges with precedence.
- **co-10 · tax-determination-input** — the facts a tax engine needs from the order.
- **co-11 · billing-plan** — milestone or recurring billing schedules.
- **co-12 · cash-application** — matching payments to open invoices.
- **co-13 · dunning** — reminders driven by overdue policy.
- **co-14 · credit-exposure** — open orders plus open receivables against a limit.
- **co-15 · partial-delivery-and-billing** — shipping and invoicing in parts.
- **co-16 · customer-statement** — a dated summary of a customer's account.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: The cycle is a chain of small, verifiable steps (order, allocate, ship, invoice, collect), which By Example teaches as many short runnable cases that build into a full engine.

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

- **Cluster: Orders and allocation** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · order-allocate-ship** (Python 3.14) — create an order, allocate stock, and ship, then verify allocated and shipped quantities agree.
- **Cluster: Invoice from shipment** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · invoice-after-shipment** (Python 3.14) — create a claim only after shipment evidence exists, then verify the source link.
- **Cluster: Receivable and collection** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · apply-payment** (Python 3.14) — apply a payment to an invoice, then verify the receivable falls by the applied amount.

### Intermediate (28 examples)

- **Cluster: Credit control** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · credit-hold** (Python 3.14) — stop release over a credit limit, then verify the held order stays auditable.
- **Cluster: Pricing** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · price-condition-precedence** (Python 3.14) — resolve a price from list, customer, and promotion conditions, then verify the trace names the winning condition.
- **Cluster: Billing plans** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · milestone-billing** (Python 3.14) — bill an order in milestones, then verify billed plus remaining equals the order value.

### Advanced (25 examples)

- **Cluster: Returns and credit notes** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · partial-return** (Python 3.14) — reverse only the returned quantity, then verify the remaining receivable is explained.
- **Cluster: Cash application edge cases** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · short-pay-and-overpay** (Python 3.14) — apply a short payment and an overpayment, then verify the difference becomes an open item rather than a guess.
- **Cluster: Dunning and statements** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · dunning-levels** (Python 3.14) — move overdue invoices through dunning levels by policy, then verify a customer statement matches the open items.

## Capstone spec

Build an order-to-cash engine with allocation, pricing conditions, billing plans, credit holds, cash application, returns, and posting to a general ledger. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide whether to release a held order; trace a disputed invoice; choose a billing plan.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: resolve a price by precedence; apply a short payment; reverse a partial return.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Customer names and amounts are invented and obviously synthetic.

## Lineage

- The archived syllabus file [order-to-cash-systems](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/order-to-cash-systems.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 3 of 5 (Business process cycles) · position 11 of 27.
- `skills/sharia-erp` — Phase 3 of 6 (Business process cycles) · position 11 of 30.
