# Accounts Payable and Procure to Pay (By Example)

**Course ID**: `accounts-payable-and-procure-to-pay` · **Format**: By Example.

**Scope note**: Builds the procure-to-pay cycle in Python: suppliers, requisitions, purchase orders,
receipts, invoices, matching, payment runs, the GR/IR accrual, ageing, and the controls that stop
fraud and double payment. It excludes inventory valuation (`inventory-and-cogs-accounting`), bank
formats and cash forecasting in depth (`treasury-and-cash-management`), and tax computation in depth
(`payroll-and-tax-accounting-essentials`).

**Short summary**: Paying a supplier is the last step of a chain of documents. You build that chain —
order, receipt, invoice, match, approve, pay — and the checks that refuse duplicate invoices,
unreceived goods, and self-approved payments.

## Why this exists · the big idea

- **The problem before the solution**: a payables feature that pays whatever invoice arrives pays
  twice, pays for goods never received, and pays fraudsters who changed a supplier's bank account.
- **Keep-this-if-you-forget-everything**: pay only what was ordered, received, and invoiced — matched
  within tolerance, approved by someone else, and paid exactly once.

## Learning objectives

- Model the procure-to-pay documents and their states, and post each step to the ledger.
- Implement two-way and three-way matching with price and quantity tolerances.
- Accrue goods received but not invoiced and clear the GR/IR account.
- Run an idempotent payment run with approvals, early-payment discounts, and status updates.
- Detect duplicate invoices, split invoices, and risky supplier changes.
- Reconcile the payables subledger to the control account and produce an ageing report.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics` (every step posts through the engine),
  `accrual-accounting-and-revenue-recognition` (the GR/IR accrual and cut-off), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: By Example. **Reason**: procure-to-pay is a document workflow with precise rules; each
  rule is a small runnable example with good and bad inputs.
- **Examples**: floor 75 (Beginner 1–25, Intermediate 26–50, Advanced 51–75). **Words**: at least
  28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Match requests, orders,
  receipts, and invoices before money is paid."); `estimatedHours` from the drift test.

## Accuracy notes

- Procure-to-pay documents, three-way matching, GR/IR accounts, and payment terms such as "2/10 net 30":
  stable domain facts.
- Tax and withholding examples use a fictional jurisdiction with stated, illustrative rates; the
  course never presents them as any country's law.

## Concepts

- **co-01 · p2p-flow** — requisition, purchase order, receipt, invoice, and payment.
- **co-02 · supplier-master** — supplier records, bank details, and controlled changes.
- **co-03 · requisition** — an internal request with its approval.
- **co-04 · purchase-order** — the commitment to a supplier, with lines and states.
- **co-05 · goods-receipt** — what actually arrived, and its accrual.
- **co-06 · supplier-invoice** — the supplier's claim, with tax and due date.
- **co-07 · matching** — two-way and three-way matching within tolerances.
- **co-08 · gr-ir-clearing** — the liability for goods received but not invoiced.
- **co-09 · payment-terms** — due dates and early-payment discounts.
- **co-10 · payment-run** — selecting, approving, paying, and posting.
- **co-11 · duplicate-detection** — catching the same invoice entered twice.
- **co-12 · credit-notes-and-returns** — supplier credits and returned goods.
- **co-13 · ageing** — open items in buckets by due date.
- **co-14 · subledger-tie-out** — the payables subledger equals the control account.
- **co-15 · p2p-controls** — segregation of duties, bank-change controls, and fraud signals.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · p2p-diagram** — draw the cycle with each document's key (Mermaid) — verify the keys link
  the documents. (co-01)
- **ex-02 · supplier-record** — validate a supplier record — verify a missing tax ID is refused.
  (co-02)
- **ex-03 · supplier-id-format** — validate a (fictional) tax ID format — verify good and bad IDs.
  (co-02)
- **ex-04 · requisition-approval** — create and approve a requisition — verify the state. (co-03)
- **ex-05 · po-from-requisition** — create a purchase order from it — verify the totals. (co-04)
- **ex-06 · po-states** — open, partly received, received, and closed — verify transitions. (co-04)
- **ex-07 · goods-receipt** — record received quantities — verify the order state. (co-05)
- **ex-08 · receipt-posting** — post debit inventory or expense, credit GR/IR — verify. (co-05, co-08)
- **ex-09 · supplier-invoice** — record an invoice with tax — verify totals. (co-06)
- **ex-10 · invoice-posting** — post debit GR/IR and input tax, credit payables — verify. (co-06,
  co-08)
- **ex-11 · due-date** — compute the due date from terms — verify month-end edge cases. (co-09)
- **ex-12 · two-way-match** — match a service invoice to its order — verify. (co-07)
- **ex-13 · three-way-match** — match order, receipt, and invoice — verify a pass. (co-07)
- **ex-14 · price-variance** — catch an invoice price above the order — verify the exception. (co-07)
- **ex-15 · quantity-variance** — catch invoiced quantity above received — verify the block. (co-07)
- **ex-16 · tolerances** — apply percentage and absolute tolerances — verify both limits. (co-07)
- **ex-17 · invoice-hold** — hold an unmatched invoice from payment — verify. (co-07, co-10)
- **ex-18 · payment-posting** — post debit payables, credit bank — verify. (co-10)
- **ex-19 · partial-payment** — pay part of an invoice — verify the remaining balance. (co-10)
- **ex-20 · open-items** — list open items per supplier — verify. (co-14)
- **ex-21 · ageing-buckets** — bucket open items by due date — verify bucket edges. (co-13)
- **ex-22 · tie-out** — compare the subledger with the control account — verify zero difference.
  (co-14)
- **ex-23 · credit-note** — apply a supplier credit note — verify the balance. (co-12)
- **ex-24 · supplier-statement** — reconcile our open items with a supplier statement — verify the
  differences. (co-14)
- **ex-25 · beginner-cycle** — run one purchase end to end — verify every posting. (co-01–co-14)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · duplicate-exact** — refuse the same supplier, number, and amount — verify. (co-11)
- **ex-27 · duplicate-normalized** — normalize invoice numbers (case, dashes, leading zeros) — verify a
  disguised duplicate is caught. (co-11)
- **ex-28 · early-payment-discount** — take a 2/10 net 30 discount — verify the discount entry. (co-09)
- **ex-29 · discount-lost-report** — list discounts missed — verify. (co-09)
- **ex-30 · run-selection** — select invoices due within the run window — verify. (co-10)
- **ex-31 · run-approval** — require an approver who did not create the run — verify. (co-10, co-15)
- **ex-32 · payment-file-preview** — write a simple payment file — verify its contents (formats are
  covered in the treasury course). (co-10)
- **ex-33 · run-posting** — post a payment run — verify the entries. (co-10)
- **ex-34 · uninvoiced-receipts** — report the GR/IR balance at month end — verify. (co-08)
- **ex-35 · gr-ir-ageing** — age GR/IR items — verify old items are flagged. (co-08)
- **ex-36 · gr-ir-residual** — receive 10, invoice 9 — verify the residual. (co-08)
- **ex-37 · return-to-supplier** — return goods and record a debit note — verify. (co-12)
- **ex-38 · supplier-prepayment** — pay a deposit and apply it to the invoice — verify. (co-10)
- **ex-39 · non-po-invoice** — route a rent invoice without an order to approval — verify. (co-06)
- **ex-40 · invoice-coding** — code a non-order invoice to account and cost center — verify. (co-06)
- **ex-41 · foreign-currency-invoice** — record an invoice in another currency at the invoice-date
  rate — verify the functional amount. (co-06)
- **ex-42 · withholding-preview** — withhold tax on a service invoice at an illustrative rate —
  verify the net payment. (co-06, co-10)
- **ex-43 · input-tax** — post recoverable input tax — verify the tax account. (co-06)
- **ex-44 · approval-routing** — route invoices by amount — verify. (co-15)
- **ex-45 · approval-delegation** — delegate approval during absence — verify the trail. (co-15)
- **ex-46 · match-engine** — a table-driven matching engine — verify all match cases. (co-07)
- **ex-47 · exception-queue** — order match exceptions by age — verify. (co-07)
- **ex-48 · ap-close-tasks** — run the payables close tasks — verify the checklist. (co-14)
- **ex-49 · bank-change-control** — require dual approval for supplier bank changes — verify. (co-02,
  co-15)
- **ex-50 · intermediate-cycle** — run a month of purchases — verify the ageing and tie-out. (co-01–
  co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · sod-matrix** — find users who can both create suppliers and approve payments — verify the
  conflicts. (co-15)
- **ex-52 · new-supplier-fast-payment** — flag a new supplier paid within days — verify. (co-15)
- **ex-53 · split-invoices** — find invoices split to stay under an approval limit — verify. (co-15)
- **ex-54 · round-amount-anomaly** — flag suspicious round amounts — verify. (co-15)
- **ex-55 · first-digit-profile** — profile first digits of seeded invoice data — verify the table.
  (co-15)
- **ex-56 · payment-idempotency** — retry a payment run — verify each invoice is paid once. (co-10)
- **ex-57 · bank-status-updates** — apply accepted and rejected statuses — verify a rejection reopens
  the invoice. (co-10)
- **ex-58 · rejected-payment-entries** — post the reversal of a rejected payment — verify. (co-10)
- **ex-59 · supplier-merge** — merge duplicate suppliers — verify history is kept. (co-02)
- **ex-60 · extracted-invoice-validation** — validate fields extracted from a scanned invoice — verify
  the error list. (co-06)
- **ex-61 · structured-e-invoice** — validate a structured e-invoice JSON — verify. (co-06)
- **ex-62 · landed-cost** — allocate freight on an invoice to received items — verify. (co-05, co-06)
- **ex-63 · accrual-vs-invoice** — clear the receipt accrual on invoice — verify no double count.
  (co-08)
- **ex-64 · receipt-cut-off** — handle receipts after the period cut-off — verify the period. (co-05)
- **ex-65 · days-payables-outstanding** — compute DPO — verify. (co-13)
- **ex-66 · cash-requirements** — forecast cash needed from open payables — verify. (co-10, co-13)
- **ex-67 · intercompany-payables** — tag intercompany payables with the partner entity — verify.
  (co-14)
- **ex-68 · p2p-events** — drive postings from P2P events through posting rules — verify. (co-01)
- **ex-69 · p2p-api-validation** — validate invoice API payloads — verify the errors. (co-06)
- **ex-70 · audit-sample** — draw a 25-invoice audit sample with a fixed seed — verify the list.
  (co-15)
- **ex-71 · ap-dashboard-data** — compute dashboard figures — verify. (co-13)
- **ex-72 · evidence-links** — check every posting links to a document — verify. (co-01)
- **ex-73 · p2p-property** — run random purchase flows over fixed seeds — verify the subledger always
  ties out. (co-14)
- **ex-74 · p2p-review-checklist** — review a P2P design against the course rules — verify. (co-01–
  co-15)
- **ex-75 · capstone-preview** — run the capstone module on sample data — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-duplicate-invoice-paid-twice`, `kata-02-match-ignores-tolerance`,
  `kata-03-discount-date-off-by-one`, `kata-04-gr-ir-not-cleared`, `kata-05-self-approved-payment`,
  `kata-06-payment-retry-duplicates`, `kata-07-credit-note-sign`, `kata-08-ageing-bucket-boundary`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A procure-to-pay module.** Suppliers, requisitions, orders, receipts, invoices with three-way
matching and tolerances, holds, duplicate detection, an idempotent payment run with approvals and
discounts, the GR/IR accrual, ageing, and a tie-out report, all posting through the earlier posting
engine. The `run.yaml` runs a scripted month and compares the reports.

## Code and harness

- Python standard library only. Dates are fixed in fixtures; the "run date" is an input, never
  `date.today()`.

## Lineage

- Replaces the 245-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 2 (Transaction cycles), position 6.
- `skills/sharia-accounting` — Phase 2 (Transaction cycles), position 6.
