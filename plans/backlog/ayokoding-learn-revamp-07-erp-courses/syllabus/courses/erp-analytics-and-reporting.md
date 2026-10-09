# ERP Analytics and Reporting (By Example)

**Course ID**: `erp-analytics-and-reporting` · **Format**: By Example.

**Scope note**: Designs ERP reports with a stated grain, source, freshness, control totals, and reconciliation limits, including snapshots, slowly changing dimensions, aging, and row-level filters. It excludes BI tool selection and large-scale data engineering.

**Short summary**: A report must state its grain, source, freshness, and how it reconciles.

## Why this exists · the big idea

- **The problem before the solution**: Two reports show different revenue because one counts invoices and the other counts shipments, and nobody wrote down which.
- **Keep-this-if-you-forget-everything**: State the grain, tie the total to a control total, and show the freshness.

## Learning objectives

After this course you can:

1. state and test a report's grain and avoid double counting.
2. tie report totals to GL and subledger control totals.
3. build aging buckets, running balances, and period snapshots in SQL.
4. model slowly changing dimensions for reporting.
5. apply row-level filters, show freshness, and pin metrics with golden tests.

## Prerequisites

- **Prior courses**: `record-to-report-systems`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: SQL from the database course and the close process from record-to-report-systems.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 78 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on window functions, materialized views, and row-level security.
- Kimball and Ross, The Data Warehouse Toolkit (Wiley), for grain and slowly changing dimensions.

## Concepts

- **co-01 · grain** — what one row of a report means.
- **co-02 · fact-and-dimension** — measures and the context they are sliced by.
- **co-03 · control-total** — a number the report must tie to.
- **co-04 · freshness** — how recent the data is.
- **co-05 · reconciliation-limit** — known reasons a report cannot match exactly.
- **co-06 · cut-off-visibility** — showing the date the data was cut.
- **co-07 · snapshot-vs-live** — a frozen period view versus current data.
- **co-08 · slowly-changing-dimension** — tracking attribute changes over time.
- **co-09 · report-lineage** — where each figure comes from.
- **co-10 · materialized-view-refresh** — precomputed results and when they refresh.
- **co-11 · window-function-reporting** — running totals and rankings in SQL.
- **co-12 · aging-report** — balances grouped by days overdue.
- **co-13 · drill-through** — moving from a total to its rows.
- **co-14 · row-level-filtering** — restricting rows by company or role.
- **co-15 · semantic-metric-definition** — one agreed definition per metric.
- **co-16 · report-testing** — golden tests that pin report results.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Reporting rules (grain, snapshot, aging, filters) are SQL-and-numbers cases with checkable totals, which By Example teaches as many short queries that tie to control totals.

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

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Grain** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · grain-mismatch-double-count** (PostgreSQL 18) — join invoices to shipments and show the double count, then verify aggregating at the right grain removes it.
- **Cluster: Control totals** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · total-ties-to-gl** (PostgreSQL 18) — compare a revenue report with the GL account total, then verify the difference is zero or fully explained.
- **Cluster: Aging buckets** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · ar-aging** (PostgreSQL 18) — group open receivables into aging buckets as of a fixed date, then verify bucket totals equal the open total.

### Intermediate (28 examples)

- **Cluster: Snapshot vs live** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · period-snapshot** (PostgreSQL 18) — freeze a month-end balance snapshot, then verify later postings do not change it.
- **Cluster: Slowly changing dimensions** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · scd2-customer** (PostgreSQL 18) — track customer region changes as type 2 history, then verify a past report uses the region valid at the time.
- **Cluster: Window functions** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · running-balance** (PostgreSQL 18) — compute a running balance with a window function, then verify the last row equals the account balance.

### Advanced (25 examples)

- **Cluster: Freshness and refresh** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · refresh-and-stale-flag** (PostgreSQL 18) — refresh a materialized view and mark staleness, then verify a stale view is flagged until refreshed.
- **Cluster: Row-level access** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · row-filter-by-company** (PostgreSQL 18) — apply a company filter through a policy, then verify a session sees only its company's rows.
- **Cluster: Metric definitions and tests** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · metric-golden-tests** (PostgreSQL 18) — pin a revenue metric with golden rows, then verify a changed definition fails the test.

## Capstone spec

Build a reporting mart over GL and subledger facts with aging, snapshots, row-level filters, freshness flags, and golden tests tied to control totals. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: explain why two revenue reports differ; choose snapshot or live; define a metric.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: find a double count; build aging buckets; write a running balance.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Report dates are fixed inputs; no CURRENT_DATE in examples.

## Lineage

- The archived syllabus file [erp-analytics-and-reporting](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/erp-analytics-and-reporting.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 5 of 5 (Extending and operating the ERP) · position 27 of 27.
- `skills/sharia-erp` — Phase 5 of 6 (Extending and operating the ERP) · position 27 of 30.
