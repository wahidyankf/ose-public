# Islamic Contract Modeling for Systems (By Example)

**Course ID**: `islamic-contract-modeling-for-systems` · **Format**: By Example.

**Scope note**: Models the main Islamic finance contracts in Python as state machines with evidence,
schedules, and postings: murabaha, ijarah and ijarah ending in ownership, mudarabah, musharakah and
diminishing musharakah, salam, istisna'a, wakalah investment agency, tawarruq, qard, and wa'd. Each
contract shows its AAOIFI Sharia Standard and Financial Accounting Standard, the Indonesian PSAK
Syariah and DSN-MUI references, and the dates that change it (FAS 51 and FAS 52 from 1 January 2027).
It excludes zakah (`zakah-computation-and-reporting-for-systems`), sukuk
(`sukuk-and-islamic-capital-markets-accounting`), and database design (`sharia-ledger-system-architecture`).
It never issues Sharia rulings.

**Short summary**: In Islamic finance the order of events is part of the contract: a bank must own an
asset before it sells it, and profit comes from trade, leasing, or shared ventures, not from lending
money for money. You build contract models that enforce that order, keep the evidence, and post the
right entries under the standard in force on each date.

## Why this exists · the big idea

- **The problem before the solution**: a system that models a murabaha as a loan with a different name
  can post a sale before the bank owns the asset, compute "interest" by mistake, and lose the evidence
  an auditor or Sharia board needs.
- **Keep-this-if-you-forget-everything**: model each contract as a sequence of evidenced states; the
  postings follow from the state, and the system refuses any step whose evidence is missing.

## Learning objectives

- Model each contract as a state machine with required evidence per transition.
- Generate payment, rental, and profit schedules with `Decimal` and explicit rounding.
- Post contract events under the AAOIFI FAS in force on the event date, with the PSAK Syariah
  equivalent noted.
- Switch mudarabah, musharakah, salam, and istisna'a accounting from FAS 3/4/7/10 to FAS 51/52 on
  1 January 2027 through dated policy, not code edits.
- Identify the contract points that need a Sharia board decision and record those decisions as data.

## Prerequisites

- **Prior courses**: `sharia-accounting-and-aaoifi-standards` (frameworks, dates, and board decisions),
  `journal-entries-and-posting-mechanics` (the posting engine reused here),
  `accounts-receivable-and-order-to-cash` (receivable schedules that murabaha changes),
  `lease-and-intangible-asset-accounting` (lessee and lessor accounting that ijarah changes),
  `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: By Example. **Reason**: contract sequencing and evidence rules are best learned by running a
  model and watching it refuse an out-of-order step; each contract is a natural run of short examples.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50 (one state diagram per
  contract at least).
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Model Islamic contracts such as
  murabaha in software with their full sale evidence."); `estimatedHours` from the drift test.

## Sharia content rules

This course follows [tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md): the
disclaimer sentence in `overview.md`, the board-decision callout, attributed positions, and the AAOIFI
URL register.

**Board decision points this course must flag** (each with the callout):

1. Whether the customer may act as the bank's agent to buy the murabaha asset, and what evidence is
   enough to show the bank owned and held the asset first.
2. How late payment is handled (for example a charity undertaking) and whether any amount may be kept.
3. Whether and how an early-settlement rebate is given.
4. Which profit recognition method is used for deferred-payment sales where sources allow more than one.
5. Who bears which maintenance and insurance costs in an ijarah, where a contract departs from the
   standard's default.
6. Profit-sharing ratios and loss treatment in mudarabah and musharakah, including what counts as
   misconduct or negligence by the manager.

**Differences the course must show** (attributed, not ruled on; the maker sources each position):

| Point                               | Positions to present                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| Binding promise in murabaha         | AAOIFI SS 8 position versus other scholarly views, with sources                                 |
| Ijarah lessor accounting            | AAOIFI FAS 32 (from 1 January 2021) versus IFRS 16-based reporting in IFRS jurisdictions        |
| Tawarruq                            | AAOIFI SS 30 conditions versus jurisdictions or scholars who restrict organized tawarruq        |
| Mudarabah and musharakah accounting | FAS 3/FAS 4 until 31 December 2026 versus FAS 51 from 1 January 2027; PSAK 405/406 in Indonesia |
| Schools of Islamic jurisprudence    | At least one contract feature where classical schools differ, each view with its source         |

## Accuracy notes

All facts below were checked on 2026-10-09; sources and excerpts are in
[tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md#source-register).

| Contract                              | AAOIFI SS (listed issue) | AAOIFI FAS (effective)                                                                               | PSAK Syariah (since 1 Jan 2024) |
| ------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| Murabaha                              | SS 8 (May 2000)          | FAS 28 (1 January 2019; supersedes FAS 2 and FAS 20)                                                 | PSAK 402                        |
| Ijarah and ijarah ending in ownership | SS 9 (May 2000)          | FAS 32 (1 January 2021; supersedes FAS 8)                                                            | PSAK 407                        |
| Mudarabah                             | SS 13 (May 2002)         | FAS 3 until 31 December 2026; FAS 51 from 1 January 2027                                             | PSAK 405                        |
| Musharakah, diminishing musharakah    | SS 12 (May 2002)         | FAS 4 until 31 December 2026; FAS 51 from 1 January 2027                                             | PSAK 406                        |
| Salam and parallel salam              | SS 10 (May 2001)         | FAS 7 until 31 December 2026; FAS 52 from 1 January 2027                                             | PSAK 403                        |
| Istisna'a and parallel istisna'a      | SS 11 (May 2001)         | FAS 10 until 31 December 2026; FAS 52 from 1 January 2027; FAS 53 issued, effective date unconfirmed | PSAK 404                        |
| Wakalah investment agency             | SS 46 (May 2011)         | FAS 31 (listed January 2021)                                                                         | —                               |
| Tawarruq                              | SS 30 (November 2006)    | —                                                                                                    | —                               |
| Wa'd                                  | —                        | FAS 38 (1 January 2022)                                                                              | PSAK 411                        |

- FAS 51 and FAS 52 supersession of FAS 3/4 and FAS 7/10 rests on AAOIFI press releases ([HUMAN]
  check of each aaoifi.com URL in the register).
- DSN-MUI fatwas (for example 04/DSN-MUI/IV/2000 and 111/DSN-MUI/IX/2017 on murabahah,
  09/DSN-MUI/IV/2000 and 112/DSN-MUI/IX/2017 on ijarah, 115/DSN-MUI/IX/2017 on mudharabah,
  114/DSN-MUI/IX/2017 on syirkah, 73/DSN-MUI/XI/2008 on musyarakah mutanaqishah) come from a community
  list on 2026-10-09; the maker confirms each number and title against an official DSN-MUI, MUI, or OJK
  source or removes it.
- Bank Negara Malaysia policy documents (murabahah 23 December 2013, ijarah 19 August 2016, mudarabah
  and musyarakah 20 April 2015, istisna' 7 January 2016, tawarruq 28 December 2018, wa'd 2 February
  2017, qard 4 August 2016) are cited from `https://www.bnm.gov.my/banking-islamic-banking`.
- AAOIFI full texts are members-only; the course states requirements at the level the public metadata
  and the cited sources support, and paragraph-level claims need a source the maker can quote.

## Concepts

- **co-01 · contract-as-state-machine** — states, transitions, and evidence per transition.
- **co-02 · murabaha** — cost-plus sale with deferred payment.
- **co-03 · ijarah** — leasing an owned asset; ijarah ending in ownership.
- **co-04 · mudarabah** — capital from one party, management by the other, profit shared, loss on
  capital.
- **co-05 · musharakah** — joint capital and shared profit and loss; diminishing musharakah.
- **co-06 · salam** — advance payment for future delivery; parallel salam.
- **co-07 · istisna** — manufacture or construction to order; parallel istisna'a.
- **co-08 · wakalah-investment** — investment through an agent for a fee.
- **co-09 · tawarruq** — commodity purchase and resale for liquidity.
- **co-10 · qard-and-wad** — benevolent loans and promises.
- **co-11 · schedules** — payment, rental, and profit schedules with explicit rounding.
- **co-12 · dated-accounting-policy** — the FAS in force on the event date.
- **co-13 · evidence** — documents and records that prove ownership, possession, and delivery.
- **co-14 · board-decisions-in-code** — decisions referenced by contracts and checked at runtime.
- **co-15 · contract-postings** — entries per contract event.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · state-machine-base** — build a small state machine class — verify allowed and refused
  transitions. (co-01)
- **ex-02 · evidence-record** — attach evidence documents to transitions — verify a missing document
  refuses the step. (co-01, co-13)
- **ex-03 · murabaha-promise** — record the customer's promise to buy — verify state. (co-02)
- **ex-04 · murabaha-bank-purchase** — record the bank's purchase from the supplier — verify the asset
  posting. (co-02, co-15)
- **ex-05 · murabaha-possession** — record possession evidence — verify the sale is refused without
  it. (co-02, co-13)
- **ex-06 · murabaha-sale** — sell at cost plus a disclosed markup — verify the receivable and deferred
  profit. (co-02, co-15)
- **ex-07 · murabaha-state-diagram** — draw the murabaha states (Mermaid) — verify. (co-02)
- **ex-08 · murabaha-schedule** — build the instalment schedule with `Decimal` — verify totals. (co-11)
- **ex-09 · deferred-profit-recognition** — recognise profit over the term by the configured method —
  verify the method comes from policy. (co-02, co-14)
- **ex-10 · murabaha-collection** — post an instalment — verify. (co-15)
- **ex-11 · late-payment-charity** — route a late-payment amount to charity (callout) — verify it never
  reaches income. (co-02, co-14)
- **ex-12 · early-settlement-rebate** — apply a rebate only when a board decision allows it (callout) —
  verify. (co-02, co-14)
- **ex-13 · ijarah-asset-purchase** — buy the asset to lease — verify. (co-03)
- **ex-14 · ijarah-rentals** — post rental income — verify. (co-03, co-15)
- **ex-15 · ijarah-depreciation** — depreciate the leased asset — verify. (co-03)
- **ex-16 · ijarah-maintenance** — post major maintenance to the lessor by default (callout for
  departures) — verify. (co-03, co-14)
- **ex-17 · imbt-transfer** — transfer ownership at the end by a separate sale or gift — verify. (co-03)
- **ex-18 · ijarah-state-diagram** — draw the ijarah states (Mermaid) — verify. (co-03)
- **ex-19 · qard** — record a benevolent loan with no return — verify any return is refused. (co-10)
- **ex-20 · wad-record** — record a promise and when it binds — verify. (co-10)
- **ex-21 · policy-lookup** — look up the FAS for an event date — verify. (co-12)
- **ex-22 · contract-postings-table** — list postings per murabaha and ijarah event — verify. (co-15)
- **ex-23 · interest-guard** — refuse any posting to an interest income account — verify. (co-15)
- **ex-24 · fixture-contracts** — load fixture contracts — verify validation. (co-01)
- **ex-25 · beginner-portfolio** — run a small murabaha and ijarah portfolio for a year — verify the
  trial balance. (co-01–co-15)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · mudarabah-setup** — record capital from the investor — verify. (co-04)
- **ex-27 · mudarabah-profit-share** — share profit by the agreed ratio — verify. (co-04)
- **ex-28 · mudarabah-loss** — charge a loss to capital, not to the manager, absent misconduct
  (callout) — verify. (co-04, co-14)
- **ex-29 · mudarabah-fas3-vs-fas51** — post the same events before and after 1 January 2027 — verify
  the policy switch. (co-04, co-12)
- **ex-30 · musharakah-setup** — record joint capital — verify. (co-05)
- **ex-31 · musharakah-profit-and-loss** — share profit by ratio and loss by capital — verify. (co-05)
- **ex-32 · diminishing-musharakah** — buy out units and charge rent on the bank's share — verify the
  schedule. (co-05, co-11)
- **ex-33 · diminishing-musharakah-diagram** — draw ownership over time (Mermaid) — verify. (co-05)
- **ex-34 · musharakah-fas4-vs-fas51** — post across the 2027 change — verify. (co-05, co-12)
- **ex-35 · salam-advance** — pay in advance for future goods — verify. (co-06)
- **ex-36 · salam-delivery** — receive the goods — verify. (co-06)
- **ex-37 · parallel-salam** — sell matching goods to a third party — verify both contracts stay
  independent. (co-06)
- **ex-38 · salam-fas7-vs-fas52** — post across the 2027 change — verify. (co-06, co-12)
- **ex-39 · istisna-contract** — record a manufacture-to-order contract — verify. (co-07)
- **ex-40 · istisna-progress** — recognise revenue over time by the stated method — verify. (co-07)
- **ex-41 · parallel-istisna** — subcontract the work — verify. (co-07)
- **ex-42 · istisna-fas10-vs-fas52** — post across the 2027 change — verify. (co-07, co-12)
- **ex-43 · wakalah-investment** — invest through an agent for a fee — verify the agent's fee and the
  investor's return. (co-08)
- **ex-44 · wakalah-performance-incentive** — record an incentive above an expected return (callout) —
  verify. (co-08, co-14)
- **ex-45 · tawarruq-flow** — record commodity purchase and resale — verify the evidence chain. (co-09)
- **ex-46 · tawarruq-differences** — present attributed positions on organized tawarruq — verify each
  cites a source. (co-09)
- **ex-47 · contract-catalogue** — list all contracts with standards and dates — verify against the
  register. (co-12)
- **ex-48 · board-decision-references** — make contracts reference decision records — verify a missing
  record refuses activation. (co-14)
- **ex-49 · contract-reporting** — report balances by contract type — verify. (co-15)
- **ex-50 · intermediate-portfolio** — run all contract types for a year — verify. (co-01–co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · event-sourced-contracts** — store contract events and rebuild state — verify. (co-01)
- **ex-52 · evidence-integrity** — hash evidence documents — verify tamper detection. (co-13)
- **ex-53 · out-of-order-events** — reject events received out of order — verify. (co-01)
- **ex-54 · restructuring-murabaha** — reschedule without increasing the debt (callout) — verify the
  amount owed does not grow. (co-02, co-14)
- **ex-55 · default-and-collateral** — record default and collateral sale — verify. (co-02)
- **ex-56 · ijarah-impairment-preview** — show impairment of the leased asset — verify. (co-03)
- **ex-57 · ijarah-variable-rent** — reset rent by a benchmark with stated bounds — verify. (co-03)
- **ex-58 · musharakah-exit** — exit a venture — verify the final settlement. (co-05)
- **ex-59 · multi-currency-murabaha** — sell in a foreign currency — verify revaluation entries. (co-02)
- **ex-60 · schedule-property-checks** — over seeded contracts, schedules sum to totals — verify.
  (co-11)
- **ex-61 · psak-mapping** — tag each posting with its PSAK 4xx reference — verify. (co-12)
- **ex-62 · fas53-placeholder** — model development contracts with an unconfirmed effective date —
  verify the lookup warns. (co-07, co-12)
- **ex-63 · contract-api** — validate contract API payloads — verify. (co-01)
- **ex-64 · contract-postings-rules** — express postings as versioned rules — verify. (co-15)
- **ex-65 · policy-migration-2027** — migrate open contracts on 1 January 2027 — verify the
  transition report. (co-12)
- **ex-66 · sharia-audit-trail** — produce the evidence trail for one contract — verify. (co-13)
- **ex-67 · board-decision-spotting** — find decisions in a product spec — verify the list. (co-14)
- **ex-68 · contract-tests** — test refused transitions for every contract — verify. (co-01)
- **ex-69 · contract-diagram-set** — produce all state diagrams (Mermaid) — verify. (co-01)
- **ex-70 · deferred-profit-reconciliation** — reconcile deferred profit to schedules — verify. (co-02)
- **ex-71 · contract-dashboard-data** — compute portfolio views — verify. (co-15)
- **ex-72 · jurisdiction-variants** — run one product under AAOIFI and PSAK settings — verify
  differences are labelled. (co-12)
- **ex-73 · product-design-review** — review a new product against the rules — verify. (co-01–co-14)
- **ex-74 · review-checklist** — final checklist — verify. (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-sale-before-ownership`, `kata-02-late-charge-to-income`,
  `kata-03-loss-charged-to-manager`, `kata-04-parallel-salam-linked`,
  `kata-05-wrong-fas-after-2027`, `kata-06-schedule-rounding-drift`,
  `kata-07-interest-account-posted`, `kata-08-restructure-increases-debt`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.
- **Sharia board decision spotting**: at least 6 scenarios.

## Capstone spec

**An Islamic contract engine.** State machines with evidence for murabaha, ijarah ending in ownership,
mudarabah, diminishing musharakah, salam, and istisna'a; schedules; versioned posting rules keyed to
the FAS in force on each event date; board-decision references; and a transition report for
1 January 2027. The `run.yaml` runs a fixture portfolio across 2026 and 2027 and compares postings,
schedules, and the transition report.

## Code and harness

- Python standard library only (`decimal`, `dataclasses`, `enum`, `hashlib`); all contracts are
  fictional fixtures.

## Read more

- **AAOIFI Sharia Standards and FAS listing** — `https://cis.aaoifi.com/ar/?p=381` (human check before
  linking).
- **Bank Negara Malaysia — Islamic banking policy documents** — `https://www.bnm.gov.my/banking-islamic-banking`.

## Lineage

- Replaces the 313-word outline measured on 2026-10-09; the archived 2026-08-16 Sharia extension plan
  is lineage only.

## In which paths

- `skills/sharia-accounting` — Phase 7 (Sharia accounting for systems), position 21.
