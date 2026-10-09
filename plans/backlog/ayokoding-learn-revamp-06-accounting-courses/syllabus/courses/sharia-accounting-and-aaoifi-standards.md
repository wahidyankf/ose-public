# Sharia Accounting and AAOIFI Standards (Annotated-Concept)

**Course ID**: `sharia-accounting-and-aaoifi-standards` · **Format**: Annotated-Concept.

**Scope note**: Teaches the frameworks a Sharia-aware accounting system must follow: the Sharia
principles that shape accounting, AAOIFI's Financial Accounting Standards (FAS) and Sharia Standards
(SS), the Indonesian framework (DSN-MUI fatwas and PSAK Syariah), the Malaysian approach (Bank Negara
Malaysia policy documents with IFRS-based reporting), how standards change over time, and how to encode
a framework choice as reviewed policy data. It excludes contract mechanics in depth
(`islamic-contract-modeling-for-systems`), zakah computation (`zakah-computation-and-reporting-for-systems`),
and sukuk (`sukuk-and-islamic-capital-markets-accounting`). It never issues Sharia rulings.

**Short summary**: Before you write a line of Sharia-aware ledger code, you must know which rulebook
applies, from which date, and who decides the questions the rulebook leaves open. This course maps the
standards, shows where scholars and jurisdictions differ, and turns the framework choice into policy
data that a Sharia board approves.

## Why this exists · the big idea

- **The problem before the solution**: engineers who hard-code one reading of one standard ship systems
  that are wrong in another jurisdiction, wrong after a standard changes, or quietly make choices that
  only a Sharia board may make.
- **Keep-this-if-you-forget-everything**: name the framework, the version, and the effective date for
  every rule; where a rule needs a ruling, record the Sharia board's decision instead of guessing.

## Learning objectives

- Explain the Sharia principles that shape Islamic accounting (prohibition of riba, avoidance of
  excessive gharar and maysir, asset-backed trade, and profit-and-loss sharing) without issuing rulings.
- Navigate AAOIFI's FAS and SS sets and state which FAS applies on a given date, including FAS 51 and
  FAS 52 from 1 January 2027.
- Map Indonesia's renumbered PSAK Syariah (PSAK 401–412 and PSAK 459 since 1 January 2024) and its
  DSN-MUI fatwas to the AAOIFI topics they cover.
- Compare AAOIFI, Indonesian, and Malaysian approaches for the same transaction and present differing
  scholarly and jurisdictional positions with attribution.
- Encode a framework choice and board decisions as versioned policy data.

## Prerequisites

- **Prior courses**: `accrual-accounting-and-revenue-recognition` (recognition timing that Sharia
  standards modify), `financial-reporting-standards-ifrs-vs-gaap` (frameworks as versioned policy data,
  which this course extends to a third framework), `just-enough-python`.
- **Assumed knowledge**: none about Islamic law; every term is explained when first used.

## Mode and targets

- **Mode**: Annotated-Concept, standard. **Reason**: the course is about frameworks, sources, and
  differences of opinion; annotated source tables and comparisons carry most of it, with Python for the
  effective-date register and the policy model. The no-code sub-mode was rejected because the reader
  must leave able to encode a framework choice.
- **Worked examples**: floor 45 in five themes; at least 23 code-bearing (comparative content, as in
  `financial-reporting-standards-ifrs-vs-gaap`). **Words**: at least 22,000. **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Compare the main Sharia
  accounting frameworks before you encode a policy."); `estimatedHours` from the drift test.

## Sharia content rules

This course follows [tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md):

- `overview.md` carries the fixed disclaimer sentence ("This course explains standards and design
  choices; it does not issue Sharia rulings.") and the board-decision callout pattern.
- Every Sharia position is attributed (AAOIFI, DSN-MUI, Bank Negara Malaysia, or a named scholar or
  school) with a source; no position is presented as the only valid one when sources differ.
- Every AAOIFI URL used enters the AAOIFI URL register for human verification before merge.

**Board decision points this course must flag** (each with the callout):

1. Which framework the entity follows (AAOIFI, a national framework, or IFRS with Sharia overlays).
2. Whether to adopt a new AAOIFI standard early where early adoption is permitted.
3. How income judged non-compliant is identified and sent to charity.
4. Which scholarly position the entity follows where AAOIFI and a national authority differ.

**Differences the course must show** (attributed, not ruled on):

| Point                                      | Positions to present                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Framework                                  | AAOIFI FAS as the accounting framework (for example Bahrain) versus IFRS with Sharia governance overlays (for example Malaysia) |
| Investment account holders                 | Quasi-equity under AAOIFI FAS 45 (from 1 January 2026) versus liabilities or equity under IFRS-based reporting                  |
| National numbering and content             | Indonesia's PSAK 4xx standards versus the AAOIFI FAS on the same topic                                                          |
| Schools of Islamic jurisprudence (madhhab) | Where the classical schools differ on a contract feature used later in the path, shown with the source of each view             |

## Accuracy notes

All facts below were checked on 2026-10-09; sources and excerpts are in
[tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md#source-register).

- AAOIFI FAS 51 Participatory Ventures (issued 10 November 2025) and FAS 52 Deferred Delivery Sales
  (issued 31 December 2025) take effect on 1 January 2027 and replace FAS 3/FAS 4 and FAS 7/FAS 10
  respectively; until then FAS 3, 4, 7, and 10 apply. Supersession rests on AAOIFI press releases and is
  a [HUMAN] check.
- AAOIFI FAS 1 (revised) applies from 1 January 2024 (the AAOIFI CIS page still shows 1 January 2023;
  the board's deferral announcement says 2024). FAS 39 Financial Reporting for Zakah applies from
  1 January 2023 and supersedes FAS 9. FAS 45, 46, and 47 apply from 1 January 2026.
- FAS 53 Istisna'a-Based Development Contracts: issued, effective date not confirmed on 2026-10-09; the
  course names it only as "issued, check the effective date".
- Draft Sharia Standard 62 on sukuk is not final on 2026-10-09; the course never teaches it as in force.
- Indonesia renumbered PSAK Syariah effective 1 January 2024 (PSAK 401 presentation, 402 murabahah,
  403 salam, 404 istishna', 405 mudharabah, 406 musyarakah, 407 ijarah, 408 Sharia insurance, 409
  zakat and infak/sedekah, 410 sukuk, 411 wa'd, 412 wakaf, 459 Sharia banking), per the IAI table. The
  old PSAK 109 (zakat) is now PSAK 409; the new PSAK 109 is the IFRS 9 equivalent. A new PSAK 401 on
  presentation and disclosure was approved on 21 October 2025, effective 1 January 2027.
- DSN-MUI fatwa numbers come from a community list; only fatwa 41/DSN-MUI/III/2004 was confirmed on
  OJK's site. Every fatwa number the course uses is checked against an official DSN-MUI, MUI, or OJK
  source by the maker, or removed.
- Bank Negara Malaysia policy-document issue dates come from `https://www.bnm.gov.my/banking-islamic-banking`
  (accessed 2026-10-09).
- AAOIFI's own site (aaoifi.com) returned unrelated content to the automated fetcher on 2026-10-09;
  AAOIFI facts rest on `cis.aaoifi.com` pages and AAOIFI press-release titles, and every aaoifi.com URL
  needs a human browser check before it is linked.

## Concepts

- **co-01 · sharia-principles-for-accounting** — riba, gharar, maysir, asset-backing, and
  profit-and-loss sharing, explained with sources.
- **co-02 · sources-and-authority** — standard setters (AAOIFI), national authorities (DSN-MUI, BNM),
  and an institution's Sharia board.
- **co-03 · aaoifi-structure** — FAS, SS, governance, auditing, and ethics standards.
- **co-04 · effective-dating** — standards in force by date, including the 2027 transitions.
- **co-05 · indonesian-framework** — DSN-MUI fatwas, PSAK Syariah numbering, and OJK oversight.
- **co-06 · malaysian-framework** — BNM policy documents with IFRS-based financial reporting.
- **co-07 · framework-comparison** — the same transaction under different frameworks.
- **co-08 · ifi-statements** — the statements of an Islamic financial institution under FAS 1 (revised).
- **co-09 · investment-accounts** — quasi-equity, pools, and off-balance-sheet funds (FAS 45–47).
- **co-10 · charity-and-non-compliant-income** — separate funds and disclosure.
- **co-11 · risk-reserves** — profit equalisation and investment risk reserves (FAS 35).
- **co-12 · differences-of-opinion** — attributing positions across schools and jurisdictions.
- **co-13 · board-decisions** — what only a Sharia board may decide, and how a system records it.
- **co-14 · policy-as-data** — framework, version, and board decisions stored as configuration.

## Worked examples

### Theme A — Principles and authority (`learning/theme-a-principles-and-authority.md`)

- **ex-01 · why-a-different-rulebook** — contrast an interest-bearing loan with a sale-based financing
  — verify the cash flows and the different accounting events. (co-01)
- **ex-02 · riba-in-ledger-terms** — show how a prohibited interest charge would appear as a posting —
  verify a policy check can find it. (co-01)
- **ex-03 · gharar-and-uncertainty** — annotate contract terms that standards treat as excessive
  uncertainty, with attribution — verify each claim cites a source. (co-01)
- **ex-04 · asset-backing** — trace a financing to the asset behind it — verify the ownership chain.
  (co-01)
- **ex-05 · profit-and-loss-sharing** — compare fixed return and shared outcome — verify the
  allocation. (co-01)
- **ex-06 · authority-map** — draw AAOIFI, national authorities, regulators, and the Sharia board
  (Mermaid) — verify. (co-02)
- **ex-07 · what-a-board-decides** — list decision types with the callout — verify none is decided by
  the course. (co-13)
- **ex-08 · sources-ladder** — rank source types used in the course — verify the ladder matches
  tech-docs/004. (co-02)
- **ex-09 · glossary-as-data** — model Arabic and Indonesian terms with English glosses — verify every
  term is used later. (co-01)

### Theme B — AAOIFI standards (`learning/theme-b-aaoifi-standards.md`)

- **ex-10 · aaoifi-standard-families** — tabulate FAS, SS, governance, and auditing standards — verify.
  (co-03)
- **ex-11 · fas-register** — model FAS with topics, effective dates, and supersession in Python —
  verify. (co-04)
- **ex-12 · as-of-lookup** — answer "which FAS applies on 2026-12-31 and on 2027-01-01" for
  mudarabah and salam — verify FAS 3/7 then FAS 51/52. (co-04)
- **ex-13 · fas-1-revised** — show the 2024 FAS 1 presentation changes — verify the date note.
  (co-04, co-08)
- **ex-14 · fas-vs-ss** — explain why each contract has both an SS and a FAS — verify the pairing
  table. (co-03)
- **ex-15 · draft-is-not-standard** — show how draft SS 62 is recorded as "draft, not in force" —
  verify the register refuses it as applicable. (co-04)
- **ex-16 · unknown-effective-date** — record FAS 53 with an unknown effective date — verify the lookup
  warns. (co-04)
- **ex-17 · transition-plan-2027** — plan a ledger change for FAS 51/52 — verify the checklist. (co-04,
  co-14)
- **ex-18 · aaoifi-url-register** — keep AAOIFI links with a human-check flag — verify unchecked links
  block publication in the example's own check. (co-03)

### Theme C — National frameworks (`learning/theme-c-national-frameworks.md`)

- **ex-19 · psak-renumbering** — map old and new PSAK Syariah numbers — verify the 109/409 collision.
  (co-05)
- **ex-20 · psak-to-aaoifi** — map PSAK 4xx to AAOIFI FAS topics — verify. (co-05, co-07)
- **ex-21 · dsn-mui-fatwas** — map fatwas to contracts with a verification flag — verify unverified
  numbers are marked. (co-05)
- **ex-22 · psak-401-2027** — show the new presentation standard's date — verify the register. (co-04,
  co-05)
- **ex-23 · bnm-policy-documents** — list BNM contract policy documents with dates — verify. (co-06)
- **ex-24 · ifrs-with-overlays** — show how an IFRS reporter applies Sharia governance — verify the
  layering diagram. (co-06)
- **ex-25 · framework-comparison-table** — compare one murabaha under AAOIFI, PSAK, and IFRS-based
  reporting — verify each cell cites a source. (co-07)
- **ex-26 · jurisdiction-config** — model jurisdiction settings in Python — verify. (co-14)
- **ex-27 · differences-of-opinion** — present two attributed positions on one contract feature —
  verify neither is called the ruling. (co-12)

### Theme D — Statements of an Islamic financial institution (`learning/theme-d-ifi-statements.md`)

- **ex-28 · ifi-statement-set** — list the statements and their purpose — verify. (co-08)
- **ex-29 · investment-account-holders** — classify investment accounts as quasi-equity under FAS 45 —
  verify the balance sheet layout. (co-09)
- **ex-30 · pools-and-allocation** — allocate pool profit between the bank and account holders —
  verify. (co-09)
- **ex-31 · off-balance-sheet-funds** — show restricted investment funds under FAS 46 — verify they
  stay off the balance sheet. (co-09)
- **ex-32 · charity-fund** — move non-compliant income to a charity fund — verify the separate
  statement. (co-10)
- **ex-33 · charity-board-decision** — flag who decides what is non-compliant (callout) — verify the
  decision record. (co-10, co-13)
- **ex-34 · risk-reserves** — compute profit equalisation and investment risk reserves — verify the
  movements. (co-11)
- **ex-35 · zakah-disclosure-preview** — show where FAS 39 disclosures sit — verify. (co-08)
- **ex-36 · ifi-statements-in-python** — produce a simplified statement set — verify ties. (co-08)

### Theme E — Encoding a framework (`learning/theme-e-encoding-a-framework.md`)

- **ex-37 · policy-model** — model framework, version, and options per entity — verify validation.
  (co-14)
- **ex-38 · board-decision-record** — record a board decision with date, scope, and reference — verify
  the policy cannot change without one. (co-13, co-14)
- **ex-39 · policy-versioning** — version policy by effective date — verify lookups across a change.
  (co-14)
- **ex-40 · third-framework-in-design** — add AAOIFI to the multi-framework design from the IFRS
  course — verify the adjustment ledger. (co-07, co-14)
- **ex-41 · policy-tests** — test each policy combination — verify the matrix. (co-14)
- **ex-42 · standard-change-impact** — trace a standard change to affected posting rules — verify the
  impact report. (co-04)
- **ex-43 · decision-spotting** — find board decisions hidden in a requirements document — verify the
  list. (co-13)
- **ex-44 · audit-of-policy** — produce the policy audit trail — verify. (co-14)
- **ex-45 · framework-pack** — produce the framework pack for an entity — verify every rule names its
  source and date. (co-04, co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-wrong-fas-on-date`, `kata-02-draft-treated-as-final`,
  `kata-03-psak-109-confused`, `kata-04-policy-changed-without-decision`,
  `kata-05-unattributed-position`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.
- **Sharia board decision spotting**: at least 6 short scenarios; the reader marks each point that
  needs a board decision and the answer explains why, without ruling on it.

## Capstone spec

**A framework register and policy service.** An effective-dated register of AAOIFI FAS, PSAK Syariah,
and the IFRS-based option; a policy model per entity with board-decision records; an as-of lookup; an
impact report for the 2027 transitions; and a statement set that labels every rule with its source.
The `run.yaml` runs lookups on fixed dates and compares the pack.

## Code and harness

- Python standard library only. The registers are data files in the example directories; nothing is
  fetched from the network.

## Read more

- **AAOIFI standards listing** — `https://cis.aaoifi.com/ar/?p=381` (AAOIFI CIS site; human check
  before linking).
- **IAI PSAK and ISAK renumbering table** — Ikatan Akuntan Indonesia.
- **Bank Negara Malaysia — Islamic banking policy documents** — `https://www.bnm.gov.my/banking-islamic-banking`.

## Lineage

- Replaces the 285-word outline measured on 2026-10-09. The 2026-08-16 Sharia extension plan
  (archived under `plans/done/`) cited FAS 9, which FAS 39 superseded from 1 January 2023; nothing is
  copied from it.

## In which paths

- `skills/sharia-accounting` — Phase 7 (Sharia accounting for systems), position 20.
