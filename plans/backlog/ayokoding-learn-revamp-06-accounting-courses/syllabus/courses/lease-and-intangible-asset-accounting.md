# Lease and Intangible Asset Accounting (Annotated-Concept)

**Course ID**: `lease-and-intangible-asset-accounting` · **Format**: Annotated-Concept.

**Scope note**: Teaches lessee and lessor lease accounting under IFRS 16 and ASC 842, and the
recognition and amortization of intangible assets, including internally developed software. It
excludes owned property and equipment (`fixed-assets-and-depreciation`) and Islamic ijarah
(`islamic-contract-modeling-for-systems`, which builds on this course).

**Short summary**: Most leases now sit on the balance sheet. You learn to spot a lease, measure the
liability and the right-of-use asset, run the schedules, and handle changes — and to decide which
software development costs become an asset.

## Why this exists · the big idea

- **The problem before the solution**: a lease register that only tracks payments leaves large
  liabilities off the books, and a product team that expenses or capitalizes all development by habit
  misstates both profit and assets.
- **Keep-this-if-you-forget-everything**: substance decides — if you control the use of an identified
  asset, it is a lease; if a development project meets the criteria, it is an asset.

## Learning objectives

- Decide whether a contract contains a lease and determine the lease term.
- Measure a lease liability and right-of-use asset and generate their schedules.
- Remeasure a lease after a modification or a reassessment.
- Contrast the IFRS 16 single lessee model with the ASC 842 finance and operating split, and lessor
  classification.
- Recognize and amortize intangible assets and apply the research-versus-development rule to software.

## Prerequisites

- **Prior courses**: `accrual-accounting-and-revenue-recognition` (interest accrual and timing),
  `fixed-assets-and-depreciation` (right-of-use assets depreciate like owned assets),
  `just-enough-python`.
- **Assumed knowledge**: present value (taught again briefly in Theme B).

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: the course mixes judgement (is it a lease, is it
  development) with computation (present value schedules); annotated contract analyses plus Python
  schedules fit that mix.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Classify and account for
  leases and intangible assets from their economic substance."); `estimatedHours` from the drift test.

## Accuracy notes

- IFRS 16 "Leases" (issued January 2016, effective 1 January 2019):
  `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-16-leases/`, accessed 2026-10-09.
- IAS 38 "Intangible Assets" (revision March 2004):
  `https://www.ifrs.org/issued-standards/list-of-standards/ias-38-intangible-assets/`, accessed
  2026-10-09; an IASB research project on intangibles was active, with no amendment decided as of the
  June 2026 IASB update.
- ASC 842 effective dates (public entities after 15 December 2018; private entities after
  15 December 2021) come from secondary sources found on 2026-10-09; the maker cites a primary source
  or states the years without day-level claims.

## Concepts

- **co-01 · lease-definition** — an identified asset and the right to control its use for a period.
- **co-02 · lease-term** — the non-cancellable period plus options reasonably certain to be exercised.
- **co-03 · lease-payments** — fixed, in-substance fixed, index-based, and option payments.
- **co-04 · discount-rate** — the rate implicit in the lease or the incremental borrowing rate.
- **co-05 · initial-measurement** — liability at present value; right-of-use asset from it.
- **co-06 · effective-interest** — interest on the liability and the amortization schedule.
- **co-07 · rou-depreciation** — depreciating the right-of-use asset.
- **co-08 · exemptions** — short-term and low-value leases under IFRS 16.
- **co-09 · remeasurement** — modifications, index changes, and reassessed options.
- **co-10 · lessee-models** — IFRS 16 single model; ASC 842 finance and operating leases.
- **co-11 · lessor-classification** — finance and operating leases for lessors.
- **co-12 · intangible-recognition** — identifiable, controlled, future benefits, reliable cost.
- **co-13 · research-vs-development** — expense research; capitalize development when criteria are met.
- **co-14 · amortization-and-impairment** — finite and indefinite lives.

## Worked examples

### Theme A — Is it a lease? (`learning/theme-a-is-it-a-lease.md`)

- **ex-01 · lease-decision-tree** — draw the lease test (Mermaid) — verify each branch. (co-01)
- **ex-02 · office-lease** — analyze an office contract — verify it is a lease. (co-01)
- **ex-03 · substitution-right** — analyze a contract where the supplier can swap the asset — verify it
  is not a lease. (co-01)
- **ex-04 · cloud-hosting** — analyze cloud capacity — verify why it is usually a service. (co-01)
- **ex-05 · lease-term-options** — set the term with extension and termination options — verify.
  (co-02)
- **ex-06 · payment-types** — classify fixed, variable, and index-linked payments — verify which enter
  the liability. (co-03)
- **ex-07 · non-lease-components** — split maintenance from the lease — verify the allocation. (co-03)
- **ex-08 · exemptions** — apply short-term and low-value exemptions — verify which leases are
  excluded. (co-08)

### Theme B — Lessee measurement on day one (`learning/theme-b-day-one-measurement.md`)

- **ex-09 · present-value-refresher** — compute present value in Python with `Decimal` — verify. (co-05)
- **ex-10 · payments-in-advance** — compare advance and arrears payments — verify the different
  liabilities. (co-05)
- **ex-11 · incremental-borrowing-rate** — use an IBR when the implicit rate is unknown — verify. (co-04)
- **ex-12 · initial-liability** — measure the liability — verify. (co-05)
- **ex-13 · initial-rou-asset** — add initial direct costs and incentives — verify. (co-05)
- **ex-14 · day-one-entry** — post the lease — verify. (co-05)
- **ex-15 · rate-sensitivity** — show the liability under three rates — verify. (co-04)
- **ex-16 · lease-register** — model a lease register — verify validation. (co-03)
- **ex-17 · day-one-checks** — check a new lease record before posting — verify the errors. (co-05)

### Theme C — After day one (`learning/theme-c-after-day-one.md`)

- **ex-18 · amortization-schedule** — build the liability schedule — verify the closing balance is
  zero. (co-06)
- **ex-19 · rou-depreciation** — depreciate the right-of-use asset — verify. (co-07)
- **ex-20 · monthly-entries** — post interest, payment, and depreciation — verify. (co-06, co-07)
- **ex-21 · front-loaded-expense** — compare IFRS 16 expense with straight-line rent — verify the
  front-loading. (co-06, co-10)
- **ex-22 · index-change** — remeasure for an index increase — verify. (co-09)
- **ex-23 · extension-exercised** — reassess the term — verify the new schedule. (co-09)
- **ex-24 · modification-scope-increase** — add space as a separate lease — verify. (co-09)
- **ex-25 · modification-scope-decrease** — reduce space — verify the gain or loss. (co-09)
- **ex-26 · early-termination** — terminate early — verify derecognition. (co-09)
- **ex-27 · current-vs-non-current** — split the liability — verify. (co-06)

### Theme D — Lessors and the two frameworks (`learning/theme-d-lessors-and-frameworks.md`)

- **ex-28 · asc842-classification** — classify a lease as finance or operating under ASC 842 — verify.
  (co-10)
- **ex-29 · asc842-operating-expense** — compute the single straight-line cost — verify. (co-10)
- **ex-30 · framework-comparison** — run one lease under both frameworks — verify the profit
  difference by year. (co-10)
- **ex-31 · lessor-classification** — classify for a lessor — verify. (co-11)
- **ex-32 · lessor-finance-lease** — record a net investment — verify. (co-11)
- **ex-33 · lessor-operating-lease** — keep the asset and recognize income — verify. (co-11)
- **ex-34 · sale-and-leaseback-preview** — outline the sale-and-leaseback test — verify the two
  outcomes. (co-11)
- **ex-35 · ijarah-preview** — show the lessor-ownership idea that ijarah builds on (detailed later) —
  verify. (co-11)

### Theme E — Intangibles and software (`learning/theme-e-intangibles-and-software.md`)

- **ex-36 · recognition-criteria** — test five items against the criteria — verify. (co-12)
- **ex-37 · research-vs-development** — split a project timeline — verify which costs are capitalized.
  (co-13)
- **ex-38 · development-criteria** — record evidence for each criterion — verify the checklist. (co-13)
- **ex-39 · capitalizable-costs** — choose eligible costs — verify. (co-13)
- **ex-40 · internal-use-software-us** — compare the US GAAP internal-use software stages — verify.
  (co-13)
- **ex-41 · amortization** — amortize from available-for-use — verify. (co-14)
- **ex-42 · indefinite-life** — test an indefinite-life intangible for impairment yearly — verify. (co-14)
- **ex-43 · cloud-configuration-costs** — show why configuring a cloud service is usually expensed —
  verify. (co-12)
- **ex-44 · intangibles-register** — keep a register with evidence — verify. (co-12, co-14)
- **ex-45 · lease-and-intangible-pack** — produce the period pack (schedules, roll-forwards) — verify it
  ties. (co-06, co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-pv-payment-timing`, `kata-02-schedule-not-zero`,
  `kata-03-variable-payment-included`, `kata-04-modification-ignored`, `kata-05-research-capitalized`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A lease and intangibles subledger.** A lease register with term, payments, rates, schedules,
monthly postings, one modification and one early termination, plus an intangibles register with a
capitalized development project. The `run.yaml` runs two years and compares the roll-forward reports.

## Code and harness

- Python standard library only; present values with `Decimal` and a stated precision.

## Lineage

- Replaces the 249-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 3 (Assets, costs, and inventory), position 11.
- `skills/sharia-accounting` — Phase 3 (Assets, costs, and inventory), position 11 · the base for
  ijarah under AAOIFI FAS 32.
