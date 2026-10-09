# Islamic Contract-Based Transaction Flows (By Example)

**Course ID**: `islamic-contract-based-transaction-flows` · **Format**: By Example.

**Scope note**: Builds ERP flows for Murabaha, Ijarah, Salam, Istisna', profit-sharing partnerships (Musharaka and Mudaraba), Wakalah, Tawarruq, and promises (wa'd), each under a selectable policy profile. It excludes rulings, Sukuk accounting, and zakat. Each flow lists its board decision points.

**Short summary**: Contract-aware flows keep the agreed terms, approvals, asset evidence, and settlement trace.

## Why this exists · the big idea

- **The problem before the solution**: Generic order and invoice flows lose the contract terms that make a transaction what it is, so evidence of ownership, delivery, and profit rules is missing.
- **Keep-this-if-you-forget-everything**: The flow follows the contract's required sequence, and the system records the evidence and the open questions.

## Learning objectives

After this course you can:

1. run a cost-plus sale (Murabaha) with an ownership-before-sale guard and a profit schedule.
2. run a lease (Ijarah) with rental schedules, ownership evidence, and end-of-term options.
3. run advance-payment and manufacturing contracts (Salam and Istisna') with delivery and progress evidence.
4. split profit and loss in partnerships (Musharaka and Mudaraba) under a stated rule.
5. trace amendments, promises, agency, and sequences such as Tawarruq, and list every decision point for the board.

## Prerequisites

- **Prior courses**: `procure-to-pay-systems`, `order-to-cash-systems`, `sharia-compliant-erp-design`, `just-enough-python`.
- **Assumed knowledge**: Procurement and sales flows from this path and the contract model from the Sharia design course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `sukuk-and-islamic-capital-markets-accounting`.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- AAOIFI FAS 28 Murabaha and Murabaha-related contracts (effective 1 January 2019, supersedes FAS 2 and FAS 20) and FAS 32 Ijarah (effective 1 January 2021, supersedes FAS 8).
- AAOIFI FAS 7 Salam and FAS 10 Istisna'a stay in force until FAS 52 Deferred Delivery Sales takes effect on 1 January 2027; FAS 3 Mudaraba and FAS 4 Musharaka stay in force until FAS 51 Participatory Ventures takes effect on 1 January 2027. Verify the supersession wording before relying on it; present it as pending, not done.
- AAOIFI Sharia Standards 8 (Murabahah), 9 (Ijarah), 10 (Salam), 11 (Istisna'a), 12 (Sharikah), 13 (Mudarabah), 30 (Tawarruq), and 46 (Wakalah bi al-Istithmar), cited by number and title.
- International Islamic Fiqh Academy Resolutions 40-41 (2/5 and 3/5) on keeping a promise and Murabaha to the purchase orderer, and Resolution 179 on tawarruq. Schools and bodies differ on how binding a promise is and on organized tawarruq; show these as sourced rows.
- DSN-MUI fatwas on Murabahah, Mudharabah, Musyarakah, and Ijarah, and the PSAK Syariah numbers (402, 403, 404, 405, 406, 407), are cited only after the numbers are checked against primary documents.
- Bank Negara Malaysia policy documents on Murabahah, Ijarah, Musyarakah, Mudarabah, Wakalah, Tawarruq, Istisna', and Wa'd, cited with issue dates.

## Concepts

- **co-01 · murabaha-sale** — a sale at cost plus a disclosed profit.
- **co-02 · promise-wa'd** — a promise to buy or sell and how binding it is under each policy.
- **co-03 · ownership-before-sale** — the seller owns and holds the asset before selling it.
- **co-04 · ijarah-lease** — a lease with rental and asset ownership kept by the lessor.
- **co-05 · ijarah-ownership-transfer** — end-of-term transfer arrangements and their evidence.
- **co-06 · salam-advance-payment** — full payment now for goods delivered later.
- **co-07 · istisna'-manufacturing** — a contract to manufacture to specification with staged payments.
- **co-08 · musharaka-profit-sharing** — joint capital with profit shared by agreed ratio and loss by capital.
- **co-09 · mudaraba-capital-and-loss** — capital from one party and work from another.
- **co-10 · wakalah-agency** — acting for another under a fee.
- **co-11 · tawarruq-sequence** — the buy, sell, and resell sequence and the checks on it.
- **co-12 · contract-amendment-trace** — recording a change to agreed terms.
- **co-13 · late-payment-handling** — how late charges are treated, flagged for the board.
- **co-14 · asset-evidence-and-possession** — records that prove ownership, possession, and delivery.
- **co-15 · deferred-profit-recognition** — recognizing profit over the contract term.
- **co-16 · contract-state-machine** — the allowed sequence of states for each contract type.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each contract flow and each policy difference is a short scenario with a checkable schedule, sequence, or posting, which By Example teaches as many runs over a shared engine.

| Target             | Value                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                     |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                         |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                       |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                    |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only (no lockfile) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Murabaha basics** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · murabaha-cost-plus-schedule** (Python 3.14) — compute a cost-plus price and an instalment schedule, then verify the instalments sum to the price.
- **Cluster: Ownership before sale** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · possession-guard** (Python 3.14) — refuse to sell an asset the seller has not received, then verify the refusal names the missing evidence.
- **Cluster: Ijarah basics** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · ijarah-rental-schedule** (Python 3.14) — generate a rental schedule and depreciation for the lessor, then verify rentals and depreciation post on schedule.

### Intermediate (28 examples)

- **Cluster: Salam** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · salam-advance-and-delivery** (Python 3.14) — record an advance payment and a later delivery, then verify delivery cannot precede payment.
- **Cluster: Istisna'** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · istisna-progress-billing** (Python 3.14) — bill a manufacturing contract by progress milestones, then verify billed amounts never exceed the contract value.
- **Cluster: Wakalah** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · wakalah-fee-and-agency-trace** (Python 3.14) — record agent actions and a fee, then verify every agent action links to the principal's authorization.

### Advanced (25 examples)

- **Cluster: Profit sharing** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · musharaka-profit-split-loss-by-capital** (Python 3.14) — split profit by ratio and loss by capital share, then verify the split sums to the result.
- **Cluster: Tawarruq and promises** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · tawarruq-sequence-check** (Python 3.14) — validate the order of the three trades, then verify a reversed sale to the original seller is flagged for the board.
- **Cluster: Amendments and late payment** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · amendment-trace-and-charity-flag** (Python 3.14) — amend a term mid-contract and record a late payment, then verify the amendment trace and a board flag on the late charge.

## Capstone spec

Build a contract-flow engine with policy profiles and state machines for each contract type; every flow posts under a selectable standard and lists its decision points for the board. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds six sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: trace an amendment through procurement, fulfilment, and accounting evidence; list the decision points in a described flow; compare two policy profiles.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: guard ownership before sale; generate a rental schedule; split profit and loss.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.
6. **`## Sharia board decision spotting`**: at least 6 scenarios where the reader names the decision a Sharia board must make.

## Sharia content rules

- Follow plan 06's Sharia rules SC1 to SC8: cite AAOIFI and recognized fatwa bodies with the document and its date; never issue a ruling; flag every point that needs a Sharia board decision with the board-decision warning callout.
- Show madhhab and jurisdiction differences only as sourced rows; an unsourced row is omitted.
- Use the current standards named in the plan's source register; a standard that is issued but not yet effective (FAS 51 and FAS 52, effective 1 January 2027) is stated as pending, not as done.
- Every aaoifi.com or cis.aaoifi.com URL has a ticked human-verification box in the AAOIFI URL register before the pull request is marked ready; an unticked URL is cited by standard number and title without a link.

Points this course must flag for a Sharia board decision, each with the board-decision callout of plan 06's rules (`{{< callout type="warning" >}}`, bold label `**Sharia board decision needed.**`, and the closing sentence "This course does not choose; your institution's Sharia board does."):

- how binding a promise (wa'd) may be and when the sale may be concluded.
- whether a tawarruq structure, classical or organized, is acceptable to the board.
- ownership-transfer variants in a lease.
- parallel Salam or Istisna' contracts and guarantee terms.
- any late-payment charge and where the proceeds go.

The course follows the Sharia content rules of plan 06 (SC1 to SC8), restated in the plan's technical design with the ERP source register. The root `overview.md` carries the disclaimer sentence once. Where jurisdictions differ, the course carries one sourced difference table and omits any row it cannot source.

## Lineage

- The archived syllabus file [islamic-contract-based-transaction-flows](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/islamic-contract-based-transaction-flows.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/sharia-erp` — Phase 6 of 6 (Sharia ERP design) · position 29 of 30.
