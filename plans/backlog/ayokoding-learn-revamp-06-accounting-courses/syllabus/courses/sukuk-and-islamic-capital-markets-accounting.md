# Sukuk and Islamic Capital Markets Accounting (Annotated-Concept)

**Course ID**: `sukuk-and-islamic-capital-markets-accounting` · **Format**: Annotated-Concept.

**Scope note**: Teaches how sukuk work and how their issuers, special-purpose vehicles, and holders
account for them: the main structures (ijarah, mudarabah, musharakah, wakalah, murabaha, and hybrid
sukuk), asset-backed versus asset-based sukuk, periodic distributions, classification and measurement
for holders under AAOIFI FAS 33 and FAS 34, Indonesia's PSAK 410 and state sukuk (SBSN), IFRS-based
treatment in IFRS jurisdictions, and Islamic money-market instruments used for liquidity. It excludes
securities trading systems, pricing models beyond simple yield, and contract mechanics already taught
in `islamic-contract-modeling-for-systems`. It never issues Sharia rulings.

**Short summary**: A sukuk certificate represents a share in assets or a venture, not a debt that pays
interest. You learn the structures, follow the cash and the assets through the special-purpose vehicle,
and build the holder and issuer accounting under AAOIFI and the national standards, with dates and
sources for every rule.

## Why this exists · the big idea

- **The problem before the solution**: a system that books sukuk as conventional bonds with a coupon
  misstates what the holder owns, applies the wrong measurement rules, and hides the structure an
  auditor or Sharia board must see.
- **Keep-this-if-you-forget-everything**: identify the contract and the assets behind each sukuk first;
  the accounting for issuer and holder follows from that structure and from the standard in force.

## Learning objectives

- Explain the main sukuk structures and the role of the special-purpose vehicle, with sources.
- Distinguish asset-backed and asset-based sukuk and what each means for the holder.
- Account for a holder's sukuk under AAOIFI FAS 33 and report for sukuk-holders under FAS 34, and
  compare with IFRS 9-based treatment.
- Account for the issuer side of an ijarah sukuk, including the underlying asset and distributions.
- Map Indonesia's PSAK 410 and state sukuk to the AAOIFI topics, and treat draft standards as drafts.

## Prerequisites

- **Prior courses**: `islamic-contract-modeling-for-systems` (the contracts sukuk are built on),
  `multi-currency-accounting-and-fx-translation` (many sukuk are issued in foreign currency),
  `just-enough-python`.
- **Assumed knowledge**: present value as refreshed in `lease-and-intangible-asset-accounting`
  (Example 9), which sits earlier in the Sharia path; yield is taught here in Example 26.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: sukuk structures need annotated diagrams of
  parties, assets, and cash flows before any computation; Python then models distributions,
  classification, and holder accounting.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing. **Words**: at least 22,000.
  **Diagrams**: at least 10 (one structure diagram per structure at least).
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Account for sukuk using
  the assets and contracts behind them."); `estimatedHours` from the drift test.

## Sharia content rules

This course follows [tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md): the
disclaimer sentence in `overview.md`, the board-decision callout, attributed positions, and the AAOIFI
URL register.

**Board decision points this course must flag** (each with the callout):

1. Whether a given sukuk is acceptable to hold under the institution's Sharia policy.
2. How to treat any purchase-undertaking (wa'd) at a price that is not market value.
3. Which classification a holder uses where the standard leaves a choice tied to the business model.
4. How income from a sukuk later judged non-compliant is treated.

**Differences the course must show** (attributed, not ruled on):

| Point                        | Positions to present                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Holder accounting framework  | AAOIFI FAS 33 (from 1 January 2021) versus IFRS 9-based classification in IFRS jurisdictions         |
| Asset-backed and asset-based | How each is described by the sources the maker cites, and why it matters to holders                  |
| Sukuk standard reform        | AAOIFI draft Sharia Standard 62 is a draft on 2026-10-09, with the views reported for and against it |
| National practice            | Indonesian state sukuk (SBSN) fatwas versus AAOIFI SS 17 (Investment Sukuk)                          |

## Accuracy notes

All facts below were checked on 2026-10-09; sources and excerpts are in
[tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md#source-register).

- AAOIFI FAS 33 Investments in Sukuk, Shares and Similar Instruments: effective 1 January 2021
  (originally 1 January 2020, extended by the board in June 2020); supersedes FAS 25. FAS 34 Financial
  Reporting for Sukuk-holders: listed January 2021, effective date not explicit in the sources found.
  Both rest partly on an AAOIFI press release ([HUMAN] URL check).
- AAOIFI Sharia Standard 17 Investment Sukuk is listed as issued May 2003. Draft Sharia Standard 62 is
  not final: AAOIFI said in April 2025 it is still a draft, and reports in November 2025 and September
  2026 describe it as on hold or under consultation. The course never teaches it as in force.
- Indonesia: PSAK 410 (Akuntansi Sukuk, the old PSAK 110) since the 1 January 2024 renumbering; state
  sukuk fatwas such as 69/DSN-MUI/VI/2008 (SBSN) and 72/DSN-MUI/VI/2008 (SBSN ijarah sale and lease
  back) come from a community list and are confirmed by the maker against an official source or
  removed. PSAK 413 on impairment of Sharia financial assets (covering contracts including those under
  PSAK 410) is reported effective 1 January 2027 by a secondary source; the maker confirms it with IAI
  or words it as "reported".
- Malaysia: sukuk are a Securities Commission Malaysia matter; Bank Negara Malaysia's policy page lists
  no sukuk-specific document. Securities Commission guidance is cited only from `sc.com.my` with an
  access date.
- All sukuk in examples are fictional, with fixture prices and dates.

## Concepts

- **co-01 · sukuk-basics** — certificates representing shares in assets, usufruct, or ventures.
- **co-02 · spv-and-parties** — originator, issuer SPV, trustee, holders, and service agent.
- **co-03 · ijarah-sukuk** — sale and lease back of assets with rentals passed to holders.
- **co-04 · participation-sukuk** — mudarabah and musharakah sukuk with shared outcomes.
- **co-05 · wakalah-and-hybrid-sukuk** — wakalah sukuk and mixed asset pools.
- **co-06 · murabaha-sukuk-and-tradability** — receivable-based sukuk and the limits on trading them
  (attributed).
- **co-07 · asset-backed-vs-asset-based** — what holders can claim.
- **co-08 · distributions** — periodic distributions and their source.
- **co-09 · undertakings** — purchase and sale undertakings at maturity or default.
- **co-10 · holder-accounting-fas33** — classification and measurement of sukuk investments.
- **co-11 · sukuk-holder-reporting-fas34** — reporting to sukuk-holders.
- **co-12 · issuer-accounting** — the originator's and SPV's books.
- **co-13 · ifrs-based-treatment** — IFRS 9 classification in IFRS jurisdictions.
- **co-14 · national-sukuk** — Indonesian PSAK 410 and state sukuk.
- **co-15 · islamic-money-market** — short-term liquidity instruments such as commodity murabaha.

## Worked examples

### Theme A — What a sukuk is (`learning/theme-a-what-a-sukuk-is.md`)

- **ex-01 · sukuk-vs-bond** — compare a bond and an ijarah sukuk cash flow — verify what the holder
  owns in each. (co-01)
- **ex-02 · parties-diagram** — draw the parties (Mermaid) — verify roles. (co-02)
- **ex-03 · ss17-overview** — summarise AAOIFI SS 17 categories with attribution — verify sources.
  (co-01)
- **ex-04 · asset-backed-vs-based** — compare holder claims — verify the table. (co-07)
- **ex-05 · structure-catalogue** — model structures as data — verify fields. (co-01)
- **ex-06 · draft-ss62-status** — record draft SS 62 as not in force — verify the register. (co-01)
- **ex-07 · acceptability-is-a-board-call** — show the callout for holding a sukuk — verify. (co-01)
- **ex-08 · sukuk-glossary** — define terms used later — verify each is used. (co-01)
- **ex-09 · lifecycle-diagram** — draw issuance to maturity (Mermaid) — verify. (co-02)

### Theme B — Structures (`learning/theme-b-structures.md`)

- **ex-10 · ijarah-sukuk-flows** — model sale, lease, rentals, and repurchase — verify cash flows.
  (co-03)
- **ex-11 · ijarah-sukuk-diagram** — draw it (Mermaid) — verify. (co-03)
- **ex-12 · mudarabah-sukuk** — model profit sharing to holders — verify allocation. (co-04)
- **ex-13 · musharakah-sukuk** — model joint venture returns — verify. (co-04)
- **ex-14 · wakalah-sukuk** — model an agency pool with expected return — verify. (co-05)
- **ex-15 · hybrid-pool** — model a pool of ijarah and murabaha assets with a tangibility ratio —
  verify the ratio check. (co-05, co-06)
- **ex-16 · tradability-differences** — present attributed positions on trading receivable-based
  sukuk — verify sources. (co-06)
- **ex-17 · purchase-undertaking** — model the undertaking at maturity (callout on price) — verify.
  (co-09)
- **ex-18 · structure-comparison** — compare structures in one table — verify. (co-03–co-06)

### Theme C — Distributions and cash (`learning/theme-c-distributions.md`)

- **ex-19 · distribution-schedule** — build a distribution schedule from rentals — verify. (co-08)
- **ex-20 · variable-distribution** — compute distributions from venture profit — verify. (co-08)
- **ex-21 · reserve-smoothing** — model a reserve that smooths distributions — verify. (co-08)
- **ex-22 · day-count-fixture** — apply the day-count stated in the fixture terms — verify. (co-08)
- **ex-23 · foreign-currency-sukuk** — receive USD distributions — verify translation. (co-08)
- **ex-24 · default-scenario** — model a missed distribution and the undertaking — verify. (co-09)
- **ex-25 · early-redemption** — redeem early per terms — verify. (co-09)
- **ex-26 · yield-calculation** — compute a simple yield on a purchase price — verify with `Decimal`.
  (co-08)
- **ex-27 · cash-flow-tests** — test schedules over seeded terms — verify totals. (co-08)

### Theme D — Holder accounting (`learning/theme-d-holder-accounting.md`)

- **ex-28 · fas33-categories** — classify sukuk investments under FAS 33 — verify the decision table.
  (co-10)
- **ex-29 · amortised-cost** — measure a sukuk at amortised cost — verify the schedule. (co-10)
- **ex-30 · fair-value-through-equity** — measure through equity — verify. (co-10)
- **ex-31 · fair-value-through-income** — measure through income — verify. (co-10)
- **ex-32 · impairment-preview** — show impairment indicators for a holder — verify. (co-10)
- **ex-33 · fas34-reporting** — produce a sukuk-holder report — verify contents. (co-11)
- **ex-34 · ifrs9-comparison** — classify the same sukuk under IFRS 9 — verify differences. (co-13)
- **ex-35 · psak410-mapping** — map to PSAK 410 — verify. (co-14)
- **ex-36 · holder-postings** — post a year of holder events — verify the trial balance. (co-10)

### Theme E — Issuer side and markets (`learning/theme-e-issuer-and-markets.md`)

- **ex-37 · originator-sale-and-leaseback** — post the originator's entries — verify. (co-12)
- **ex-38 · spv-books** — keep the SPV's books — verify they balance. (co-12)
- **ex-39 · consolidation-of-spv** — decide whether the originator controls the SPV, with the control
  elements restated in the example (both paths teach consolidation earlier, but this course does not
  depend on it) — verify the control test. (co-12)
- **ex-40 · state-sukuk-example** — model an Indonesian state ijarah sukuk with fatwa references
  marked for verification — verify. (co-14)
- **ex-41 · commodity-murabaha-liquidity** — model a short-term placement — verify. (co-15)
- **ex-42 · money-market-calendar** — model maturities across a week — verify liquidity. (co-15)
- **ex-43 · sukuk-register** — keep a register of holdings with structure and standard — verify. (co-01,
  co-10)
- **ex-44 · decision-spotting** — find board decisions in an investment proposal — verify. (co-01)
- **ex-45 · sukuk-pack** — produce holdings, distributions, and holder reports — verify ties. (co-10,
  co-11)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-sukuk-booked-as-bond`, `kata-02-distribution-called-interest`,
  `kata-03-wrong-fas33-category`, `kata-04-draft-standard-applied`, `kata-05-fx-distribution-untranslated`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.
- **Sharia board decision spotting**: at least 6 scenarios.

## Capstone spec

**A sukuk holdings and issuer module.** A structure catalogue; distribution schedules for ijarah,
mudarabah, and wakalah sukuk; FAS 33 classification and measurement; a FAS 34 sukuk-holder report;
the originator and SPV books for one ijarah sukuk; and an IFRS 9 comparison. The `run.yaml` runs a
fixture year and compares the pack.

## Code and harness

- Python standard library only; all prices, terms, and rates are fixtures.

## Read more

- **AAOIFI FAS 33 and FAS 34** — listing on `https://cis.aaoifi.com/ar/?p=381` (human check before
  linking).
- **IFRS 9 Financial Instruments** — `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-9-financial-instruments/`.

## Lineage

- Replaces the 277-word outline measured on 2026-10-09.

## In which paths

- `skills/sharia-accounting` — Phase 7 (Sharia accounting for systems), position 23.
