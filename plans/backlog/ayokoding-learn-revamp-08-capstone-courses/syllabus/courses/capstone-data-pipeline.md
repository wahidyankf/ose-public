# Capstone · Data Pipeline (Capstone, Annotated-Concept)

**Course ID**: `capstone-data-pipeline` · **Format**: Capstone (`format: capstone`); teaching mode:
Annotated-Concept, standard sub-mode.

**Scope note**: Builds one small, governed data pipeline in Python and PostgreSQL: raw ingestion
(bronze), cleaned and checked data (silver), a star schema (gold), SQL that serves it, and a question
answering layer that may only quote gold rows. It integrates `sql-essentials`,
`advanced-sql-and-query-performance`, `data-engineering`, `backend-at-scale`, and
`creating-ai-powered-apps`. It excludes streaming systems, distributed query engines, and training
models.

**Short summary**: You load messy fixture data, refuse the bad rows for stated reasons, publish a
star schema you can prove with hand-computed totals, and answer questions with citations. A second
run of the same batch changes nothing.

## Why this exists · the big idea

- **The problem before the solution**: pipelines fail quietly. A duplicate key, a float total, or a
  re-run that doubles revenue produces confident wrong answers, and a language model on top makes
  them sound authoritative.
- **Keep-this-if-you-forget-everything**: every layer has a stated contract and a check that fails
  loudly, a re-run is safe, and an answer may only repeat what the governed data says, with a
  citation.

## Learning objectives

- Load raw records into an append-only bronze table with batch identifiers and a load manifest.
- Normalise to silver with explicit casting, deduplication with a deterministic tie-break,
  reconciliation to bronze, and a data-quality results table.
- Design a gold star schema with a stated grain, surrogate keys, a type-2 dimension, and an
  idempotent fact load.
- Serve results with window functions, common table expressions, a materialised view, keyset
  pagination, and an index chosen from a query plan.
- Build an answering layer that cites the gold rows it used, answers "insufficient evidence" when
  there are none, and verifies every number it states.
- Prove the batch is idempotent, report freshness against an injected clock, and write a runbook.

## Prerequisites

- **Prior courses (`prerequisites` after the rubric re-run)**: `just-enough-python`, `sql-essentials`,
  `advanced-sql-and-query-performance`, `data-engineering`, `backend-at-scale`,
  `creating-ai-powered-apps`.
- **Edge changes against plan 02's graph**: add `just-enough-python` (rule L1: Python is the main code
  medium). Every other edge is kept because the written course uses it: SQL in themes A to D,
  query plans and indexes in theme D, the layer model in themes A to C, idempotent loads and
  serving patterns from `backend-at-scale`, and grounded answers from `creating-ai-powered-apps` in
  theme E. No edge is removed.
- **Assumed knowledge**: reading Python; writing joins and aggregates; what retrieval-augmented
  generation (RAG) means at the level of a definition.
- **Not required**: a hosted warehouse, a language-model key, or any network access.

## Mode and targets

- **Mode**: Annotated-Concept, standard sub-mode. **Reason**: the value is in layer contracts and
  checks (what each layer promises, how it fails), taught as small worked examples that each prove one
  promise; the SQL and Python syntax is already taught in the prerequisites.
- **Worked examples**: floor 45, band 45–60, five themes of nine; all 45 carry runnable code. About 28
  start a PostgreSQL service; the rest are pure Python so the course stays inside its run-time budget.
- **Words**: at least 23,000. **Diagrams**: at least one per theme (a medallion flow, a star schema, a
  re-run timeline, and an evidence-flow diagram among them).
- **Layout**: standard; theme pages `learning/theme-a-bronze-ingestion.md` to
  `learning/theme-e-grounded-answers-and-operations.md`.
- **Metadata**: `category: data-and-databases`; `format: capstone`; `description` kept from plan 03
  ("Build a data pipeline from raw ingestion to quality checks and a query interface.");
  `estimatedHours` from the drift test (expected 6–9); no `status`.

## Project brief

**You are the data engineer for a small online shop.** Five fixture files arrive in a batch: customers,
products, orders, order lines, and refunds (about 60 rows in all, with planted defects: a duplicate
key, a non-numeric amount, an order with no customer, a negative quantity, a late-arriving file).
Build the pipeline end to end:

1. **Bronze**: every row stored as text with its batch ID and source file; nothing is edited.
2. **Silver**: typed, deduplicated, checked; rejected rows go to a quarantine table with a reason.
3. **Gold**: a star schema (`dim_customer` with history, `dim_product`, `dim_date`, `fact_order_line`)
   whose totals match hand-computed numbers.
4. **Serving**: SQL functions or views for the questions the business asks.
5. **Answers**: a question layer that cites gold rows and says "insufficient evidence" when none
   exist.

All "now" values come from an injected `as_of` timestamp. All randomness is absent. Every query has an
`ORDER BY`.

## Milestones

| #   | Milestone                    | Theme | Checkpoint (capstone run)                   |
| --- | ---------------------------- | ----- | ------------------------------------------- |
| M1  | Bronze loads and audits      | A     | `stage-1-bronze`                            |
| M2  | Silver cleans and reconciles | B     | `stage-2-silver`                            |
| M3  | Gold star schema proven      | C     | `stage-3-gold`                              |
| M4  | Serving queries and a plan   | D     | `stage-4-serve`                             |
| M5  | Grounded answers and re-run  | E     | `stage-5-answers`, `stage-6-rerun`, `tests` |

## Acceptance criteria

| ID    | Criterion                                                                                                           | Proof run         |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ----------------- |
| AC-1  | Bronze row counts equal the file row counts, and updating a bronze row is refused by the database                   | `stage-1-bronze`  |
| AC-2  | Every planted defect lands in quarantine with its reason code; no defect reaches silver                             | `stage-2-silver`  |
| AC-3  | Silver totals reconcile to bronze minus quarantined rows, to the cent                                               | `stage-2-silver`  |
| AC-4  | Gold revenue by month and top customers equal the hand-computed totals in the lesson                                | `stage-3-gold`    |
| AC-5  | Changing a customer's city creates a new `dim_customer` version and keeps the old fact rows pointing at the old one | `stage-3-gold`    |
| AC-6  | The serving queries return the expected rows in the stated order                                                    | `stage-4-serve`   |
| AC-7  | After adding the chosen index, the printed plan uses it                                                             | `stage-4-serve`   |
| AC-8  | Every answer cites at least one gold row, and every number in an answer is derivable from the cited rows            | `stage-5-answers` |
| AC-9  | A question with no matching rows returns "insufficient evidence"                                                    | `stage-5-answers` |
| AC-10 | Running the whole batch twice leaves the same state hash                                                            | `stage-6-rerun`   |
| AC-11 | The unit tests pass                                                                                                 | `tests`           |

## Rubric

Levels: 0 not yet, 1 partial, 2 meets, 3 strong. A pass needs every criterion at 2 or higher and all
acceptance criteria green.

| Criterion         | 2 — meets                                             | 3 — strong                                                                      |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Layer contracts   | Each layer's promise is written and tested            | A broken-contract example is shown failing at the right layer                   |
| Data quality      | Rejections have reason codes and counts               | The fail-batch versus quarantine policy is justified per check                  |
| Dimensional model | Grain is stated; surrogate keys; one type-2 dimension | A change that would break the grain is shown and refused                        |
| Idempotency       | A re-run leaves an identical state hash               | A partial failure mid-batch is shown to recover safely                          |
| Grounding         | Answers cite rows and refuse without evidence         | Injected instruction-like text in a data field is shown not to change behaviour |
| Operability       | Freshness and lineage queries exist                   | The runbook covers a backfill and says when to stop and ask                     |

**Evidence to keep**: stage outputs, the quarantine table with reasons, the plan before and after the
index, the state hash from both runs, and the answer evaluation table.

**Extensions** (not graded): add an incremental load; add a second source system; replace the
template-based answer writer with a real model behind the same guard, outside the harness.

## Concepts

- **co-01 · medallion-layers** — bronze keeps raw, silver is conformed, gold is modelled for use.
- **co-02 · append-only-raw** — raw data is never edited; corrections are new rows.
- **co-03 · load-manifest** — row counts and checksums that prove what arrived.
- **co-04 · quarantine** — rejected rows are kept with a reason, not dropped.
- **co-05 · data-quality-check** — a named, testable rule with a result row.
- **co-06 · reconciliation** — totals at one layer equal totals at the next, plus known rejects.
- **co-07 · grain** — one sentence saying what one fact row represents.
- **co-08 · surrogate-key-and-scd2** — warehouse keys, and history kept as versioned rows.
- **co-09 · idempotent-load** — loading the same batch again changes nothing.
- **co-10 · serving-contract** — a query or function with a stable shape and order.
- **co-11 · grounded-answer** — an answer limited to cited rows, with refusal when evidence is thin.
- **co-12 · freshness-and-lineage** — how old the data is, and where each row came from.

## Worked examples

### Theme A — Bronze ingestion (`learning/theme-a-bronze-ingestion.md`)

- **ex-01 · fixture-files-and-batch-id** — read the five files and stamp a batch ID — verify the batch
  ID and row counts. (co-03)
- **ex-02 · append-only-bronze-table** — create bronze tables with text columns — verify inserts
  succeed. (co-01, co-02)
- **ex-03 · load-manifest** — row counts and a SHA-256 per file — verify the manifest equals the
  expected file. (co-03)
- **ex-04 · no-casting-in-bronze** — keep every value as text — verify a non-numeric amount is stored
  as given. (co-02)
- **ex-05 · quarantine-unparseable-rows** — rows that cannot be split into columns — verify they are
  stored with a reason. (co-04)
- **ex-06 · refuse-updates** — a trigger that rejects `UPDATE` and `DELETE` — verify both are refused.
  (co-02)
- **ex-07 · idempotent-batch-load** — load the same batch twice — verify one copy. (co-09)
- **ex-08 · late-arriving-file** — a file arrives in a second batch — verify both batches coexist.
  (co-03)
- **ex-09 · load-audit-log** — one audit row per load — verify the log. (co-03)

### Theme B — Silver: clean and conform (`learning/theme-b-silver-clean-and-conform.md`)

- **ex-10 · typed-casting-rules** — cast text to typed columns with explicit rules — verify casts and
  rejects. (co-05)
- **ex-11 · dedupe-with-tiebreak** — duplicate keys resolved by latest batch then source order —
  verify the survivor. (co-05)
- **ex-12 · referential-check** — an order with no customer — verify it is quarantined with reason
  `orphan_customer`. (co-05)
- **ex-13 · range-and-domain-checks** — negative quantity and unknown status — verify reason codes.
  (co-05)
- **ex-14 · reconcile-bronze-to-silver** — counts and totals — verify bronze equals silver plus
  quarantine. (co-06)
- **ex-15 · quality-results-table** — one row per check per batch — verify the table. (co-05)
- **ex-16 · fail-or-quarantine** — which checks stop the batch and which quarantine — verify the
  policy table on three defects. (co-04, co-05)
- **ex-17 · schema-drift-detection** — a new column in a source file — verify the batch stops with a
  clear message. (co-05)
- **ex-18 · watermark-for-late-data** — a late row inside and outside the watermark — verify
  acceptance and rejection. (co-06)

### Theme C — Gold: the star schema (`learning/theme-c-gold-star-schema.md`)

- **ex-19 · state-the-grain** — one sentence and a uniqueness constraint that enforces it — verify a
  duplicate grain is refused. (co-07)
- **ex-20 · customer-dimension** — surrogate keys from silver — verify keys are stable across
  re-runs. (co-08)
- **ex-21 · product-dimension** — attributes and a natural-key unique constraint — verify. (co-08)
- **ex-22 · date-dimension** — generated from a start and end date — verify day count and a leap day.
  (co-08)
- **ex-23 · scd2-customer-history** — a changed city creates a new version — verify validity ranges
  do not overlap. (co-08)
- **ex-24 · idempotent-fact-load** — `INSERT … ON CONFLICT` on the grain — verify a second load adds
  no rows. (co-09)
- **ex-25 · refunds-and-net-amount** — net amount as gross minus refunds, in exact decimals — verify
  against a hand-computed value. (co-07)
- **ex-26 · constraints-and-keys** — foreign keys and checks — verify violations are refused. (co-07)
- **ex-27 · hand-computed-totals** — revenue by month and top customers — verify equality with the
  numbers printed in the lesson. (co-06, co-07)

### Theme D — Serving with SQL (`learning/theme-d-serving-with-sql.md`)

- **ex-28 · top-n-with-window** — rank customers by net amount — verify the top three and tie
  handling. (co-10)
- **ex-29 · cohort-with-cte** — first-order month cohorts — verify the cohort table. (co-10)
- **ex-30 · rollup-by-month** — monthly revenue with a grand total row — verify. (co-10)
- **ex-31 · plan-and-index** — `EXPLAIN (COSTS OFF)` before and after an index on fixed data and
  settings — verify the plan text changes as stated. (co-10)
- **ex-32 · materialised-view-refresh** — refresh on a new batch — verify freshness of results. (co-10)
- **ex-33 · keyset-pagination** — page by key, not offset — verify no row repeats or is skipped.
  (co-10)
- **ex-34 · parameterised-queries** — bind parameters from Python — verify a quote in the input is
  harmless. (co-10)
- **ex-35 · serving-function-contract** — a function with a documented return shape and order —
  verify shape and order. (co-10)
- **ex-36 · query-tests-on-fixtures** — tests with expected rows — verify they pass and one planted
  regression is caught. (co-10)

### Theme E — Grounded answers and operations (`learning/theme-e-grounded-answers-and-operations.md`)

- **ex-37 · retrieve-gold-rows** — map a question to a query and fetch rows — verify the rows for
  three questions. (co-11)
- **ex-38 · citation-format** — cite table and key for each row used — verify the format. (co-11)
- **ex-39 · insufficient-evidence** — a question with no rows — verify the refusal text. (co-11)
- **ex-40 · verify-every-number** — recompute each number in an answer from the cited rows — verify a
  tampered number is rejected. (co-11)
- **ex-41 · untrusted-text-in-data** — a product name that says "ignore previous instructions" —
  verify behaviour is unchanged. (co-11)
- **ex-42 · answer-evaluation-set** — ten questions with expected citations — verify the score table.
  (co-11)
- **ex-43 · freshness-report** — age of the newest batch against `as_of` — verify the report. (co-12)
- **ex-44 · rerun-state-hash** — hash the state after one and two runs — verify equality. (co-09)
- **ex-45 · runbook-and-lineage** — a lineage query from an answer back to bronze rows, and the
  runbook text — verify the lineage rows. (co-12)

## Drilling

- **Katas** (each has `before/` and `after/`): `kata-01-duplicate-key-in-silver`,
  `kata-02-float-money-in-gold` (binary floats versus `numeric`), `kata-03-non-idempotent-load`,
  `kata-04-answer-without-citation`, `kata-05-missing-index` (a plan that scans).
- Other drill sections follow tech-docs/002 counts.

## Code and harness

- **Toolchain**: `python`, with `services: [postgres]` on the units that need the database.
  Dependencies: one hash-locked `requirements.lock` for a PostgreSQL driver (the driver and its
  transitive packages), installed when the environment image is built, never at run time.
- **Units**: 45 example units, 5 kata units, 1 capstone unit holding the reference pipeline (`bronze`,
  `silver`, `gold`, `serve`, `answers`, `ops` modules and SQL files).
- **Capstone runs**: `stage-1-bronze` through `stage-5-answers`, `stage-6-rerun`, `tests`
  (`python3 -m unittest`, output ignored).
- **Determinism**: `as_of` is passed in; no `now()` in SQL; every query orders by a total order;
  money is `numeric`; plan text is taken with `EXPLAIN (COSTS OFF)` after `ANALYZE` on fixed data and
  is valid for the pinned image (a change of the PostgreSQL image digest means re-recording).
- **Run-time budget**: PostgreSQL start-up dominates; the executor measures it
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#run-time-budget)).

## Accuracy notes

- Medallion (bronze, silver, gold) naming comes from Databricks' documentation, used here as a
  vocabulary and not as a product: `https://docs.databricks.com/aws/en/lakehouse/medallion`, read at
  authoring time. The course states that the layer names are conventions, not a standard.
- Kimball dimensional modelling (grain, surrogate keys, type-2 history): Kimball and Ross, _The Data
  Warehouse Toolkit_: a stable reference.
- PostgreSQL behaviour (`ON CONFLICT`, window functions, `EXPLAIN (COSTS OFF)`, triggers): PostgreSQL 18
  documentation at the version in the plan 05 catalog.
- The prompt-injection example uses a constructed string and states the risk class; it cites the OWASP
  Top 10 for LLM Applications by name only.

## Read more

- **The Data Warehouse Toolkit** — Ralph Kimball and Margy Ross (Wiley). Dimensional modelling.
- **Designing Data-Intensive Applications** — Martin Kleppmann (O'Reilly). Idempotency and derived
  data.
- **PostgreSQL documentation: EXPLAIN** — the PostgreSQL Global Development Group. How to read a plan.

## Lineage

This course replaces a 321-word outline. Its five steps became the five milestones; its reminder that
a model must not invent values absent from gold became theme E.

## In which paths

- `careers/interview-ready/software-engineer` — extension, "Integrative capstones".
- `careers/immediately-effective/software-engineer` — extension, "Integrative capstones".
- `careers/fundamentally-strong/software-engineer` — extension, "Integrative capstones".
