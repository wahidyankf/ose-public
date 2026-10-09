# Procure to Pay Systems (By Example)

**Course ID**: `procure-to-pay-systems` · **Format**: By Example.

**Scope note**: Models requisition, order, receipt, invoice, and payment evidence. It excludes mismatch handling in depth (erp-procurement-and-fulfillment-exceptions) and purchasing strategy.

**Short summary**: Pay only against traceable request, commitment, receipt, and invoice facts.

## Why this exists · the big idea

- **The problem before the solution**: Ordering and paying lose control when their evidence is disconnected, so duplicates and unapproved spend get paid.
- **Keep-this-if-you-forget-everything**: Pay only against traceable request, commitment, receipt, and invoice facts.

## Learning objectives

After this course you can:

1. route requisitions and orders through approval limits before any commitment exists.
2. link orders, receipts, and invoices and run two- and three-way matching with tolerances.
3. post goods-received-not-invoiced accruals and payables to the ledger.
4. select invoices for a payment run by terms and discounts.
5. detect duplicate invoices and hold changes to vendor bank details.

## Prerequisites

- **Prior courses**: `erp-subledger-to-gl-architecture`, `just-enough-python`.
- **Assumed knowledge**: Vendor and invoice basics.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `accounts-payable-and-procure-to-pay`.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about procure-to-pay controls; tolerances and limits are policy inputs shown with invented values.
- Python decimal documentation for exact amounts.

## Concepts

- **co-01 · purchase-requisition** — an accountable internal request.
- **co-02 · purchase-order** — an approved external commitment.
- **co-03 · goods-receipt** — evidence of accepted delivery.
- **co-04 · invoice-match** — comparison of commitment, receipt, and claim.
- **co-05 · payable** — an obligation recorded from valid evidence.
- **co-06 · payment-run** — a controlled settlement proposal.
- **co-07 · tolerance** — a permitted bounded mismatch.
- **co-08 · exception-workflow** — accountable handling of a mismatch.
- **co-09 · approval-policy** — thresholds, delegation, and routing.
- **co-10 · commitment-accounting** — recording a commitment before an invoice exists.
- **co-11 · grni-accrual** — goods received but not yet invoiced, accrued at receipt.
- **co-12 · vendor-master-control** — change control for bank details and terms.
- **co-13 · duplicate-detection** — finding the same claim twice.
- **co-14 · payment-terms-and-discounts** — due dates and early-payment discounts.
- **co-15 · match-variations** — service orders, blanket orders, and two-way versus three-way.
- **co-16 · payment-evidence** — the data a payment run leaves for bank reconciliation.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: The cycle is a chain of small, verifiable steps and checks (approve, order, receive, match, pay), which By Example teaches as many short runnable cases that build into a full engine.

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

- **Cluster: Requisition and approval** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · approval-limit-routing** (Python 3.14) — route an order above an approver's limit to the next approver, then verify no commitment exists before approval.
- **Cluster: Order and receipt** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · po-receipt-link** (Python 3.14) — link a goods receipt to its order line, then verify the open quantity falls by the received quantity.
- **Cluster: Invoice and payable** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · three-way-match** (Python 3.14) — compare order, receipt, and invoice, then verify an unmatched quantity holds the invoice.

### Intermediate (28 examples)

- **Cluster: Tolerances** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · price-qty-tolerance** (Python 3.14) — apply price and quantity tolerances, then verify a mismatch inside tolerance passes and outside holds.
- **Cluster: GRNI and accruals** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · grni-accrual-entry** (Python 3.14) — post an accrual at receipt and clear it at invoice, then verify the accrual balance is zero afterwards.
- **Cluster: Payment terms** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · early-pay-discount** (Python 3.14) — compute due dates and early-pay discounts, then verify the discount applies only inside the window.

### Advanced (25 examples)

- **Cluster: Duplicate and fraud signals** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · duplicate-invoice** (Python 3.14) — reject a repeated supplier claim, then verify a single payable remains.
- **Cluster: Payment runs** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · payment-run-selection** (Python 3.14) — select invoices for a run by due date and cash limit, then verify held invoices are excluded.
- **Cluster: Vendor master control** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · bank-detail-change-hold** (Python 3.14) — hold payments after a bank-detail change until a second approver confirms, then verify the hold lifts only after approval.

## Capstone spec

Build a procure-to-pay engine from requisition to payment run with approvals, matching, accruals, duplicate detection, and posting to a general ledger. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide hold or pay on a mismatch; set tolerances; review a vendor bank-detail change.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: route by approval limit; run a three-way match; select invoices for a payment run.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Vendor names, bank details, and amounts are invented and obviously synthetic.

## Lineage

- The archived syllabus file [procure-to-pay-systems](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/procure-to-pay-systems.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 3 of 5 (Business process cycles) · position 10 of 27.
- `skills/sharia-erp` — Phase 3 of 6 (Business process cycles) · position 10 of 30.
