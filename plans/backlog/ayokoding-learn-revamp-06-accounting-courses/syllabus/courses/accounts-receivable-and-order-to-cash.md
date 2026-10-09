# Accounts Receivable and Order to Cash (By Example)

**Course ID**: `accounts-receivable-and-order-to-cash` · **Format**: By Example.

**Scope note**: Builds the order-to-cash cycle in Python: customers, credit checks, orders,
deliveries, invoices, cash application, collections, credit losses, and write-offs. It excludes the
revenue timing rules themselves (`accrual-accounting-and-revenue-recognition`), bank statement formats
(`treasury-and-cash-management`), and indirect tax in depth (`payroll-and-tax-accounting-essentials`).

**Short summary**: Selling on credit creates a promise to collect. You build the system that decides
who may buy on credit, bills them, matches their payments to invoices, chases what is late, and
estimates what will never be paid.

## Why this exists · the big idea

- **The problem before the solution**: a receivables feature that cannot match a payment to an
  invoice leaves cash "unapplied", sends dunning letters to customers who paid, and overstates assets
  with debts that will never be collected.
- **Keep-this-if-you-forget-everything**: every receivable needs an invoice behind it, a payment
  matched against it, or an explained reason it is still open.

## Learning objectives

- Model the order-to-cash documents and post each step.
- Enforce credit limits and credit holds.
- Apply incoming cash to invoices, including partial, short, over, and unidentified payments.
- Produce ageing, statements, and dunning runs.
- Estimate expected credit losses with a provision matrix and post write-offs and recoveries.
- Reconcile the receivables subledger to the control account and spot collection fraud signals.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics`, `accrual-accounting-and-revenue-recognition`
  (when revenue and the receivable are recognized), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: By Example. **Reason**: each order-to-cash rule (credit check, matching, ageing, provision)
  is a runnable rule with clear good and bad cases.
- **Examples**: floor 75 (Beginner 1–25, Intermediate 26–50, Advanced 51–75). **Words**: at least
  28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Trace what customers owe from
  order through billing to collection."); `estimatedHours` from the drift test.

## Accuracy notes

- IFRS 9 "Financial Instruments" (complete version July 2014, effective 1 January 2018) holds the
  expected-credit-loss model, including the simplified approach for trade receivables:
  `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-9-financial-instruments/`, accessed
  2026-10-09. The maker cites the paragraph for the simplified approach at authoring time.
- Cash application, ageing, dunning, and lapping: stable domain facts.

## Concepts

- **co-01 · o2c-flow** — order, credit check, delivery, invoice, cash application, and collection.
- **co-02 · customer-master** — customer records, terms, and credit limits.
- **co-03 · credit-exposure** — open receivables plus open orders against the credit limit.
- **co-04 · order-and-delivery** — the commitment and the fulfilment that triggers billing.
- **co-05 · customer-invoice** — receivable, revenue, and output tax lines.
- **co-06 · cash-application** — matching remittances to open invoices.
- **co-07 · payment-exceptions** — partial, short, over, and unidentified payments.
- **co-08 · credit-notes** — credits for returns, price corrections, and disputes.
- **co-09 · ageing-and-dso** — open items by age, and days sales outstanding.
- **co-10 · expected-credit-loss** — a loss allowance from a provision matrix.
- **co-11 · write-off-and-recovery** — removing an uncollectible debt and recording later recovery.
- **co-12 · collections** — statements and dunning levels.
- **co-13 · subledger-tie-out** — the receivables subledger equals the control account.
- **co-14 · disputes** — tracking disputed amounts apart from simple lateness.
- **co-15 · o2c-controls** — credit holds, segregation of cash handling, and lapping detection.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · o2c-diagram** — draw the cycle (Mermaid) — verify document keys link each step. (co-01)
- **ex-02 · customer-record** — validate a customer record — verify missing terms are refused. (co-02)
- **ex-03 · sales-order** — create an order — verify the totals. (co-04)
- **ex-04 · credit-exposure** — compute exposure — verify open orders count. (co-03)
- **ex-05 · credit-hold** — hold an order over the limit — verify the hold. (co-03, co-15)
- **ex-06 · release-hold** — release with an approval record — verify. (co-03)
- **ex-07 · delivery** — record a delivery — verify the order state. (co-04)
- **ex-08 · invoice-from-delivery** — bill what was delivered — verify invoice lines. (co-05)
- **ex-09 · invoice-posting** — post receivable, revenue, and output tax — verify. (co-05)
- **ex-10 · due-date** — compute due dates from terms — verify edge cases. (co-02)
- **ex-11 · full-payment** — apply a full payment — verify the invoice closes. (co-06)
- **ex-12 · payment-posting** — post debit bank, credit receivables — verify. (co-06)
- **ex-13 · partial-payment** — apply a partial payment — verify the open balance. (co-07)
- **ex-14 · overpayment** — record an overpayment as a customer credit — verify. (co-07)
- **ex-15 · unidentified-payment** — park cash with no reference as unapplied — verify. (co-07)
- **ex-16 · credit-note** — issue a credit note for a return — verify. (co-08)
- **ex-17 · open-items** — list open items per customer — verify. (co-13)
- **ex-18 · ageing-buckets** — age open items — verify bucket edges. (co-09)
- **ex-19 · customer-statement** — produce a statement — verify the closing balance. (co-12)
- **ex-20 · tie-out** — tie the subledger to the control account — verify. (co-13)
- **ex-21 · dso** — compute DSO — verify. (co-09)
- **ex-22 · invoice-numbering** — number invoices without reuse — verify. (co-05)
- **ex-23 · tax-on-invoice** — compute output tax at an illustrative rate with line rounding — verify.
  (co-05)
- **ex-24 · discount-for-early-payment** — grant an early-payment discount — verify the entry. (co-06)
- **ex-25 · beginner-cycle** — run one sale end to end — verify every posting. (co-01–co-13)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · remittance-matching** — match payments by invoice reference — verify. (co-06)
- **ex-27 · amount-matching** — match unreferenced payments by exact amount — verify. (co-06)
- **ex-28 · many-invoices-one-payment** — apply one payment to several invoices — verify the order of
  application. (co-06)
- **ex-29 · short-payment-reason** — record a short payment with a deduction reason — verify. (co-07,
  co-14)
- **ex-30 · dispute-tracking** — flag disputed invoices — verify they skip dunning. (co-14)
- **ex-31 · dunning-levels** — run dunning levels 1–3 — verify letters per customer. (co-12)
- **ex-32 · dunning-exclusions** — exclude disputed and on-hold customers — verify. (co-12)
- **ex-33 · provision-matrix** — compute loss rates per ageing bucket from history — verify. (co-10)
- **ex-34 · ecl-allowance** — apply the matrix to current ageing — verify the allowance. (co-10)
- **ex-35 · allowance-entry** — post the allowance change — verify. (co-10)
- **ex-36 · write-off** — write off a debt against the allowance — verify. (co-11)
- **ex-37 · recovery** — record a recovery after write-off — verify. (co-11)
- **ex-38 · refund-to-customer** — refund a credit balance — verify. (co-07)
- **ex-39 · customer-prepayment** — receive a deposit before invoicing — verify the contract
  liability. (co-07)
- **ex-40 · foreign-currency-receipt** — receive payment in another currency — verify the realized
  difference is posted to its own account. (co-06)
- **ex-41 · cash-application-queue** — queue unapplied cash by age — verify. (co-06)
- **ex-42 · credit-limit-review** — propose limit changes from payment history — verify. (co-02,
  co-03)
- **ex-43 · invoice-corrections** — correct an invoice with a credit note and reissue — verify the
  trail. (co-08)
- **ex-44 · bad-debt-signals** — flag customers trending later — verify. (co-09)
- **ex-45 · cut-off** — bill deliveries at period end — verify the period. (co-04, co-05)
- **ex-46 · statement-reconciliation** — reconcile with a customer's own ledger — verify the
  differences. (co-13)
- **ex-47 · lockbox-file** — import a bank remittance file — verify the matches. (co-06)
- **ex-48 · ar-close-tasks** — run the receivables close tasks — verify. (co-13)
- **ex-49 · segregation** — prevent the person applying cash from issuing credit notes — verify.
  (co-15)
- **ex-50 · intermediate-cycle** — run a month of sales — verify ageing and tie-out. (co-01–co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · lapping-detection** — detect payments applied to the wrong customer in a rolling pattern —
  verify the alert. (co-15)
- **ex-52 · credit-note-abuse** — flag unusual credit notes after period end — verify. (co-15)
- **ex-53 · matching-engine** — a scored matching engine (reference, amount, customer) — verify
  matches and leftovers. (co-06)
- **ex-54 · fuzzy-reference** — normalize remittance references — verify more matches. (co-06)
- **ex-55 · auto-match-threshold** — auto-apply only above a score — verify the review queue. (co-06)
- **ex-56 · idempotent-cash-import** — import the same bank file twice — verify no double
  application. (co-06)
- **ex-57 · payment-reversal** — reverse a bounced payment — verify the invoice reopens. (co-07)
- **ex-58 · ecl-forward-looking** — adjust loss rates for a stated outlook — verify the change. (co-10)
- **ex-59 · ecl-sensitivity** — show allowance sensitivity to rates — verify the table. (co-10)
- **ex-60 · subscription-billing-run** — bill 500 subscriptions from seeded data — verify totals.
  (co-05)
- **ex-61 · billing-idempotency** — rerun a billing run — verify no duplicate invoices. (co-05)
- **ex-62 · invoice-api-validation** — validate invoice API payloads — verify errors. (co-05)
- **ex-63 · e-invoice-structure** — validate a structured e-invoice JSON — verify. (co-05)
- **ex-64 · collections-prioritization** — rank accounts by amount and age — verify the order.
  (co-12)
- **ex-65 · promise-to-pay** — track promises and broken promises — verify. (co-12)
- **ex-66 · intercompany-receivables** — tag intercompany receivables — verify the partner dimension.
  (co-13)
- **ex-67 · o2c-events** — drive postings from O2C events — verify. (co-01)
- **ex-68 · revenue-and-receivable-split** — keep contract liabilities, contract assets, and
  receivables apart — verify. (co-05)
- **ex-69 · audit-confirmation-sample** — select customers for confirmation with a fixed seed —
  verify. (co-15)
- **ex-70 · ar-metrics** — compute DSO, CEI, and overdue percentage — verify. (co-09)
- **ex-71 · evidence-links** — check every invoice links to a delivery — verify exceptions. (co-04)
- **ex-72 · o2c-property** — random sales flows over fixed seeds keep the tie-out — verify. (co-13)
- **ex-73 · receivable-financing-preview** — show why factored receivables need a derecognition
  decision — verify the two outcomes. (co-11)
- **ex-74 · o2c-review-checklist** — review an O2C design — verify each rule. (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone module — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-unapplied-cash-ignored`, `kata-02-credit-limit-excludes-orders`,
  `kata-03-partial-payment-closes-invoice`, `kata-04-allowance-double-counted`,
  `kata-05-write-off-wrong-account`, `kata-06-cash-import-duplicates`, `kata-07-dunning-disputed`,
  `kata-08-tax-rounding-per-invoice`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**An order-to-cash module.** Customers with limits and holds, orders, deliveries, invoices, a scored
cash-application engine with an unapplied queue, dunning, a provision-matrix allowance, write-offs,
and a tie-out report, posting through the earlier engine. The `run.yaml` runs a scripted quarter and
compares the reports.

## Code and harness

- Python standard library only; seeded data generators; no wall clock.

## Lineage

- Replaces the 245-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 2 (Transaction cycles), position 7.
- `skills/sharia-accounting` — Phase 2 (Transaction cycles), position 7 · the receivable model later
  reused for deferred-payment Islamic sales.
