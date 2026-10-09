# Fixed Assets and Depreciation (By Example)

**Course ID**: `fixed-assets-and-depreciation` · **Format**: By Example.

**Scope note**: Builds a fixed-asset subledger in Python: capitalization, the asset register,
depreciation methods and conventions, components, changes in estimate, disposals, impairment, and
the monthly depreciation run. It excludes leased right-of-use assets and intangibles
(`lease-and-intangible-asset-accounting`) and deferred tax in depth
(`payroll-and-tax-accounting-essentials` introduces it).

**Short summary**: A machine bought today is used for years, so its cost is spread over those years.
You build the register and the depreciation engine that spreads it, and handle the events that change
the plan: a new estimate, a sale, a write-down.

## Why this exists · the big idea

- **The problem before the solution**: expensing a long-lived purchase at once, or depreciating it
  with an untracked spreadsheet, distorts profit and leaves no evidence of what the business owns.
- **Keep-this-if-you-forget-everything**: capitalize what brings future benefit, depreciate it over its
  useful life from the day it is ready for use, and record every change as a new, explained event.

## Learning objectives

- Decide what to capitalize and what cost to include.
- Maintain an asset register that ties to the ledger.
- Compute straight-line, declining-balance, and units-of-production depreciation with partial-period
  conventions.
- Handle components, changes in estimate, transfers, disposals, and impairment.
- Run an idempotent monthly depreciation job and explain book-versus-tax differences.

## Prerequisites

- **Prior courses**: `journal-entries-and-posting-mechanics`, `accrual-accounting-and-revenue-recognition`
  (depreciation is an accrual-basis allocation), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: By Example. **Reason**: depreciation is computation; every rule is a schedule a reader can
  run and check.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Track long-lived assets,
  depreciate them, and spot impairment."); `estimatedHours` from the drift test.

## Accuracy notes

- IAS 16 "Property, Plant and Equipment" (revision December 2003, effective 1 January 2005, with
  later amendments including proceeds before intended use effective 1 January 2022):
  `https://www.ifrs.org/issued-standards/list-of-standards/ias-16-property-plant-and-equipment/`,
  accessed 2026-10-09.
- IAS 36 (impairment) and ASC 360 (US GAAP impairment of long-lived assets): the authoring session
  did not read their text. The maker cites both with URL and access date before writing examples 46–52.
- Depreciation methods and conventions: stable domain facts.

## Concepts

- **co-01 · capitalization** — capitalize what brings future benefit; expense the rest; a threshold
  policy.
- **co-02 · asset-cost** — purchase price plus directly attributable costs.
- **co-03 · asset-register** — the subledger of assets with class, location, cost, and dates.
- **co-04 · life-and-residual** — useful life and residual value.
- **co-05 · depreciation-methods** — straight-line, declining balance, units of production, and
  sum-of-the-years'-digits.
- **co-06 · in-service-date** — depreciation starts when the asset is available for use;
  partial-period conventions.
- **co-07 · components** — separate depreciation for significant parts.
- **co-08 · change-in-estimate** — prospective change of life, residual, or method.
- **co-09 · disposal** — removing an asset and recognizing the gain or loss.
- **co-10 · impairment** — writing an asset down when it cannot recover its carrying amount.
- **co-11 · revaluation-preview** — the IAS 16 revaluation model in outline.
- **co-12 · construction-in-progress** — costs collected before an asset is ready.
- **co-13 · depreciation-run** — the monthly job that posts depreciation exactly once.
- **co-14 · book-vs-tax** — different tax depreciation creates a temporary difference.
- **co-15 · asset-controls** — tagging, physical verification, and transfers.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · capitalize-or-expense** — classify ten purchases with a threshold — verify. (co-01)
- **ex-02 · cost-components** — include delivery and installation, exclude training — verify the cost.
  (co-02)
- **ex-03 · asset-record** — model an asset — verify validation. (co-03)
- **ex-04 · register-report** — list the register — verify totals by class. (co-03)
- **ex-05 · straight-line** — compute an annual schedule — verify. (co-05)
- **ex-06 · monthly-straight-line** — compute monthly amounts with a final-month remainder — verify the
  total equals cost minus residual. (co-05)
- **ex-07 · declining-balance** — compute a double-declining schedule — verify. (co-05)
- **ex-08 · switch-to-straight-line** — switch when straight-line is higher — verify. (co-05)
- **ex-09 · units-of-production** — depreciate by machine hours — verify. (co-05)
- **ex-10 · sum-of-years-digits** — compute the schedule — verify. (co-05)
- **ex-11 · in-service-date** — start depreciation on the in-service date — verify the first month.
  (co-06)
- **ex-12 · full-month-convention** — apply a full-month convention — verify. (co-06)
- **ex-13 · mid-month-convention** — apply a half-month convention — verify. (co-06)
- **ex-14 · daily-proration** — prorate by days — verify. (co-06)
- **ex-15 · acquisition-entry** — post an asset purchase — verify. (co-01)
- **ex-16 · depreciation-entry** — post depreciation to expense and accumulated depreciation — verify.
  (co-05)
- **ex-17 · carrying-amount** — compute cost less accumulated depreciation — verify. (co-03)
- **ex-18 · register-tie-out** — tie the register to the ledger — verify zero difference. (co-03)
- **ex-19 · schedule-diagram** — chart the carrying amount over life (SVG text) — verify the points.
  (co-05)
- **ex-20 · asset-classes** — default lives and methods per class — verify. (co-04)
- **ex-21 · residual-value** — show the residual floor — verify depreciation stops there. (co-04)
- **ex-22 · fully-depreciated** — keep fully depreciated assets in the register — verify no more
  depreciation. (co-03)
- **ex-23 · asset-tags** — generate and validate tag numbers — verify. (co-15)
- **ex-24 · method-comparison** — compare methods on one asset — verify totals are equal. (co-05)
- **ex-25 · beginner-register** — run a year for five assets — verify. (co-01–co-06)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · components** — split a building into structure, roof, and lifts — verify each schedule.
  (co-07)
- **ex-27 · replace-a-component** — replace the roof — verify the old part is derecognized. (co-07,
  co-09)
- **ex-28 · change-useful-life** — extend the life prospectively — verify the new monthly amount.
  (co-08)
- **ex-29 · change-residual** — change the residual value — verify. (co-08)
- **ex-30 · change-method** — change the method as an estimate change — verify. (co-08)
- **ex-31 · additions** — capitalize an improvement — verify the new base. (co-01)
- **ex-32 · repairs** — expense a repair — verify the register is unchanged. (co-01)
- **ex-33 · construction-in-progress** — collect costs in CIP — verify no depreciation. (co-12)
- **ex-34 · place-in-service** — move CIP to an asset — verify depreciation starts. (co-12)
- **ex-35 · sale-with-gain** — sell above carrying amount — verify the gain. (co-09)
- **ex-36 · sale-with-loss** — sell below — verify the loss. (co-09)
- **ex-37 · scrap** — retire with no proceeds — verify. (co-09)
- **ex-38 · partial-year-disposal** — depreciate up to the disposal date — verify. (co-06, co-09)
- **ex-39 · transfer-between-locations** — transfer an asset — verify the register history. (co-15)
- **ex-40 · transfer-between-entities-preview** — transfer to another entity at carrying amount —
  verify both sides. (co-15)
- **ex-41 · physical-count** — reconcile a physical count with the register — verify missing assets.
  (co-15)
- **ex-42 · depreciation-run** — run a monthly job — verify the posted entry. (co-13)
- **ex-43 · run-idempotency** — rerun the same month — verify nothing posts twice. (co-13)
- **ex-44 · run-for-closed-period** — refuse a run for a closed period — verify. (co-13)
- **ex-45 · catch-up-depreciation** — post missed months when an asset is entered late — verify the
  catch-up. (co-06, co-13)
- **ex-46 · impairment-indicators** — flag assets with impairment indicators — verify. (co-10)
- **ex-47 · recoverable-amount** — compare carrying amount with the higher of value in use and fair
  value less costs of disposal — verify the write-down. (co-10)
- **ex-48 · impairment-entry** — post the impairment — verify the new depreciation base. (co-10)
- **ex-49 · two-step-test-us-gaap** — run the US GAAP recoverability test and then measure — verify
  the different outcome. (co-10)
- **ex-50 · intermediate-register** — run a year with all events — verify the tie-out. (co-01–co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · impairment-reversal** — reverse an impairment under IFRS — verify the cap at the
  no-impairment carrying amount. (co-10)
- **ex-52 · no-reversal-us-gaap** — show that US GAAP forbids the reversal for assets held and used —
  verify. (co-10)
- **ex-53 · cash-generating-unit** — test a group of assets together — verify the allocation of the
  loss. (co-10)
- **ex-54 · revaluation-model** — revalue a building upward — verify the revaluation surplus. (co-11)
- **ex-55 · revaluation-decrease** — revalue downward after a surplus — verify. (co-11)
- **ex-56 · tax-depreciation-book** — keep a second, tax depreciation book — verify both schedules.
  (co-14)
- **ex-57 · temporary-difference** — compute the book-tax difference — verify. (co-14)
- **ex-58 · deferred-tax-preview** — compute a deferred tax liability at an illustrative rate — verify.
  (co-14)
- **ex-59 · multiple-books** — run IFRS and local books in parallel — verify both. (co-14)
- **ex-60 · held-for-sale** — stop depreciation when classified as held for sale — verify. (co-09)
- **ex-61 · asset-retirement-obligation-preview** — add a dismantling cost to the asset — verify the
  liability and the asset. (co-02)
- **ex-62 · borrowing-cost-preview** — capitalize interest during construction — verify. (co-12)
- **ex-63 · grants** — deduct a government grant from cost — verify the lower depreciation. (co-02)
- **ex-64 · mass-additions** — import 500 seeded asset lines — verify the error summary. (co-03)
- **ex-65 · schedule-forecast** — forecast depreciation for five years — verify. (co-13)
- **ex-66 · event-sourced-register** — rebuild the register from events — verify it equals the stored
  register. (co-03)
- **ex-67 · as-of-register** — produce the register as of a past date — verify. (co-03)
- **ex-68 · rounding-policy** — compare rounding per month and per schedule — verify the final-month
  true-up. (co-05)
- **ex-69 · asset-api-validation** — validate asset API payloads — verify. (co-03)
- **ex-70 · fixed-asset-roll-forward** — produce the roll-forward (opening, additions, disposals,
  depreciation, closing) — verify it ties. (co-03)
- **ex-71 · audit-sample** — select assets for verification with a fixed seed — verify. (co-15)
- **ex-72 · property-check** — over fixed seeds, total depreciation never exceeds cost minus residual —
  verify. (co-05)
- **ex-73 · ijarah-asset-preview** — show why a lessor that owns an asset depreciates it (used later
  in the Sharia path) — verify. (co-05)
- **ex-74 · review-checklist** — review a fixed-asset design — verify. (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-depreciation-before-in-service`, `kata-02-below-residual`,
  `kata-03-estimate-change-retrospective`, `kata-04-disposal-without-final-month`,
  `kata-05-run-posts-twice`, `kata-06-impairment-ignores-higher-amount`,
  `kata-07-register-not-tied`, `kata-08-rounding-drift`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A fixed-asset subledger.** A register with classes, components, CIP, an idempotent monthly
depreciation run, disposals, impairment, a tax book, and the roll-forward report, posting through the
earlier engine. The `run.yaml` runs two years of events and compares the roll-forward.

## Code and harness

- Python standard library only; dates fixed; amounts in `Decimal` with an explicit rounding rule.

## Lineage

- Replaces the 231-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 3 (Assets, costs, and inventory), position 9.
- `skills/sharia-accounting` — Phase 3 (Assets, costs, and inventory), position 9 · lessor-owned
  assets reappear in ijarah.
