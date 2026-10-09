# Multi-company and Multi-currency ERP (By Example)

**Course ID**: `multi-company-and-multi-currency-erp` · **Format**: By Example.

**Scope note**: Shows how a system keeps legal-entity ownership clear, handles intercompany documents, and tracks transaction, functional, and reporting currency with rates, revaluation, and eliminations. It excludes consolidation theory (consolidation-and-multi-entity-accounting).

**Short summary**: Multi-entity ERP needs clear entity ownership and controlled currency handling.

## Why this exists · the big idea

- **The problem before the solution**: One company's data leaks into another, and one currency amount is stored where three are needed.
- **Keep-this-if-you-forget-everything**: Store the amounts you will be asked for, with the rate and its source, and keep entity scope on every record.

## Learning objectives

After this course you can:

1. scope master data and documents by legal entity.
2. store transaction, functional, and reporting amounts with the rate used.
3. look up rates by type and date with evidence of source.
4. create and match intercompany documents.
5. revalue open items, separate realized from unrealized differences, and produce eliminations.

## Prerequisites

- **Prior courses**: `record-to-report-systems`, `consolidation-and-multi-entity-accounting`, `just-enough-python`.
- **Assumed knowledge**: Consolidation and entity accounting from the accounting courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `multi-currency-accounting-and-fx-translation`.
- **Outside this plan (must already be filled)**: `consolidation-and-multi-entity-accounting`, `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- IFRS Foundation text of IAS 21 The Effects of Changes in Foreign Exchange Rates for the currency terms. Verify the definitions against the current text.
- Python decimal documentation for exact conversion.

## Concepts

- **co-01 · legal-entity** — a separately accountable company.
- **co-02 · company-code-scope** — the entity a record belongs to.
- **co-03 · shared-vs-entity-master** — master data shared across entities versus owned by one.
- **co-04 · intercompany-transaction** — a transaction between two entities of one group.
- **co-05 · intercompany-matching** — pairing the two sides and explaining differences.
- **co-06 · transaction-currency** — the currency of the document.
- **co-07 · functional-currency** — the currency of the entity's main economic environment.
- **co-08 · reporting-currency** — the currency of group reporting.
- **co-09 · exchange-rate-table** — rates by type, pair, and date.
- **co-10 · revaluation** — restating open foreign-currency items at a new rate.
- **co-11 · realized-vs-unrealized** — a settled difference versus a period-end difference.
- **co-12 · translation-vs-remeasurement** — converting statements versus restating monetary items.
- **co-13 · elimination-entry** — removing intragroup balances in consolidation.
- **co-14 · transfer-pricing-hook** — a price rule for intercompany sales.
- **co-15 · rounding-in-multi-currency** — residuals created when each leg is rounded.
- **co-16 · rate-source-evidence** — recording where a rate came from.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Entity scoping, currency roles, and revaluation are numeric and structural cases with checkable results, which By Example teaches as many short runs that end in eliminations.

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

- **Cluster: Entities and scope** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · entity-scoped-master** (Python 3.14) — scope a customer master to one entity and share another, then verify a query in entity B never returns entity A's private records.
- **Cluster: Currency roles** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · three-currency-amounts** (Python 3.14) — store transaction, functional, and reporting amounts, then verify each converts from the stored rate.
- **Cluster: Rate tables** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · rate-lookup-by-date-type** (Python 3.14) — look up a rate by type and date with a fallback rule, then verify a missing rate is an error, not a guess.

### Intermediate (28 examples)

- **Cluster: Intercompany documents** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · mirror-intercompany-invoice** (Python 3.14) — create a sales invoice and its mirror purchase invoice, then verify both reference one intercompany id.
- **Cluster: Matching** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · ic-match-differences** (Python 3.14) — match two intercompany sides with a rounding difference, then verify the difference is classified and owned.
- **Cluster: Revaluation** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · open-item-reval** (Python 3.14) — revalue an open receivable at period end, then verify the unrealized gain equals the rate change times the open amount.

### Advanced (25 examples)

- **Cluster: Realized differences** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · realized-fx-on-settlement** (Python 3.14) — settle a foreign invoice after a rate move, then verify the realized difference posts and the unrealized one reverses.
- **Cluster: Eliminations** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · ic-elimination-entries** (Python 3.14) — produce elimination entries for matched intercompany balances, then verify they net the group balance to zero.
- **Cluster: Rounding** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · currency-rounding-residual** (Python 3.14) — convert lines and the total separately, then verify the residual is assigned to a named account.

## Capstone spec

Build a multi-entity ledger with entity scoping, intercompany pairs, three currency amounts, rate evidence, revaluation, and elimination reports. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide where a currency amount is stored; explain an intercompany difference; plan period-end revaluation.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: look up a rate by date; match intercompany sides; separate realized from unrealized.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Rates in examples are fixed invented values, not market data.
- Currency codes use ISO 4217 codes or obviously invented ones.

## Lineage

- The archived syllabus file [multi-company-and-multi-currency-erp](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/multi-company-and-multi-currency-erp.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 5 of 5 (Extending and operating the ERP) · position 25 of 27.
- `skills/sharia-erp` — Phase 5 of 6 (Extending and operating the ERP) · position 25 of 30.
