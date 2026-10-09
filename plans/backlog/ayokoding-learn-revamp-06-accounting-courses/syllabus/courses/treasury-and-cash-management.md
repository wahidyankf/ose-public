# Treasury and Cash Management (By Example)

**Course ID**: `treasury-and-cash-management` · **Format**: By Example.

**Scope note**: Builds cash management features in Python: bank accounts, statement import, bank
reconciliation, cash position, a 13-week forecast, payment files and statuses, pooling, short-term
deposits, currency exposure, and payment fraud controls. It excludes hedge accounting, securities
trading, and Islamic liquidity instruments (`sukuk-and-islamic-capital-markets-accounting`).

**Short summary**: Cash is the one balance a bank can confirm. You build the import, matching, and
reconciliation that prove the books agree with the bank, the forecast that says whether cash will be
enough, and the payment flow that never pays twice or pays a fraudster.

## Why this exists · the big idea

- **The problem before the solution**: unreconciled bank accounts hide errors and theft, a missing
  forecast surprises the business with a cash shortfall, and an unprotected payment flow can be
  redirected by one changed bank detail.
- **Keep-this-if-you-forget-everything**: reconcile every bank account to the ledger, forecast cash
  from real commitments, and protect every payment with dual control and idempotency.

## Learning objectives

- Import bank statements (CSV and the ISO 20022 statement structure) and post bank-originated items.
- Reconcile bank and book with rules, and explain every reconciling item.
- Produce a daily cash position and a 13-week cash forecast from receivables, payables, payroll, and
  tax.
- Generate payment files, process status reports, and keep payments idempotent.
- Model pooling, deposits, and currency exposure, and apply payment fraud controls.

## Prerequisites

- **Prior courses**: `accounts-payable-and-procure-to-pay` (payment runs), `accounts-receivable-and-order-to-cash`
  (cash application), `multi-currency-accounting-and-fx-translation` (foreign-currency accounts and
  exposure), `just-enough-python`.
- **Assumed knowledge**: reading XML.

## Mode and targets

- **Mode**: By Example. **Reason**: treasury features are data flows (files in, matches, files out)
  that are best learned by running each step.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Match bank and book records and
  manage cash and liquidity."); `estimatedHours` from the drift test.

## Accuracy notes

- ISO 20022 message names (`camt.053` bank-to-customer statement, `pain.001` customer credit transfer
  initiation, `pain.002` payment status report): stable domain facts; iso20022.org returned HTTP 403 on
  2026-10-09, so the maker cites an accessible ISO 20022 or bank-published source with its access date.
  Example files are simplified teaching versions and say so.
- Sanctions screening is shown with a fictional list only; no real list is copied.

## Concepts

- **co-01 · bank-accounts** — bank accounts linked to ledger cash accounts and currencies.
- **co-02 · statement-import** — reading statements and posting bank-originated items.
- **co-03 · bank-reconciliation** — matching rules, outstanding items, and reconciling items.
- **co-04 · cash-position** — today's cash across accounts and currencies.
- **co-05 · cash-forecast** — a 13-week direct forecast from commitments.
- **co-06 · payment-initiation** — payment files and their approval.
- **co-07 · payment-status** — accepted, rejected, and returned payments.
- **co-08 · fees-and-interest** — bank charges and interest postings.
- **co-09 · liquidity** — buffers, credit lines, and minimum balances.
- **co-10 · pooling** — sweeping balances to a header account and intercompany positions.
- **co-11 · deposits** — short-term deposits and accrued income.
- **co-12 · fx-exposure** — open currency positions and a simple forward contract.
- **co-13 · payment-fraud-controls** — payee-change checks, dual control, and screening.
- **co-14 · idempotent-payments** — a retried payment never pays twice.
- **co-15 · treasury-reporting** — position, forecast accuracy, and bank fee reports.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · bank-account-register** — model bank accounts — verify each links to a ledger account.
  (co-01)
- **ex-02 · csv-statement-import** — import a CSV statement — verify parsed lines. (co-02)
- **ex-03 · statement-balance-check** — check opening plus movements equals closing — verify. (co-02)
- **ex-04 · camt053-structure** — read a simplified ISO 20022 statement with `xml.etree` — verify the
  entries. (co-02)
- **ex-05 · duplicate-statement** — refuse importing the same statement twice — verify. (co-02)
- **ex-06 · bank-fee-posting** — post fees found on the statement — verify. (co-08)
- **ex-07 · interest-posting** — post interest received — verify. (co-08)
- **ex-08 · exact-match** — match bank lines to book lines by amount and reference — verify. (co-03)
- **ex-09 · outstanding-cheques** — list book items not yet at the bank — verify. (co-03)
- **ex-10 · deposits-in-transit** — list deposits not yet at the bank — verify. (co-03)
- **ex-11 · reconciliation-statement** — produce the reconciliation — verify it explains the
  difference to zero. (co-03)
- **ex-12 · reconciliation-diagram** — draw bank, book, and reconciling items (Mermaid) — verify.
  (co-03)
- **ex-13 · cash-position** — sum balances across accounts — verify. (co-04)
- **ex-14 · cash-position-by-currency** — position by currency with a functional total — verify.
  (co-04)
- **ex-15 · available-vs-ledger-balance** — compare value-dated and booked balances — verify. (co-04)
- **ex-16 · simple-forecast** — forecast four weeks from known items — verify. (co-05)
- **ex-17 · payment-instruction** — model a payment instruction — verify validation. (co-06)
- **ex-18 · payment-approval** — require two approvers — verify. (co-06, co-13)
- **ex-19 · payment-file-csv** — write a CSV payment file — verify. (co-06)
- **ex-20 · pain001-structure** — write a simplified ISO 20022 payment file — verify the XML. (co-06)
- **ex-21 · payment-posting** — post payments on execution — verify. (co-06)
- **ex-22 · bank-account-validation** — validate an IBAN-style check digit — verify good and bad.
  (co-13)
- **ex-23 · daily-cash-report** — print the daily report — verify. (co-15)
- **ex-24 · minimum-balance-alert** — alert below a minimum — verify. (co-09)
- **ex-25 · beginner-cash-day** — run one day: import, match, position — verify. (co-01–co-09)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · rule-based-matching** — match by configurable rules — verify more matches. (co-03)
- **ex-27 · many-to-one-match** — match one bank line to several book lines — verify. (co-03)
- **ex-28 · tolerance-match** — match with a small fee difference — verify the fee posting. (co-03,
  co-08)
- **ex-29 · unmatched-queue** — queue unmatched lines by age — verify. (co-03)
- **ex-30 · reconciliation-sign-off** — require preparer and reviewer — verify. (co-03)
- **ex-31 · thirteen-week-forecast** — build a 13-week forecast from AR, AP, payroll, and tax — verify.
  (co-05)
- **ex-32 · forecast-assumptions** — apply collection-delay assumptions — verify. (co-05)
- **ex-33 · forecast-vs-actual** — measure forecast accuracy — verify. (co-05, co-15)
- **ex-34 · status-report** — process a payment status report — verify statuses. (co-07)
- **ex-35 · rejected-payment** — reopen payables on rejection — verify. (co-07)
- **ex-36 · returned-payment** — handle a return days later — verify. (co-07)
- **ex-37 · idempotent-payment** — retry a payment submission — verify one payment. (co-14)
- **ex-38 · end-to-end-id** — carry an end-to-end ID through file and status — verify. (co-14)
- **ex-39 · payee-change-hold** — hold payments to recently changed bank details — verify. (co-13)
- **ex-40 · callback-record** — record a verification callback — verify release. (co-13)
- **ex-41 · screening-preview** — screen payees against a fictional list — verify the hold. (co-13)
- **ex-42 · cut-off-times** — schedule payments by bank cut-off — verify value dates. (co-06)
- **ex-43 · credit-line** — draw and repay a credit line — verify interest accrual. (co-09)
- **ex-44 · deposit-placement** — place a short-term deposit — verify. (co-11)
- **ex-45 · deposit-income-accrual** — accrue income to period end — verify. (co-11)
- **ex-46 · foreign-currency-account** — keep a EUR account and remeasure — verify. (co-12)
- **ex-47 · exposure-report** — compute open currency exposure — verify. (co-12)
- **ex-48 · treasury-close-tasks** — run month-end treasury tasks — verify. (co-03, co-15)
- **ex-49 · bank-fee-analysis** — compare fees to the bank's tariff — verify. (co-08)
- **ex-50 · intermediate-cash-month** — run a month — verify all reconciliations. (co-01–co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · zero-balancing-sweep** — sweep subsidiary balances to a header account — verify. (co-10)
- **ex-52 · pool-intercompany-positions** — track intercompany positions from sweeps — verify. (co-10)
- **ex-53 · pool-interest-allocation** — allocate pool interest — verify. (co-10)
- **ex-54 · forward-contract** — record a simple forward and its settlement — verify (no hedge
  accounting). (co-12)
- **ex-55 · exposure-after-forward** — recompute exposure — verify. (co-12)
- **ex-56 · scenario-forecast** — run base and stress scenarios — verify the minimum balance. (co-05,
  co-09)
- **ex-57 · seeded-collections-model** — model collections with a seeded distribution — verify the
  percentile table. (co-05)
- **ex-58 · liquidity-buffer-policy** — check a buffer policy — verify. (co-09)
- **ex-59 · statement-gap-detection** — detect missing statement days — verify. (co-02)
- **ex-60 · statement-sequence-check** — check statement numbers and balances chain — verify. (co-02)
- **ex-61 · auto-posting-rules** — post recurring bank items by rule — verify. (co-02)
- **ex-62 · reconciliation-engine** — scored matching with explanations — verify. (co-03)
- **ex-63 · reconciliation-property** — over fixed seeds, every difference is explained — verify.
  (co-03)
- **ex-64 · payment-batch-integrity** — check control totals in payment files — verify. (co-06)
- **ex-65 · file-signing-preview** — sign a payment file hash with a test key (stdlib `hmac`) — verify
  tamper detection. (co-13)
- **ex-66 · duplicate-payment-detection** — detect near-duplicate payments across runs — verify.
  (co-13, co-14)
- **ex-67 · cash-pooling-diagram** — draw the pool structure (Mermaid) — verify. (co-10)
- **ex-68 · treasury-api-validation** — validate payment API payloads — verify. (co-06)
- **ex-69 · treasury-events** — post treasury events through posting rules — verify. (co-02)
- **ex-70 · bank-connectivity-states** — model file states from created to confirmed — verify. (co-07)
- **ex-71 · kpi-report** — compute treasury KPIs — verify. (co-15)
- **ex-72 · audit-trail** — trace a payment from approval to bank confirmation — verify. (co-13)
- **ex-73 · islamic-deposit-preview** — show why an interest-free entity needs a different deposit
  product (used later in the Sharia path) — verify the account flag. (co-11)
- **ex-74 · review-checklist** — review a treasury design — verify. (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-statement-imported-twice`, `kata-02-reconciliation-sign-error`,
  `kata-03-forecast-ignores-payroll`, `kata-04-rejected-payment-not-reopened`,
  `kata-05-payment-retry-duplicates`, `kata-06-changed-bank-detail-paid`,
  `kata-07-value-date-vs-booking-date`, `kata-08-control-total-mismatch`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A cash management module.** Bank accounts, statement import (CSV and simplified ISO 20022), a
rule-based reconciliation with sign-off, a daily position, a 13-week forecast with a scenario,
idempotent payment files with status processing, payee-change controls, and a simple pool. The
`run.yaml` runs a scripted month and compares the reconciliation, forecast, and payment reports.

## Code and harness

- Python standard library only (`xml.etree`, `csv`, `hmac`, `decimal`); no network; all bank files are
  fixtures.

## Read more

- **ISO 20022 message definitions** — the catalogue behind `camt.053`, `pain.001`, and `pain.002`
  (the maker records an accessible URL and access date).
- **IAS 7 Statement of Cash Flows** — IFRS Foundation; what counts as cash and cash equivalents.

## Lineage

- Replaces the 192-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 5 (Controls, payroll, and treasury), position 17.
- `skills/sharia-accounting` — Phase 5 (Controls, payroll, and treasury), position 17.
