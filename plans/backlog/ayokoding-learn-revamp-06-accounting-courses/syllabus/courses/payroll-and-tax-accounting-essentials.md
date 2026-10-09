# Payroll and Tax Accounting Essentials (Annotated-Concept)

**Course ID**: `payroll-and-tax-accounting-essentials` · **Format**: Annotated-Concept.

**Scope note**: Teaches the accounting side of payroll (gross-to-net, employer costs, accruals,
remittances) and of tax (indirect tax on sales and purchases, current income tax, and an introduction
to deferred tax), with effective-dated rate tables. It uses a fictional jurisdiction so no example is
mistaken for a real country's law. It excludes HR and time-keeping systems (ERP path), tax filing
formats of any country, and tax advice.

**Short summary**: Payroll and tax are rules applied to amounts on dates. You build a gross-to-net
calculator, the payroll postings, an indirect-tax ledger, and an income-tax computation, all driven by
dated rate tables you can audit.

## Why this exists · the big idea

- **The problem before the solution**: hard-coded rates break on the day a law changes, and payroll or
  tax postings without calculation records cannot be checked or corrected.
- **Keep-this-if-you-forget-everything**: every tax or payroll amount comes from a dated rule, a base,
  and a rate, and the calculation record is kept with the posting.

## Learning objectives

- Compute gross-to-net pay with pre-tax and post-tax deductions and employer contributions.
- Post payroll, accrue unpaid wages and leave, and clear remittance liabilities.
- Compute output and input indirect tax and the net amount payable per period.
- Compute current income tax expense and introduce deferred tax from temporary differences.
- Drive all rates from effective-dated tables and keep a calculation record per amount.

## Prerequisites

- **Prior courses**: `accrual-accounting-and-revenue-recognition` (wage and tax accruals),
  `accounts-payable-and-procure-to-pay` (input tax and remittances as payables),
  `accounts-receivable-and-order-to-cash` (output tax on invoices), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: the course mixes rule interpretation (annotated
  rule tables) with calculation engines (Python); some topics, such as deferred tax, need a worked
  narrative before code.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Account for payroll and tax
  with clear authorization and calculation records."); `estimatedHours` from the drift test.

## Accuracy notes

- All rates, thresholds, and brackets belong to the fictional "Country X" and are labelled
  illustrative in every example. Any mention of a real jurisdiction's rule needs a primary source with
  URL and access date, or it is removed.
- Deferred tax from temporary differences (IAS 12): stable domain fact; the maker cites the IAS 12 page
  with its access date.

## Concepts

- **co-01 · gross-to-net** — earnings, deductions, taxes withheld, and net pay.
- **co-02 · earnings-types** — salary, hourly, overtime, bonus, and allowances.
- **co-03 · deductions** — pre-tax and post-tax deductions.
- **co-04 · employer-costs** — employer contributions on top of gross pay.
- **co-05 · payroll-postings** — expense, liabilities to employees and authorities, and clearing.
- **co-06 · payroll-accruals** — unpaid wages at period end and leave accruals.
- **co-07 · retro-pay** — corrections for past periods.
- **co-08 · indirect-tax** — output tax on sales, input tax on purchases, and the net payable.
- **co-09 · tax-codes** — codes on documents that pick the rate and the reporting box.
- **co-10 · tax-rounding** — per line or per invoice, by stated rule.
- **co-11 · current-income-tax** — taxable profit times the rate, with adjustments.
- **co-12 · deferred-tax** — tax effects of temporary differences.
- **co-13 · rate-tables** — effective-dated rules and rates.
- **co-14 · calculation-records** — the stored inputs, rule version, and result for each amount.

## Worked examples

### Theme A — Gross to net (`learning/theme-a-gross-to-net.md`)

- **ex-01 · payslip-anatomy** — annotate a fictional payslip — verify every line is classified. (co-01)
- **ex-02 · salary-and-hourly** — compute gross for salaried and hourly staff — verify. (co-02)
- **ex-03 · overtime** — compute overtime at a stated multiplier — verify. (co-02)
- **ex-04 · pre-tax-deduction** — apply a pension deduction before tax — verify the taxable base. (co-03)
- **ex-05 · progressive-tax** — withhold tax with Country X brackets — verify. (co-01, co-13)
- **ex-06 · post-tax-deduction** — apply a loan repayment after tax — verify. (co-03)
- **ex-07 · employer-contribution** — compute employer contributions with a cap — verify. (co-04)
- **ex-08 · gross-to-net-engine** — combine into an engine — verify ten employees. (co-01)
- **ex-09 · gross-to-net-diagram** — draw the calculation order (Mermaid) — verify. (co-01)

### Theme B — Payroll postings and accruals (`learning/theme-b-payroll-postings.md`)

- **ex-10 · payroll-journal** — post one payroll run — verify the entry balances. (co-05)
- **ex-11 · net-pay-clearing** — pay employees through a clearing account — verify it clears. (co-05)
- **ex-12 · remittances** — pay withheld tax and contributions to authorities — verify. (co-05)
- **ex-13 · cost-center-split** — split payroll expense by cost center — verify. (co-05)
- **ex-14 · wage-accrual** — accrue days worked but unpaid at month end — verify. (co-06)
- **ex-15 · leave-accrual** — accrue earned leave — verify the liability. (co-06)
- **ex-16 · bonus-accrual** — accrue a year-end bonus monthly — verify. (co-06)
- **ex-17 · retro-pay** — pay a back-dated raise — verify the correction. (co-07)
- **ex-18 · payroll-reconciliation** — reconcile payroll register to the ledger — verify. (co-05)

### Theme C — Indirect tax (`learning/theme-c-indirect-tax.md`)

- **ex-19 · output-tax** — charge tax on a sale — verify the tax line. (co-08)
- **ex-20 · input-tax** — record recoverable tax on a purchase — verify. (co-08)
- **ex-21 · non-recoverable-input-tax** — add non-recoverable tax to cost — verify. (co-08)
- **ex-22 · tax-codes** — map tax codes to rates and report boxes — verify. (co-09)
- **ex-23 · line-vs-invoice-rounding** — compare rounding rules — verify the difference. (co-10)
- **ex-24 · tax-inclusive-prices** — extract tax from inclusive prices — verify. (co-08, co-10)
- **ex-25 · exempt-and-zero-rated** — handle exempt and zero-rated sales — verify the different input
  tax effect. (co-08)
- **ex-26 · period-tax-return** — compute net payable for a period — verify. (co-08)
- **ex-27 · credit-note-tax** — reverse tax on a credit note — verify. (co-08)
- **ex-28 · tax-ledger-tie-out** — tie the tax report to tax accounts — verify. (co-08, co-14)

### Theme D — Income tax and deferred tax (`learning/theme-d-income-and-deferred-tax.md`)

- **ex-29 · accounting-vs-taxable-profit** — list differences — verify the bridge. (co-11)
- **ex-30 · permanent-differences** — show non-deductible expenses — verify. (co-11)
- **ex-31 · current-tax** — compute current tax — verify the entry. (co-11)
- **ex-32 · temporary-difference** — show depreciation timing — verify. (co-12)
- **ex-33 · deferred-tax-liability** — compute it — verify. (co-12)
- **ex-34 · deferred-tax-asset** — compute an asset from a provision — verify. (co-12)
- **ex-35 · rate-change** — remeasure deferred tax after a rate change — verify. (co-12, co-13)
- **ex-36 · effective-rate-reconciliation** — reconcile the effective rate — verify. (co-11)
- **ex-37 · tax-provision-pack** — produce the provision schedule — verify. (co-11, co-12)

### Theme E — Rates and records (`learning/theme-e-rates-and-records.md`)

- **ex-38 · rate-table-model** — model effective-dated rules — verify lookups across a change date.
  (co-13)
- **ex-39 · rule-change-mid-period** — split a period at a rate change — verify. (co-13)
- **ex-40 · rule-versioning** — version a rule correction — verify recomputation. (co-13)
- **ex-41 · calculation-record** — store inputs, rule version, and result — verify a replay. (co-14)
- **ex-42 · audit-replay** — replay a past payroll from records — verify identical results. (co-14)
- **ex-43 · authorization-records** — require approval of payroll runs — verify. (co-05, co-14)
- **ex-44 · sensitive-data-handling** — keep personal data out of logs — verify the redaction. (co-14)
- **ex-45 · payroll-and-tax-pack** — produce the period pack — verify ties. (co-05, co-08, co-11)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-tax-on-gross-not-taxable`, `kata-02-cap-not-applied`,
  `kata-03-rate-from-wrong-date`, `kata-04-rounding-per-invoice-mismatch`,
  `kata-05-deferred-tax-sign`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A payroll and tax module for Country X.** A gross-to-net engine with dated rules, payroll postings
and accruals, an indirect-tax ledger with a period return, and a year-end tax provision with deferred
tax, each with calculation records that replay. The `run.yaml` runs a scripted quarter and year end and
compares the packs.

## Code and harness

- Python standard library only; personal data in fixtures is fictional.

## Lineage

- Replaces the 186-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 5 (Controls, payroll, and treasury), position 16.
- `skills/sharia-accounting` — Phase 5 (Controls, payroll, and treasury), position 16 · tax kept
  separate from zakah later.
