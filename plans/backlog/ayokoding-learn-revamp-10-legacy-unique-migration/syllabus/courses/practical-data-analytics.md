# Practical Data Analytics (Annotated-Concept)

**Course ID**: `practical-data-analytics` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/data/analytics` (5 files, 33,893 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches exploring, cleaning, aggregating, and visualizing tabular data as a standalone analytical skill. It excludes building a rerunning pipeline, already in `data-engineering`.

**Short summary**: Before a pipeline moves data anywhere, someone has to look at it, clean it, and answer a question with it; this course teaches that step.

## Why this exists · the big idea

- **The problem before the solution**: `data-engineering` teaches pipelines that move and validate data on a schedule; nobody teaches the one-off analytical skill of exploring a dataset, cleaning it, and answering a question from it.
- **Keep-this-if-you-forget-everything**: Look at the data's distribution before you trust its summary statistic.

## Learning objectives

After this course you can:

1. load, inspect, and profile a tabular dataset to find missing values, outliers, and type problems.
2. clean and reshape a dataset for analysis without silently discarding information.
3. compute group-wise aggregations and summary statistics and state their limits.
4. produce a small set of plots that answer a stated analytical question.
5. write a short analytical report that states its question, method, finding, and caveats.

## Prerequisites

- **Prior courses**: `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Basic descriptive statistics.
- **Language medium (prerequisite rubric rule L1)**: every example is Python 3.14 using only the standard library (`csv`, `statistics`, `sqlite3`) to keep the toolchain hash-locked without a third-party data-science stack, so `just-enough-python` and `sql-essentials` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Every dataset used is a synthetic, committed fixture; no example downloads a real dataset at run time.
- Standard-library statistics functions are cited from the Python documentation, dated at writing time.

## Concepts

- **co-01 · data-profiling** — a first systematic look at a dataset's shape and quality.
- **co-02 · missing-value** — a gap in the data and the policy for handling it.
- **co-03 · outlier** — a value far from the rest, and when to investigate rather than discard it.
- **co-04 · data-type-coercion** — converting a column to its correct type safely.
- **co-05 · tidy-data** — one observation per row, one variable per column.
- **co-06 · group-by-aggregation** — summarizing data within categories.
- **co-07 · summary-statistic** — mean, median, and spread, and what each hides.
- **co-08 · sampling-bias** — a dataset that does not represent what it claims to.
- **co-09 · join-for-analysis** — combining two tables to answer a question neither answers alone.
- **co-10 · visual-encoding** — choosing a chart type that matches the question.
- **co-11 · misleading-chart** — a chart that visually implies more than the data supports.
- **co-12 · reproducible-analysis** — a script that regenerates the same report from the same input.
- **co-13 · analytical-question** — stating the question before touching the data.
- **co-14 · caveat-and-limitation** — naming what the analysis does not prove.
- **co-15 · correlation-vs-causation** — why a found correlation is not a found cause.
- **co-16 · report-structure** — question, method, finding, caveats, in that order.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Each analytical skill (profiling, cleaning, aggregating, visualizing, reporting) is a themed cluster better taught with worked diagrams and a handful of deep examples than a long undifferentiated list.

| Target                         | Value                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                         |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                    |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                               |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                      |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                              |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                   |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                            |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: data-and-databases`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Profiling a dataset** (page `learning/theme-a-profiling-a-dataset.md`; ex-01 to ex-05, 5 examples).
- **Theme B: Cleaning and type coercion** (page `learning/theme-b-cleaning-and-type-coercion.md`; ex-06 to ex-10, 5 examples).
- **Theme C: Tidy data and reshaping** (page `learning/theme-c-tidy-data-and-reshaping.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: Group-by aggregation** (page `learning/theme-d-group-by-aggregation.md`; ex-16 to ex-21, 6 examples).
- **Theme E: Summary statistics and their limits** (page `learning/theme-e-summary-statistics-and-their-limits.md`; ex-22 to ex-27, 6 examples).
- **Theme F: Joins for analysis** (page `learning/theme-f-joins-for-analysis.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: Visual encoding** (page `learning/theme-g-visual-encoding.md`; ex-34 to ex-38, 5 examples).
- **Theme H: Misleading charts and bias** (page `learning/theme-h-misleading-charts-and-bias.md`; ex-39 to ex-43, 5 examples).
- **Theme I: Reporting and caveats** (page `learning/theme-i-reporting-and-caveats.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Analyze a synthetic retail-sales fixture end to end: profile it, clean it, join it with a product reference table, aggregate by category and month, produce three plots, and write a one-page report with stated caveats. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide a missing-value policy for a given dataset; spot a misleading chart and redesign it; separate a found correlation from a claimed cause.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: profile a messy fixture and list its quality problems; write a group-by aggregation with a stated caveat; fix a chart that implies causation.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

No example reaches the network; every fixture dataset is committed under the example's own directory.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
