# Multi-currency Accounting and FX Translation (By Example)

**Course ID**: `multi-currency-accounting-and-fx-translation` · **Format**: By Example.

**Scope note**: Builds multi-currency support into a ledger in Python: currencies and minor units,
rate tables, recording foreign-currency transactions, period-end remeasurement, realized and
unrealized differences, and translation of a foreign operation with the translation reserve. It
excludes consolidation eliminations (`consolidation-and-multi-entity-accounting`), hedge accounting,
and treasury operations (`treasury-and-cash-management`).

**Short summary**: One invoice in euros becomes many numbers in your books over time. You build the
rate tables, the posting rules, and the period-end jobs that keep every foreign-currency balance
explainable.

## Why this exists · the big idea

- **The problem before the solution**: a ledger that stores only one converted amount cannot remeasure
  balances, cannot explain exchange gains, and mixes currencies in totals.
- **Keep-this-if-you-forget-everything**: store the transaction amount, its currency, and the rate you
  used; convert again only by explicit, dated rules.

## Learning objectives

- Model currencies with their minor units and keep amounts per currency exact.
- Maintain effective-dated rate tables by rate type and source.
- Record foreign-currency transactions and compute realized differences on settlement.
- Remeasure monetary items at period end and post unrealized differences.
- Translate a foreign operation's statements and compute the translation reserve.
- Design multi-currency balances, rounding, and triangulation that stay balanced.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics` (lines with two amounts),
  `financial-statements-and-close-cycle` (period-end jobs and statements), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: By Example. **Reason**: currency handling is precise computation with many edge cases,
  each a small runnable rule.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Record foreign-currency
  transactions and translate balances with traceable rates."); `estimatedHours` from the drift test.

## Accuracy notes

- IAS 21 "The Effects of Changes in Foreign Exchange Rates" (revision December 2003); the Lack of
  Exchangeability amendment (August 2023) is effective 1 January 2025:
  `https://www.ifrs.org/issued-standards/list-of-standards/ias-21-the-effects-of-changes-in-foreign-exchange-rates/`
  and `https://www.iasplus.com/en/events/effective-dates/2025/ias-21`, both accessed 2026-10-09.
- ISO 4217 defines currency codes and minor units; iso.org returned HTTP 403 on 2026-10-09, so the
  maker cites an accessible ISO 4217 source with its access date. All rates in examples are fictional
  fixtures.

## Concepts

- **co-01 · currency-roles** — transaction, functional, and presentation currency.
- **co-02 · minor-units** — each currency's number of decimal places (for example 0, 2, or 3).
- **co-03 · rate-tables** — spot, average, and closing rates with effective dates and a source.
- **co-04 · initial-recognition** — convert at the spot rate on the transaction date.
- **co-05 · monetary-items** — cash, receivables, and payables versus non-monetary items.
- **co-06 · remeasurement** — monetary items at the closing rate with unrealized differences.
- **co-07 · settlement** — realized differences when the item is paid.
- **co-08 · revaluation-reversal** — reversing unrealized differences next period, or not, as a
  design choice.
- **co-09 · translation** — a foreign operation's statements in the presentation currency.
- **co-10 · translation-reserve** — the cumulative translation difference in other comprehensive
  income.
- **co-11 · balancing-and-rounding** — entries balance in every currency; rounding differences go to a
  named account.
- **co-12 · triangulation** — converting through a base currency, and inverse-rate precision.
- **co-13 · exchangeability** — what to do when a currency cannot be exchanged (IAS 21, 2025).
- **co-14 · ledger-design** — storing transaction and functional amounts and balances per currency.
- **co-15 · fx-reporting** — revaluation reports and open exposures.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · money-type** — a `Money` type with amount and currency — verify adding different
  currencies fails. (co-01, co-02)
- **ex-02 · minor-units-table** — quantize JPY, USD, and a three-decimal currency — verify. (co-02)
- **ex-03 · currency-roles** — label the three currencies for a subsidiary — verify. (co-01)
- **ex-04 · rate-table** — store dated rates — verify lookup by date. (co-03)
- **ex-05 · rate-types** — keep spot, average, and closing rates — verify each lookup. (co-03)
- **ex-06 · missing-rate** — fail loudly when no rate exists — verify the error. (co-03)
- **ex-07 · rate-direction** — store rates as "1 EUR = x USD" — verify an inverted rate is detected.
  (co-03, co-12)
- **ex-08 · invoice-in-foreign-currency** — record a sale in EUR in a USD ledger — verify both amounts
  on the line. (co-04, co-14)
- **ex-09 · purchase-in-foreign-currency** — record a purchase — verify. (co-04)
- **ex-10 · settlement-gain** — settle at a better rate — verify the realized gain. (co-07)
- **ex-11 · settlement-loss** — settle at a worse rate — verify the loss. (co-07)
- **ex-12 · partial-settlement** — settle half — verify the realized part. (co-07)
- **ex-13 · monetary-classification** — classify ten items — verify. (co-05)
- **ex-14 · period-end-remeasurement** — remeasure a receivable — verify the unrealized difference.
  (co-06)
- **ex-15 · non-monetary-not-remeasured** — keep inventory at historical rate — verify. (co-05)
- **ex-16 · reversal-next-period** — reverse the unrealized entry next period — verify. (co-08)
- **ex-17 · no-reversal-design** — carry a revalued base forward instead — verify the same total
  effect. (co-08)
- **ex-18 · balances-per-currency** — keep balances by account and currency — verify. (co-14)
- **ex-19 · trial-balance-in-functional** — print a functional-currency trial balance — verify it
  balances. (co-14)
- **ex-20 · rounding-difference** — convert a multi-line entry — verify the rounding line. (co-11)
- **ex-21 · fx-flow-diagram** — draw transaction → remeasure → settle (Mermaid) — verify. (co-04,
  co-06, co-07)
- **ex-22 · rate-source-audit** — record the rate source on every conversion — verify. (co-03)
- **ex-23 · bank-account-in-foreign-currency** — keep a EUR bank account — verify remeasurement.
  (co-05, co-06)
- **ex-24 · fx-gain-loss-accounts** — separate realized and unrealized accounts — verify. (co-06,
  co-07)
- **ex-25 · beginner-month** — run a month with foreign sales and purchases — verify. (co-01–co-11)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · triangulation** — convert EUR to IDR through USD — verify against a direct rate. (co-12)
- **ex-27 · inverse-precision** — show precision loss with inverted rates — verify the fix. (co-12)
- **ex-28 · rate-precision-policy** — store rates with fixed decimal places — verify. (co-03)
- **ex-29 · average-rate-computation** — compute a monthly average from daily rates — verify. (co-03)
- **ex-30 · revaluation-job** — run a period-end revaluation job — verify the entry. (co-06)
- **ex-31 · revaluation-idempotency** — rerun it — verify nothing posts twice. (co-06)
- **ex-32 · revaluation-report** — explain each revalued balance — verify. (co-15)
- **ex-33 · intercompany-loan-in-foreign-currency** — remeasure an intercompany loan — verify. (co-06)
- **ex-34 · foreign-operation-tb** — load a subsidiary trial balance in EUR — verify. (co-09)
- **ex-35 · translate-balance-sheet** — translate at the closing rate — verify. (co-09)
- **ex-36 · translate-income-statement** — translate at average rates — verify. (co-09)
- **ex-37 · equity-at-historical** — translate equity at historical rates — verify. (co-09)
- **ex-38 · translation-reserve** — compute the balancing reserve — verify the statements balance.
  (co-10)
- **ex-39 · reserve-roll-forward** — roll the reserve forward a year — verify. (co-10)
- **ex-40 · translation-diagram** — draw which rate applies to which line (Mermaid) — verify. (co-09)
- **ex-41 · presentation-currency** — present a USD-functional group in IDR — verify. (co-01, co-09)
- **ex-42 · multi-currency-payment-run** — pay suppliers in three currencies — verify the bank
  postings. (co-07)
- **ex-43 · receipt-in-third-currency** — receive USD for a EUR invoice — verify. (co-07, co-12)
- **ex-44 · fx-on-prepayments** — keep a prepayment at its historical rate — verify. (co-05)
- **ex-45 · fx-exposure-report** — list open exposures by currency — verify. (co-15)
- **ex-46 · rate-import-validation** — validate an imported rate file — verify errors. (co-03)
- **ex-47 · rate-overrides** — allow a contract rate with approval — verify. (co-03)
- **ex-48 · zero-decimal-currency** — handle a zero-decimal currency in allocations — verify. (co-02,
  co-11)
- **ex-49 · fx-close-tasks** — run the FX close tasks — verify. (co-06, co-15)
- **ex-50 · intermediate-quarter** — run a quarter for a parent and a subsidiary — verify. (co-01–
  co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · ledger-storage-design** — store transaction, functional, and reporting amounts in
  `sqlite3` — verify the schema constraints. (co-14)
- **ex-52 · reporting-currency-ledger** — maintain a third, reporting-currency amount — verify. (co-14)
- **ex-53 · per-currency-balance-constraint** — enforce per-currency balance on each entry — verify.
  (co-11)
- **ex-54 · translation-of-a-translation** — show why translating twice through intermediate parents
  needs care — verify the difference. (co-09)
- **ex-55 · disposal-of-foreign-operation** — recycle the reserve on disposal — verify. (co-10)
- **ex-56 · net-investment-loan** — treat a long-term intercompany loan as part of the net investment —
  verify the reserve effect. (co-10)
- **ex-57 · hyperinflation-preview** — show why hyperinflationary currencies need restatement first —
  verify. (co-13)
- **ex-58 · lack-of-exchangeability** — estimate a spot rate when exchange is not possible, with
  disclosure data — verify. (co-13)
- **ex-59 · historical-rate-tracking** — track historical rates for non-monetary items — verify. (co-05)
- **ex-60 · rate-table-versioning** — correct a wrong rate with a new version — verify the trail.
  (co-03)
- **ex-61 · retroactive-rate-fix** — correct postings made with a wrong rate — verify reversal and
  rebook. (co-03)
- **ex-62 · fx-property-balance** — over fixed seeds, converted entries always balance in functional
  currency — verify. (co-11)
- **ex-63 · fx-property-settlement** — over fixed seeds, realized plus unrealized differences equal
  the total rate movement — verify. (co-06, co-07)
- **ex-64 · rounding-allocation** — distribute rounding across lines largest-first — verify. (co-11)
- **ex-65 · fx-api-validation** — validate conversion requests — verify. (co-03)
- **ex-66 · fx-events** — post FX events through posting rules — verify. (co-14)
- **ex-67 · fx-audit-trail** — trace a reported number to rates and sources — verify. (co-03, co-15)
- **ex-68 · sukuk-currency-preview** — show a USD-denominated instrument held by an IDR entity (used
  later in the Sharia path) — verify. (co-06)
- **ex-69 · performance-rate-cache** — cache rate lookups — verify identical results. (co-03)
- **ex-70 · multi-entity-revaluation** — revalue three entities with different functional currencies
  — verify. (co-06)
- **ex-71 · fx-statement-note** — produce the FX note data — verify. (co-15)
- **ex-72 · translation-check** — check translated statements balance and the reserve ties — verify.
  (co-10)
- **ex-73 · fx-review-checklist** — review an FX design — verify. (co-01–co-15)
- **ex-74 · fx-failure-gallery** — run five common FX bugs and their fixes — verify each. (co-11,
  co-12)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-float-rates`, `kata-02-inverted-rate`, `kata-03-non-monetary-remeasured`,
  `kata-04-revaluation-posts-twice`, `kata-05-wrong-rate-type`, `kata-06-entry-unbalanced-after-conversion`,
  `kata-07-zero-decimal-rounding`, `kata-08-reserve-not-balancing`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A multi-currency ledger extension.** Rate tables with types and versions, foreign-currency
postings, settlement differences, an idempotent revaluation job, and translation of a subsidiary with
a translation-reserve roll-forward. The `run.yaml` runs a scripted year and compares the reports.

## Code and harness

- Python standard library and `sqlite3`. All rates are fixed fixtures in the example folder; no example
  fetches rates from the network.

## Lineage

- Replaces the 203-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 4 (Groups, currencies, and standards), position 12.
- `skills/sharia-accounting` — Phase 4 (Groups, currencies, and standards), position 12.
