# Sharia-Compliant ERP Design (Annotated-Concept)

**Course ID**: `sharia-compliant-erp-design` · **Format**: Annotated-Concept.

**Scope note**: Designs a configurable architecture in which contract types, policy profiles, jurisdictions, standards, and Sharia board decisions are data, not constants. It excludes the individual contract flows (islamic-contract-based-transaction-flows) and zakat (zakat-and-sharia-compliance-modules). It never issues a Sharia ruling.

**Short summary**: Sharia-oriented ERP keeps contract terms and jurisdictional policy configurable, and sends the decisions to a qualified board.

## Why this exists · the big idea

- **The problem before the solution**: Hard-coded rules bake one school, one jurisdiction, and one standard edition into the code, so a board decision or a new standard means a code release.
- **Keep-this-if-you-forget-everything**: The system records terms, evidence, and decisions; a qualified Sharia board decides.

## Learning objectives

After this course you can:

1. model a contract-type registry and policy profiles per jurisdiction.
2. keep accounting standards as versioned reference data with effective dates.
3. capture contract terms and flag points that need a Sharia board decision.
4. record board decisions with scope, date, and version, and apply them by effective date.
5. produce dual views (for example AAOIFI and a local standard) and an audit pack, and roll out policy changes under change control.

## Prerequisites

- **Prior courses**: `multi-company-and-multi-currency-erp`, `islamic-contract-modeling-for-systems`, `sharia-accounting-and-aaoifi-standards`, `just-enough-python`.
- **Assumed knowledge**: Islamic contract modelling and AAOIFI standards from the accounting courses; multi-entity handling from this path.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `sharia-ledger-system-architecture`.
- **Outside this plan (must already be filled)**: `islamic-contract-modeling-for-systems`, `sharia-accounting-and-aaoifi-standards`, `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- AAOIFI standards are cited by number, title, and effective date; full texts are members-only and are not reproduced.
- AAOIFI FAS 1 (revised) is effective 1 January 2024; AAOIFI's own pages differ on the year, so cite the standard's own effective date and flag the stale field.
- Indonesian PSAK Syariah was renumbered effective 1 January 2024 (PSAK 401 to 412 and 459); the old PSAK 109 on zakat is now PSAK 409 and the new PSAK 109 is IFRS 9.
- Bank Negara Malaysia Islamic policy documents are cited with their issue dates; the Shariah Contract Framework discussion paper (11 November 2024) is a review in progress, not final.

## Concepts

- **co-01 · contract-type-registry** — the list of supported contract types with their required terms.
- **co-02 · policy-profile** — a named bundle of rules for a jurisdiction and product.
- **co-03 · jurisdiction-configuration** — country and regulator settings kept as data.
- **co-04 · board-decision-log** — recorded decisions with scope, date, and reference.
- **co-05 · decision-point-flag** — a marker that routes a question to the board.
- **co-06 · standards-reference-data** — standards as versioned rows with effective dates.
- **co-07 · effective-policy** — the policy and standards version active on a date.
- **co-08 · contract-term-capture** — recording the agreed terms and their evidence.
- **co-09 · term-validation-for-review** — checks that flag terms for board review without ruling on them.
- **co-10 · asset-evidence** — proof of ownership, possession, and delivery where a contract needs it.
- **co-11 · audit-pack** — an exportable bundle of terms, decisions, and postings.
- **co-12 · sharia-operations-segregation** — separating who configures, who decides, and who operates.
- **co-13 · dual-reporting** — reporting under more than one standard from one record.
- **co-14 · configuration-over-constants** — settings in data with change control.
- **co-15 · policy-change-control** — versioned rollout, approval, and rollback of policy changes.
- **co-16 · non-ruling-boundary** — what the system and this course will not decide.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: The design is made of cooperating configuration, policy, and audit concepts that read best as models, tables, and small validators side by side. Annotated-concept fits; the course is code-demonstrable, so it is not a no-code course.

| Target                         | Value                                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                        |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                   |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                              |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                     |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                             |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only (no lockfile) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Registry and profiles** (page `learning/theme-a-registry-and-profiles.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · contract-type-registry-load** (Python 3.14) — load a registry of contract types and their required terms, then verify an unknown type is refused.
- **Theme B: Jurisdiction configuration** (page `learning/theme-b-jurisdiction-configuration.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · profile-per-jurisdiction** (Python 3.14) — resolve the policy profile for a product and jurisdiction, then verify two jurisdictions give different, reported outcomes.
- **Theme C: Standards as data** (page `learning/theme-c-standards-as-data.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · standards-reference-table** (Python 3.14) — store standards with number, title, effective date, and status, then verify the lookup by date returns the edition in force.

### Themes 4 to 6 (18 examples)

- **Theme D: Term capture** (page `learning/theme-d-term-capture.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · murabaha-term-capture** (Python 3.14) — capture the terms of a cost-plus sale, then verify missing required terms are listed.
- **Theme E: Decision points** (page `learning/theme-e-decision-points.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · flag-for-board** (Python 3.14) — flag a term combination for board review, then verify the flag states the question and never an answer.
- **Theme F: Decision log** (page `learning/theme-f-decision-log.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · board-decision-record** (Python 3.14) — record a board decision with scope and effective date, then verify later contracts use it and earlier ones do not.

### Themes 7 to 9 (15 examples)

- **Theme G: Dual reporting** (page `learning/theme-g-dual-reporting.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · aaoifi-and-local-gaap-views** (Python 3.14) — post one contract event and render it under two standards, then verify both views reconcile to the same cash.
- **Theme H: Policy change control** (page `learning/theme-h-policy-change-control.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · policy-version-rollout** (Python 3.14) — roll out a policy change with approval and rollback, then verify the old version still explains old postings.
- **Theme I: Audit pack** (page `learning/theme-i-audit-pack.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · audit-pack-export** (Python 3.14) — export terms, decisions, and postings for a contract, then verify the pack reproduces from stored data.

## Capstone spec

Build a configurable compliance core with a contract registry, policy profiles, a standards table, a board decision log, dual-view postings, and an audit pack, with every board question flagged and none answered. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds six sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: explain why configuration is safer than constants; decide which questions go to the board; compare two jurisdiction profiles.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: look up the standard in force on a date; flag a term for board review; roll back a policy version.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.
6. **`## Sharia board decision spotting`**: at least 6 scenarios where the reader names the decision a Sharia board must make.

## Sharia content rules

- Follow plan 06's Sharia rules SC1 to SC8: cite AAOIFI and recognized fatwa bodies with the document and its date; never issue a ruling; flag every point that needs a Sharia board decision with the board-decision warning callout.
- Show madhhab and jurisdiction differences only as sourced rows; an unsourced row is omitted.
- Use the current standards named in the plan's source register; a standard that is issued but not yet effective (FAS 51 and FAS 52, effective 1 January 2027) is stated as pending, not as done.
- Every aaoifi.com or cis.aaoifi.com URL has a ticked human-verification box in the AAOIFI URL register before the pull request is marked ready; an unticked URL is cited by standard number and title without a link.

Points this course must flag for a Sharia board decision, each with the board-decision callout of plan 06's rules (`{{< callout type="warning" >}}`, bold label `**Sharia board decision needed.**`, and the closing sentence "This course does not choose; your institution's Sharia board does."):

- whether a given contract structure is permissible at all.
- which standards set and which edition applies to a product in a jurisdiction.
- treatment of late-payment charges and income the board considers non-permissible.
- any change to a policy profile after go-live.

The course follows the Sharia content rules of plan 06 (SC1 to SC8), restated in the plan's technical design with the ERP source register. The root `overview.md` carries the disclaimer sentence once. Where jurisdictions differ, the course carries one sourced difference table and omits any row it cannot source.

## Lineage

- The archived syllabus file [sharia-compliant-erp-design](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/sharia-compliant-erp-design.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/sharia-erp` — Phase 6 of 6 (Sharia ERP design) · position 28 of 30.
