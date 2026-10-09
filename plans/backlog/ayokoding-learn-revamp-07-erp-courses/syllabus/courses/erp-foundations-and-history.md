# ERP Foundations and History (Annotated-Concept)

**Course ID**: `erp-foundations-and-history` · **Format**: Annotated-Concept.

**Scope note**: Explains what an ERP system records and how the idea grew from stock-control rules to integrated suites, vendor-neutral. It excludes data modelling (erp-conceptual-data-model) and module design (erp-module-map-and-architecture).

**Short summary**: ERP is one coordinated record of enterprise events, not a vendor label.

## Why this exists · the big idea

- **The problem before the solution**: Separate systems for sales, stock, purchasing, and finance give each team a different answer to the same question, and reconciling them costs more than running them.
- **Keep-this-if-you-forget-everything**: Integration is a data and control problem before it is a product problem.

## Learning objectives

After this course you can:

1. explain what an ERP system records and why one shared record beats several copies.
2. trace the lineage from reorder-point control to MRP, MRP II, and ERP, and say what each step added.
3. separate master data from transaction data and name the system of record for a given fact.
4. measure integration debt in a toy two-system company by counting reconciliation breaks.
5. compare package, suite, best-of-breed, and custom build with explicit trade-offs and no vendor winner.

## Prerequisites

- **Prior courses**: `just-enough-python`.
- **Assumed knowledge**: Basic business processes (selling, buying, paying) and basic programming.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Orlicky, Material Requirements Planning (McGraw-Hill, 1975) for the MRP lineage; Wight, Manufacturing Resource Planning: MRP II (Oliver Wight, 1984) for MRP II.
- The ERP label is commonly credited to the Gartner Group in the early 1990s. Verify the attribution before stating it; hedge it if no primary source is found.
- Stable, non-dynamic domain facts for records, ownership, and integration debt. Vendor behaviour is out of scope.

## Concepts

- **co-01 · enterprise-event** — a business occurrence recorded once with who, what, when, and why.
- **co-02 · shared-record** — a fact that more than one module reads without keeping its own copy.
- **co-03 · process-boundary** — the handoff between two accountable activities.
- **co-04 · master-data** — durable shared identity data such as customer, item, and supplier.
- **co-05 · transaction-data** — time-bound evidence of an event, such as an order line.
- **co-06 · integration-debt** — reconciliation work caused by disconnected records.
- **co-07 · system-of-record** — the one source accountable for a given fact.
- **co-08 · reorder-point-control** — the pre-MRP rule: reorder when on-hand falls to a threshold.
- **co-09 · mrp-lineage** — materials requirements planning: netting demand down a bill of materials.
- **co-10 · mrp-ii** — MRP plus capacity, shop-floor, and financial feedback.
- **co-11 · erp-scope** — one data model across planning, finance, HR, sales, and service.
- **co-12 · deployment-models** — on-premises, hosted, and cloud suites, and what each changes for the engineer.
- **co-13 · build-vs-buy** — the decision frame for package, suite, best-of-breed, or custom build.
- **co-14 · customization-debt** — local change that raises upgrade and control cost.
- **co-15 · data-migration** — moving legacy records into a shared model with reconciliation.
- **co-16 · license-boundary** — the clean-room rule: descriptions here never reproduce vendor-proprietary structures.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: The ideas are framing concepts (records, ownership, lineage, trade-offs) that need several angles each. Annotated-concept gives per-theme clusters and mixed media, where one runnable snippet per idea would be thin.

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

- **Theme A: One record or many** (page `learning/theme-a-one-record-or-many.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · two-systems-disagree** (Python 3.14) — run a sales and a finance system that each keep a customer balance, then verify the report lists exactly the mismatched customers.
- **Theme B: Master and transaction data** (page `learning/theme-b-master-and-transaction-data.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · classify-fields** (Python 3.14) — classify the fields of an order as master or transaction data, then verify no transaction field sits on the master record.
- **Theme C: Events as the unit** (page `learning/theme-c-events-as-the-unit.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · event-log-replay** (Python 3.14) — replay a list of enterprise events to rebuild stock and balances, then verify the same events always give the same state.

### Themes 4 to 6 (18 examples)

- **Theme D: From reorder point to MRP** (page `learning/theme-d-from-reorder-point-to-mrp.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · reorder-vs-netting** (Python 3.14) — compare a reorder-point rule with MRP netting on one demand pattern, then verify MRP plans dependent demand earlier.
- **Theme E: Systems of record** (page `learning/theme-e-systems-of-record.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · owner-map** (Python 3.14) — declare the system of record for ten facts and detect a field written by two owners, then verify the conflict report names both.
- **Theme F: Integration debt** (page `learning/theme-f-integration-debt.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · debt-meter** (Python 3.14) — count reconciliation breaks as systems multiply, then verify breaks grow with the number of system pairs.

### Themes 7 to 9 (15 examples)

- **Theme G: Build, buy, extend** (page `learning/theme-g-build-buy-extend.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · decision-matrix** (Python 3.14) — score three options against weighted criteria, then verify a changed weight changes the ranking and the output says why.
- **Theme H: Migration to a shared model** (page `learning/theme-h-migration-to-a-shared-model.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · migration-recon** (Python 3.14) — load legacy customers into a shared master with duplicate detection, then verify counts and control totals reconcile.
- **Theme I: Deployment and ownership** (page `learning/theme-i-deployment-and-ownership.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · upgrade-impact** (Python 3.14) — mark customizations and compute which would block an upgrade, then verify each blocker is listed with its owner.

## Capstone spec

Model one small company first as three isolated systems and then as one shared event log. The capstone prints both reconciliation reports and the inputs for a one-page build-or-buy memo. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: spot integration debt in a described company; choose a system of record for contested facts; judge a customization request.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: classify order fields; find fields with two owners; rebuild balances from events.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- History claims (dates, who coined ERP) verified or hedged; no vendor-proprietary structure reproduced (license boundary).

## Lineage

- The archived syllabus file [erp-foundations-and-history](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-foundations-and-history.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 1 of 5 (ERP model and architecture) · position 1 of 27.
- `skills/sharia-erp` — Phase 1 of 6 (ERP model and architecture) · position 1 of 30.
