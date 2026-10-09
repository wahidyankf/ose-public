# Zakah Computation and Reporting for Systems (Annotated-Concept)

**Course ID**: `zakah-computation-and-reporting-for-systems` · **Format**: Annotated-Concept.

**Scope note**: Teaches how a system computes, records, and reports business zakah (zakat) for an
entity: the zakah base under the recognised methods, the haul (zakah year), nisab, rates for lunar and
solar years, the accounting under AAOIFI FAS 39 and Indonesia's PSAK 409, and the separation of zakah
from income tax. Every method, rate, and threshold is configurable policy with a Sharia board decision
behind it. It excludes personal zakah calculators, the distribution side of zakah institutions in
depth, and income tax (`payroll-and-tax-accounting-essentials`). It never issues Sharia rulings.

**Short summary**: Zakah is not a tax with one formula. Methods, rates, and thresholds differ between
AAOIFI, national law, and scholars. You build a zakah engine where each of those is a board-approved
setting, compute the base from the ledger with full evidence, and report zakah separately from income
tax.

## Why this exists · the big idea

- **The problem before the solution**: a system that hard-codes "2.5% of net assets" silently picks a
  method, a calendar, and a nisab basis that an entity's Sharia board may not have chosen, and mixes
  zakah with tax in ways that misstate both.
- **Keep-this-if-you-forget-everything**: the zakah base, the calendar, the rate, and the nisab are
  board-approved settings; the engine applies them to ledger data and keeps the working that proves the
  number.

## Learning objectives

- Explain zakah's conditions for a business (ownership, nisab, haul, and zakatable assets) with
  attributed sources and without issuing rulings.
- Compute the zakah base under the net assets method, the net invested funds method, and Indonesia's
  current-assets-minus-short-term-liabilities basis.
- Apply lunar and solar rates and nisab values from configuration, and explain why published solar
  rates differ slightly.
- Record and present zakah under AAOIFI FAS 39 and PSAK 409, separate from income tax.
- Produce a zakah working paper with evidence and the board decisions it relies on.

## Prerequisites

- **Prior courses**: `islamic-contract-modeling-for-systems` (contract balances that enter the base),
  `financial-statements-and-close-cycle` (the balance sheet the base comes from),
  `inventory-and-cogs-accounting` (valuing trade goods), `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: each method needs an annotated explanation of what
  is included and why, with sources, before the Python engine computes it; side-by-side method tables
  carry the differences.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Compute and report zakah
  separately from income tax, with its own evidence."); `estimatedHours` from the drift test.

## Sharia content rules

This course follows [tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md): the
disclaimer sentence in `overview.md`, the board-decision callout, attributed positions, and the AAOIFI
URL register.

**Board decision points this course must flag** (each with the callout):

1. Which zakah base method the entity uses.
2. Lunar or solar zakah year, and the rate used for a solar year.
3. The nisab basis (gold weight, purity, and the price source and date).
4. Whether the entity pays zakah itself or discloses it for owners to pay.
5. How specific items are classified (for example receivables of doubtful recovery, or fixed assets
   held for use).

**Differences the course must show** (attributed, not ruled on):

| Point           | AAOIFI (FAS 39 with SS 35)                                                 | Indonesia                                                                                                                          |
| --------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Base            | Net assets method; net invested funds method also described                | Current assets minus short-term liabilities at the haul date (PMA 52/2014, Article 12)                                             |
| Solar-year rate | About 2.577% (secondary descriptions of SS 35)                             | 2.575% for a Gregorian year (BAZNAS company zakat page); the regulation states 2.5%                                                |
| Nisab           | 85 g gold is the usual figure; no AAOIFI primary statement found           | 85 g gold (PMA 52/2014, Article 11); BAZNAS 2026 income-zakat nisab priced at 14-carat gold, while its company page says pure gold |
| Who pays        | Institution-level accounting driven by legal obligation or owners' mandate | Obligation on the zakat payer; paid through an official amil (PMA 52/2014, Article 13)                                             |

## Accuracy notes

All facts below were checked on 2026-10-09; sources and excerpts are in
[tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md#source-register).

- AAOIFI FAS 39 Financial Reporting for Zakah applies from 1 January 2023 and supersedes FAS 9; it
  applies with Sharia Standard 35 (Zakah). Whether FAS 39 itself keeps both base methods is not
  confirmed; the course attributes each method to the source that describes it.
- Indonesia: PMA 52/2014 (`https://peraturan.go.id/files/bn1830-2014.pdf`) Article 11 sets the trade
  zakat nisab at 85 g gold and the rate at 2.5%; Article 12 sets the base as current assets minus
  short-term liabilities at the haul date; Article 13 requires payment through an official amil.
  PMA 31/2019 (`https://peraturan.go.id/files/bn1503-2019.pdf`) set the income and services nisab at
  85 g gold.
- BAZNAS company zakat page (`https://baznas.go.id/zakatperusahaan`): nisab "85 gram emas murni"
  (pure gold); rate "2,5% berdasarkan penanggalan hijriah atau 2,575% berdasarkan penanggalan masehi".
  BAZNAS decision 15/2026 (21 February 2026) set the 2026 income nisab at Rp 91,681,728 a year priced
  at 14-carat gold; the course presents this as an inconsistency between two BAZNAS publications, not
  as a ruling.
- Rate arithmetic (the course's own calculation, labelled as such): 2.5 × 365/354 ≈ 2.578 and
  2.5 × 365.2422/354.3671 ≈ 2.577; published solar rates (2.575%, about 2.577%) are different roundings
  of the same idea. Some scholars object to adjusting the rate; the course cites that view.
- Indonesia's zakat accounting standard is PSAK 409 (the old PSAK 109, renumbered from 1 January
  2024). Any statement about income-tax treatment of zakat paid in Indonesia needs a primary legal
  source found by the maker, or it is removed.
- All amounts in examples are fictional, in a stated currency, with a stated gold price fixture.

## Concepts

- **co-01 · zakah-conditions** — ownership, nisab, haul, and zakatable wealth.
- **co-02 · entity-zakah** — when an entity pays zakah and when it only discloses it.
- **co-03 · zakatable-assets** — cash, receivables, trade goods, and investments held for trade.
- **co-04 · deductions** — liabilities and items excluded from the base.
- **co-05 · net-assets-method** — zakatable assets minus deductible liabilities.
- **co-06 · net-invested-funds-method** — capital, reserves, and long-term funding minus fixed assets
  and non-trading investments.
- **co-07 · working-capital-basis** — current assets minus short-term liabilities (Indonesia).
- **co-08 · haul** — the zakah year, lunar or solar.
- **co-09 · rates** — 2.5% lunar and the solar adjustment.
- **co-10 · nisab** — the threshold, its gold basis, and its price.
- **co-11 · fas-39-reporting** — recognition, presentation, and disclosure under FAS 39.
- **co-12 · psak-409-reporting** — Indonesia's zakat accounting standard.
- **co-13 · zakah-vs-tax** — separate computation, posting, and reporting.
- **co-14 · zakah-policy-as-data** — board-approved settings with dates.
- **co-15 · working-papers** — the evidence behind a zakah number.

## Worked examples

### Theme A — Conditions and scope (`learning/theme-a-conditions-and-scope.md`)

- **ex-01 · what-zakah-is** — annotate the conditions with sources — verify every claim is attributed.
  (co-01)
- **ex-02 · entity-or-owners** — compare paying versus disclosing for owners (callout) — verify the
  setting drives the posting. (co-02, co-14)
- **ex-03 · haul-dates** — compute a lunar and a solar zakah year end from a start date — verify with a
  fixture calendar table. (co-08)
- **ex-04 · nisab-from-gold-price** — compute nisab from a gold weight, purity, and price fixture —
  verify. (co-10)
- **ex-05 · nisab-basis-differences** — compare pure-gold and 14-carat bases — verify the difference.
  (co-10)
- **ex-06 · zakah-policy-model** — model method, calendar, rate, and nisab settings — verify validation.
  (co-14)
- **ex-07 · board-approval-required** — refuse a computation without an approved policy — verify.
  (co-14)
- **ex-08 · zakah-flow-diagram** — draw ledger to base to zakah to posting (Mermaid) — verify. (co-15)
- **ex-09 · scope-limits** — state what the course does not decide — verify the disclaimer and
  callouts. (co-02)

### Theme B — The base under each method (`learning/theme-b-zakah-base.md`)

- **ex-10 · classify-accounts** — tag chart accounts as zakatable, deductible, or excluded — verify
  every balance-sheet account is tagged. (co-03, co-04)
- **ex-11 · trade-goods-valuation** — value inventory for zakah at the stated basis — verify. (co-03)
- **ex-12 · receivables-classification** — split receivables by expected recovery (callout) — verify.
  (co-03, co-14)
- **ex-13 · net-assets-method** — compute the base — verify. (co-05)
- **ex-14 · net-invested-funds-method** — compute the base — verify. (co-06)
- **ex-15 · working-capital-basis** — compute the Indonesian basis — verify. (co-07)
- **ex-16 · three-methods-compared** — run all three on one balance sheet — verify the differences are
  explained line by line. (co-05–co-07)
- **ex-17 · contract-balances** — include murabaha receivables and ijarah assets as the policy says —
  verify. (co-03)
- **ex-18 · method-diagram** — draw what each method includes (Mermaid) — verify. (co-05–co-07)

### Theme C — Rates, calendars, and thresholds (`learning/theme-c-rates-and-nisab.md`)

- **ex-19 · lunar-rate** — apply 2.5% for a lunar year — verify. (co-09)
- **ex-20 · solar-rate-options** — apply 2.575% and 2.577% from configuration — verify both. (co-09)
- **ex-21 · rate-derivation** — derive the solar adjustment and show the roundings — verify. (co-09)
- **ex-22 · below-nisab** — return zero when the base is below nisab — verify. (co-10)
- **ex-23 · nisab-price-date** — price nisab at the haul date — verify a wrong date fails. (co-10)
- **ex-24 · short-first-year** — handle a first period shorter than a year per policy (callout) —
  verify. (co-08, co-14)
- **ex-25 · policy-change-mid-life** — change calendar with a board decision — verify the transition
  record. (co-14)
- **ex-26 · rounding-rule** — round the zakah amount by the stated rule — verify. (co-09)
- **ex-27 · settings-matrix-tests** — test every setting combination — verify. (co-14)

### Theme D — Accounting and reporting (`learning/theme-d-accounting-and-reporting.md`)

- **ex-28 · fas-39-recognition** — post zakah when the entity is obliged to pay — verify. (co-11)
- **ex-29 · fas-39-disclosure** — disclose zakah per share when owners pay — verify. (co-11)
- **ex-30 · psak-409-presentation** — present zakah under PSAK 409 — verify. (co-12)
- **ex-31 · zakah-payable** — record and settle the payable through an official amil — verify. (co-12)
- **ex-32 · zakah-vs-income-tax** — compute and post both separately — verify neither changes the
  other's base unless a cited rule says so. (co-13)
- **ex-33 · zakah-in-statements** — place zakah in the statements under each framework — verify.
  (co-11, co-12)
- **ex-34 · prior-year-adjustment** — correct last year's zakah — verify. (co-11)
- **ex-35 · zakah-fund-for-ifi** — keep a zakah fund statement for an institution that collects zakah —
  verify. (co-11)
- **ex-36 · reporting-diagram** — draw where zakah appears (Mermaid) — verify. (co-11–co-13)

### Theme E — The zakah engine (`learning/theme-e-zakah-engine.md`)

- **ex-37 · engine-design** — design inputs, settings, and outputs — verify the interface. (co-14)
- **ex-38 · read-from-ledger** — pull balances from the ledger at the haul date — verify. (co-15)
- **ex-39 · working-paper** — produce a working paper with each line's source — verify. (co-15)
- **ex-40 · evidence-links** — link lines to ledger accounts and documents — verify. (co-15)
- **ex-41 · recompute-and-compare** — recompute a past year from stored inputs — verify identical
  results. (co-15)
- **ex-42 · multi-entity-zakah** — compute per entity in a group — verify no group netting unless the
  policy allows it (callout). (co-14)
- **ex-43 · audit-trail** — record who approved each run — verify. (co-15)
- **ex-44 · decision-spotting** — find board decisions in a zakah requirement — verify. (co-14)
- **ex-45 · zakah-pack** — produce the annual zakah pack — verify ties and disclaimers. (co-11–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-method-hard-coded`, `kata-02-solar-year-lunar-rate`,
  `kata-03-nisab-priced-wrong-date`, `kata-04-zakah-mixed-with-tax`,
  `kata-05-fixed-assets-in-working-capital-base`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.
- **Sharia board decision spotting**: at least 6 scenarios.

## Capstone spec

**A configurable zakah engine.** Board-approved settings for method, calendar, rate, and nisab; account
classification; computation under three bases; FAS 39 and PSAK 409 presentation; a working paper with
evidence links; and a recomputation check. The `run.yaml` runs fixture entities under several approved
settings and compares the packs.

## Code and harness

- Python standard library only; gold prices, calendars, and Hijri dates are fixtures in the example
  directories (no calendar library, no network). Hijri date conversion is never computed by the
  harness; fixture tables give it.

## Read more

- **PMA 52/2014** — `https://peraturan.go.id/files/bn1830-2014.pdf`.
- **BAZNAS — Zakat Perusahaan** — `https://baznas.go.id/zakatperusahaan`.
- **AAOIFI FAS 39** — listing on `https://cis.aaoifi.com/ar/?p=381` (human check before linking).

## Lineage

- Replaces the 260-word outline measured on 2026-10-09. The archived 2026-08-16 Sharia extension plan
  cited FAS 9, superseded by FAS 39 from 1 January 2023.

## In which paths

- `skills/sharia-accounting` — Phase 7 (Sharia accounting for systems), position 22.
