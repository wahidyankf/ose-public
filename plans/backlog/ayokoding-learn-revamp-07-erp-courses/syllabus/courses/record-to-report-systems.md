# Record to Report Systems (By Example)

**Course ID**: `record-to-report-systems` · **Format**: By Example.

**Scope note**: Covers how approved events become controlled period results: journals, accruals, allocations, reconciliations, close orchestration, and reporting packages. It excludes consolidation and currency (multi-company-and-multi-currency-erp).

**Short summary**: Record to report turns approved events into controlled period results.

## Why this exists · the big idea

- **The problem before the solution**: Manual journals and spreadsheets decide the numbers, so nobody can show how a reported figure was built.
- **Keep-this-if-you-forget-everything**: Every reported number traces back to approved entries, reconciliations, and a signed-off close.

## Learning objectives

After this course you can:

1. enforce maker-checker and limits on manual journals.
2. generate recurring and reversing entries from templates.
3. reconcile accounts by matching items and explain open differences.
4. run allocations and orchestrate close tasks with sign-off.
5. flag variances in a financial package and record post-close adjustments.

## Prerequisites

- **Prior courses**: `erp-subledger-to-gl-architecture`, `erp-fiscal-calendar-and-period-close`, `financial-statements-and-close-cycle`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Financial statements and the close cycle from the accounting courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 8 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `general-ledger-system-architecture`.
- **Outside this plan (must already be filled)**: `financial-statements-and-close-cycle`, `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about the close; thresholds and calendars are invented policy values.
- Python decimal documentation for exact amounts.

## Concepts

- **co-01 · journal-entry-workflow** — draft, review, approve, and post for manual journals.
- **co-02 · recurring-journal** — a template that generates entries each period.
- **co-03 · accrual** — an expense or revenue recognized before cash.
- **co-04 · allocation-journal** — spreading a cost across cost centers by a driver.
- **co-05 · account-reconciliation** — matching ledger items to external or subledger evidence.
- **co-06 · close-task-orchestration** — ordering close tasks, owners, and dependencies.
- **co-07 · trial-balance-review** — reviewing balances for sign and size.
- **co-08 · financial-package** — the set of statements and schedules produced at close.
- **co-09 · manual-journal-control** — limits and maker-checker on manual entries.
- **co-10 · suspense-account** — a temporary holding account that must clear.
- **co-11 · reclassification** — moving a balance between accounts with evidence.
- **co-12 · variance-analysis** — comparing actual to budget or prior period with thresholds.
- **co-13 · close-calendar-tracking** — tracking close days against a target.
- **co-14 · evidence-attachment** — linking supporting documents to entries.
- **co-15 · sign-off-chain** — preparer, reviewer, and approver records.
- **co-16 · post-close-adjustment** — a controlled change after the books are closed.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: The cycle is a chain of controlled steps (journal, accrue, allocate, reconcile, close, report), each shown as short runnable cases that build into a close workbench. By Example fits.

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

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 1 of 9 anchors; Python 3.14, standard library only (no lockfile) in 8 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Journals with control** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · maker-checker-journal** (Python 3.14) — post a manual journal only after a different approver signs, then verify the same user cannot approve their own.
- **Cluster: Recurring entries** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · recurring-template** (Python 3.14) — generate a monthly rent entry from a template, then verify twelve periods produce twelve balanced entries.
- **Cluster: Trial balance** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · tb-balances** (PostgreSQL 18) — compute a trial balance in SQL, then verify debits equal credits.

### Intermediate (28 examples)

- **Cluster: Accruals and reversals** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · accrual-reversal-pair** (Python 3.14) — post an accrual and its reversal, then verify the account nets to zero after the reversal period.
- **Cluster: Account reconciliation** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · recon-matching** (Python 3.14) — match ledger items to bank lines by amount and reference, then verify unmatched items are listed with age.
- **Cluster: Allocations** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · cost-allocation-run** (Python 3.14) — allocate shared cost to departments by headcount, then verify allocated amounts sum to the source.

### Advanced (25 examples)

- **Cluster: Close orchestration** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · close-task-graph** (Python 3.14) — run close tasks in dependency order, then verify a late task blocks only its dependents.
- **Cluster: Variance analysis** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · variance-flags** (Python 3.14) — flag accounts whose variance exceeds a threshold, then verify each flag carries its comparison basis.
- **Cluster: Post-close and sign-off** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · signoff-chain** (Python 3.14) — record preparer, reviewer, and approver sign-offs, then verify the package cannot publish until all three exist.

## Capstone spec

Build a record-to-report workbench with controlled journals, recurring entries, reconciliations, allocations, a close task graph, sign-offs, and a variance report tied to the subledger totals. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide whether a balance needs a reclassification; plan a close calendar; review a variance.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: enforce maker-checker; match a reconciliation; order close tasks.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Account names and amounts are invented; no real company figures.

## Lineage

- The archived syllabus file [record-to-report-systems](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/record-to-report-systems.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 3 of 5 (Business process cycles) · position 13 of 27.
- `skills/sharia-erp` — Phase 3 of 6 (Business process cycles) · position 13 of 30.
