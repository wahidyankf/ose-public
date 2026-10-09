# Accrual Accounting and Revenue Recognition (Annotated-Concept)

**Course ID**: `accrual-accounting-and-revenue-recognition` · **Format**: Annotated-Concept.

**Scope note**: Teaches accrual accounting (accruals and deferrals) and revenue recognition under the
five-step model of IFRS 15 and ASC 606, with revenue schedules a billing system can generate. It
excludes the purchase and sales document flows (`accounts-payable-and-procure-to-pay`,
`accounts-receivable-and-order-to-cash`), leases (`lease-and-intangible-asset-accounting`), and a
full IFRS and US GAAP comparison (`financial-reporting-standards-ifrs-vs-gaap`).

**Short summary**: Cash tells you when money moved; accrual accounting tells you when value was
earned or used. You learn the five-step revenue model and build revenue schedules for subscriptions,
usage, and bundles that a billing system can run every month.

## Why this exists · the big idea

- **The problem before the solution**: a billing system that books revenue on invoice or on cash
  receipt overstates or understates revenue whenever billing and delivery happen at different times.
- **Keep-this-if-you-forget-everything**: recognize revenue when you satisfy a promise to the
  customer, for the amount you expect to be entitled to — and keep the schedule that proves it.

## Learning objectives

- Explain the difference between cash and accrual accounting and record the four kinds of accruals and
  deferrals.
- Apply the five steps: contract, performance obligations, transaction price, allocation, and timing.
- Generate revenue schedules for subscriptions, usage, milestones, and bundles.
- Keep contract assets, contract liabilities, and receivables apart.
- Handle variable consideration, principal-versus-agent, and contract modifications in code.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics` (posting the schedules),
  `financial-statements-and-close-cycle` (adjusting entries and cut-off), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: the five-step model is a reasoning framework.
  Each step is best shown as an annotated contract analysis followed by the Python schedule it
  produces, a mix the annotated-concept mode allows.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing.
- **Words**: at least 22,000. **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Record revenue and costs
  when they are earned, not just when cash moves."); `estimatedHours` from the drift test.

## Accuracy notes

- IFRS 15 "Revenue from Contracts with Customers" was issued in May 2014 and is effective
  1 January 2018: `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/`,
  accessed 2026-10-09.
- ASC 606 effective dates (public entities for periods beginning after 15 December 2017; private
  entities, after deferral by ASU 2020-05, after 15 December 2019) rest on secondary sources found on
  2026-10-09 (FASB's site returned HTTP 403). The maker cites a primary FASB or SEC source before
  teaching the dates, or states the dates without a day-level claim.
- The five steps and the contract asset and contract liability terms: stable domain facts shared by
  both standards.

## Concepts

- **co-01 · accrual-basis** — record revenue when earned and costs when incurred, not when cash moves.
- **co-02 · four-adjustments** — accrued revenue, accrued expense, deferred revenue, and prepaid
  expense.
- **co-03 · contract** — step 1: an enforceable agreement with commercial substance.
- **co-04 · performance-obligation** — step 2: each distinct good or service promised.
- **co-05 · transaction-price** — step 3: the expected consideration, including variable amounts
  within a constraint.
- **co-06 · allocation** — step 4: split the price by relative standalone selling prices.
- **co-07 · timing** — step 5: recognize over time or at a point in time.
- **co-08 · contract-balances** — contract asset, contract liability, and receivable.
- **co-09 · revenue-schedule** — the per-period plan of recognized amounts for one obligation.
- **co-10 · principal-vs-agent** — gross revenue when you control the good, net fee when you arrange
  it.
- **co-11 · modification** — a change to scope or price treated as a new contract, prospectively, or
  as a catch-up.
- **co-12 · recognition-evidence** — delivery, acceptance, or usage records that justify each amount.
- **co-13 · remaining-obligations** — revenue still to recognize on signed contracts.
- **co-14 · expense-recognition** — costs recognized as used, including capitalized contract costs.

## Worked examples

### Theme A — Accrual versus cash (`learning/theme-a-accrual-versus-cash.md`)

- **ex-01 · same-year-two-ways** — record one year of a small business on cash and accrual bases —
  verify the two profits differ by named items. (co-01)
- **ex-02 · credit-sale** — record a credit sale under both bases — verify the timing. (co-01)
- **ex-03 · prepaid-rent** — pay a year of rent upfront — verify monthly expense under accrual. (co-02)
- **ex-04 · timeline-diagram** — draw delivery, invoice, and payment on one timeline (Mermaid) —
  verify which event drives revenue. (co-01, co-07)
- **ex-05 · four-adjustments-table** — classify eight situations into the four adjustments — verify the
  table. (co-02)
- **ex-06 · period-boundary** — find events that straddle a month end — verify the split. (co-01)
- **ex-07 · cash-to-accrual-bridge** — convert a cash-basis profit to accrual — verify the bridge.
  (co-01, co-02)
- **ex-08 · why-investors-care** — compare two businesses with equal cash and different accruals —
  verify the narrative against the numbers. (co-01)

### Theme B — Accruals and deferrals in a ledger (`learning/theme-b-accruals-and-deferrals.md`)

- **ex-09 · accrued-revenue-entry** — post accrued revenue and its later billing — verify balances.
  (co-02)
- **ex-10 · accrued-expense-entry** — post an accrued expense and the later invoice — verify. (co-02)
- **ex-11 · deferred-revenue-release** — release deferred revenue monthly — verify the liability
  falls to zero. (co-02)
- **ex-12 · prepaid-release** — release a prepaid expense monthly — verify. (co-02)
- **ex-13 · auto-reversal** — use auto-reversing accruals — verify no double count. (co-02)
- **ex-14 · accrual-register** — keep a register of open accruals with evidence — verify each has a
  reason. (co-12)
- **ex-15 · stale-accrual-finder** — flag accruals older than 90 days — verify the list. (co-02)
- **ex-16 · contract-costs** — capitalize a sales commission and amortize it — verify the schedule.
  (co-14)
- **ex-17 · accrual-checks** — check that every deferral has a schedule — verify. (co-02, co-09)

### Theme C — The five-step model (`learning/theme-c-the-five-step-model.md`)

- **ex-18 · five-steps-diagram** — draw the five steps as a pipeline (Mermaid) — verify each step's
  output. (co-03–co-07)
- **ex-19 · contract-criteria** — check contract criteria in code — verify an unsigned order is not a
  contract. (co-03)
- **ex-20 · distinct-obligations** — split a software bundle into license, setup, and support — verify
  the obligations. (co-04)
- **ex-21 · not-distinct** — merge a setup service that is not distinct — verify one obligation.
  (co-04)
- **ex-22 · fixed-price** — compute a fixed transaction price — verify. (co-05)
- **ex-23 · variable-consideration** — estimate a volume rebate with the expected-value method —
  verify the estimate. (co-05)
- **ex-24 · constraint** — constrain variable consideration — verify the recognized amount is capped.
  (co-05)
- **ex-25 · ssp-allocation** — allocate a bundle price by standalone selling prices — verify the
  allocation and remainder handling. (co-06)
- **ex-26 · over-time-test** — decide over time or point in time for three promises — verify. (co-07)
- **ex-27 · point-in-time** — recognize hardware on delivery — verify the entry. (co-07, co-12)
- **ex-28 · five-step-engine** — code the five steps for a simple contract — verify the output.
  (co-03–co-07)

### Theme D — Revenue schedules (`learning/theme-d-revenue-schedules.md`)

- **ex-29 · monthly-subscription** — schedule a 12-month subscription — verify equal months. (co-09)
- **ex-30 · daily-proration** — prorate a mid-month start by days — verify amounts and rounding.
  (co-09)
- **ex-31 · annual-prepaid-plan** — bill annually and recognize monthly — verify the contract
  liability balance. (co-08, co-09)
- **ex-32 · usage-based** — recognize revenue from usage records — verify against the usage file.
  (co-09, co-12)
- **ex-33 · milestones** — recognize on milestone acceptance — verify. (co-07, co-09)
- **ex-34 · percentage-of-completion** — recognize over time by cost incurred — verify. (co-07)
- **ex-35 · contract-asset** — recognize before the right to bill — verify a contract asset. (co-08)
- **ex-36 · schedule-to-entries** — turn schedules into monthly entries — verify posted totals. (co-09)
- **ex-37 · remaining-obligations** — compute revenue still to recognize — verify the backlog report.
  (co-13)

### Theme E — Hard cases (`learning/theme-e-hard-cases.md`)

- **ex-38 · principal-vs-agent** — decide gross or net for a marketplace — verify both presentations.
  (co-10)
- **ex-39 · upgrade-mid-term** — modify a subscription mid-term prospectively — verify the new
  schedule. (co-11)
- **ex-40 · separate-contract-modification** — add distinct services at standalone price — verify a
  new contract. (co-11)
- **ex-41 · cumulative-catch-up** — change a progress estimate — verify the catch-up amount. (co-11)
- **ex-42 · refund-liability** — expect returns — verify revenue net of the refund liability. (co-05)
- **ex-43 · cancellation** — cancel a contract with deferred revenue — verify the entries. (co-08)
- **ex-44 · evidence-gaps** — find recognized revenue without delivery evidence — verify the
  exception list. (co-12)
- **ex-45 · revenue-review-pack** — produce a review pack for one month — verify the totals tie to the
  ledger. (co-09, co-13)

## Drilling

- **Recall Q&A**: at least 24 with `<details>` answers. **Applied problems**: at least 8.
- **Code katas**: `kata-01-revenue-on-invoice`, `kata-02-proration-rounding`,
  `kata-03-allocation-loses-remainder`, `kata-04-contract-asset-vs-receivable`,
  `kata-05-double-counted-accrual`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A revenue schedule engine.** Given 15 customer contracts (subscriptions, bundles, usage, and one
modification), the reader's Python engine identifies obligations, allocates prices, builds schedules,
posts monthly entries through the posting engine, and prints contract balances and remaining
obligations for three months. The `run.yaml` compares the report with the expected output.

## Code and harness

- Python standard library only. Day-count proration uses fixed calendar dates, never today's date.

## Read more

- **IFRS 15 Revenue from Contracts with Customers** — IFRS Foundation.

## Lineage

- Replaces the 249-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 2 (Transaction cycles), position 5 · the timing rules
  payables and receivables rely on.
- `skills/sharia-accounting` — Phase 2 (Transaction cycles), position 5 · the timing rules later
  compared with deferred profit on Islamic contracts.
