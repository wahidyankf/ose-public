---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

Sinar Abadi is fictional, and every number in this course belongs to its twelve receipts, its Saturday surveys, and its vendor slides. The shop sells rice, sugar, oil, and tea to a neighborhood that pays cash, returns goods, and answers surveys on Saturday mornings. Before any pipeline moves this data anywhere, someone has to look at it, clean it, and answer the owner's question from it. This course teaches that step: the one-off analytical skill of exploring a dataset, cleaning it without silently discarding information, aggregating it honestly, plotting it plainly, and writing the one page the decision needs.

## Why this exists -- the big idea

**The problem before the solution**: `data-engineering` teaches pipelines that move and validate data on a schedule; nobody teaches the one-off analytical skill of exploring a dataset, cleaning it, and answering a question from it. **Keep this if you forget everything else**: look at the data's distribution before you trust its summary statistic.

## What you will be able to do

After this course you can profile a tabular dataset for shape, types, missing values, duplicates, and extremes; clean text, numbers, and dates under stated policies and handle missing values three honest ways; reshape wide tables long and back without loss; group by one or two keys, filter and rank groups, and flag small piles; summarize with centers, spread, quartiles, and correlation while stating each number's limits; join sales to catalogs and customers in SQL with orphan and fanout checks; encode answers as bars, histograms, lines, and scatters with fixed scales; detect truncated axes, cherry-picked windows, survivorship and sampling bias, and causal arrows; and write a one-page report ordered as question, method, finding, and caveats.

## How this course is organized

[Learning](/en/learn/courses/practical-data-analytics/learning/overview) holds 48 worked examples in nine themes: [Theme A](/en/learn/courses/practical-data-analytics/learning/theme-a-profiling-a-dataset) (Examples 1-5) profiles the fixture, [Theme B](/en/learn/courses/practical-data-analytics/learning/theme-b-cleaning-and-type-coercion) (Examples 6-10) cleans it, [Theme C](/en/learn/courses/practical-data-analytics/learning/theme-c-tidy-data-and-reshaping) (Examples 11-15) tidies it, [Theme D](/en/learn/courses/practical-data-analytics/learning/theme-d-group-by-aggregation) (Examples 16-21) groups it, [Theme E](/en/learn/courses/practical-data-analytics/learning/theme-e-summary-statistics-and-their-limits) (Examples 22-27) summarizes it, [Theme F](/en/learn/courses/practical-data-analytics/learning/theme-f-joins-for-analysis) (Examples 28-33) joins it, [Theme G](/en/learn/courses/practical-data-analytics/learning/theme-g-visual-encoding) (Examples 34-38) draws it, [Theme H](/en/learn/courses/practical-data-analytics/learning/theme-h-misleading-charts-and-bias) (Examples 39-43) distrusts the drawing, and [Theme I](/en/learn/courses/practical-data-analytics/learning/theme-i-reporting-and-caveats) (Examples 44-48) writes the page. The [capstone](/en/learn/courses/practical-data-analytics/learning/capstone/overview) profiles, cleans, joins, aggregates, plots, and reports a retail fixture end to end, and [drilling](/en/learn/courses/practical-data-analytics/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: just-enough-python for the `csv`, `statistics`, and `sqlite3` standard-library modules every example runs on, and sql-essentials for the SELECT, JOIN, GROUP BY, and HAVING clauses Theme F uses. Assumed knowledge: basic descriptive statistics, mean, median, and standard deviation as ideas rather than formulas.

## About the examples

Every runnable example uses Python 3.14's standard library only: `csv` for reading fixtures, `statistics` for summaries, `sqlite3` for joins, with the same SQL the catalog's existing Postgres toolchain runs. No example reaches the network; every fixture dataset is committed under the example's own directory. Sinar Abadi and every company, customer, and vendor in this course are fictional and labelled as such; determinism is the standing rule, so two runs print byte-identical output.

## References

- Python documentation, `csv` module: reader objects, Dialect handling, and newline guidance. Accessed 2026-10-21.
- Python documentation, `statistics` module: mean, median, mode, variance, stdev, quantiles, and correlation definitions. Accessed 2026-10-21.
- Python documentation, `sqlite3` module: in-memory databases, parameter substitution, and aggregate queries. Accessed 2026-10-21.
- SQLite documentation: SELECT, JOIN types, GROUP BY, and HAVING semantics exercised in Theme F. Accessed 2026-10-21.
- Legacy material this course migrates and re-verifies: data analytics legacy pages under `learn/legacy/software-engineering/data/analytics`. Accessed 2026-10-21; every fact mined from those pages was re-checked against the documentation above on the same date rather than copied as already correct.
