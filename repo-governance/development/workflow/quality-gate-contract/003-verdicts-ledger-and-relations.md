---
description: >-
  Makes every quality-gate verdict advisory, fixes the uncommitted ledger's path and columns, moves human review outside
  the cycles, and relates gates to bounded convergence and to single-pass reviews.
when_to_use: >-
  Use when a caller receives a gate verdict, when writing or reading a gate ledger, when a family wants editorial
  review, or when deciding whether a judging workflow is a gate or a review.
---

# Verdicts, Ledger, and Relations

## Advisory Verdicts

A gate ends with one of four verdicts: `PASS`, `PASS_WITH_FINDINGS`, `FAIL`, or `BLOCKED`. None of them stops the
caller. The caller records the verdict and, for `FAIL` or `BLOCKED`, gives each open blocking row an owner: an idea
brief, a plan item, or an issue in the owning repository. Then it continues its own sequence.

Only deterministic tooling, such as a pre-commit hook, a hosted check, or a configured gate runner, can refuse a commit,
merge, or push. A plan that runs a gate writes one line in its delivery checklist, for example
`plan-quality-gate: PASS_WITH_FINDINGS (2 cycles, 3 LOW open)`, and commits no other gate evidence.

## Ledger

The ledger is written to `local-tmp/quality/<family>/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, inside the ignored scratch
directory that [Temporary Files](../../infra/temporary-files.md) designates. Nothing under
`local-tmp/quality/` is ever committed, and a gate writes no committed report.

| Column        | Holds                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| `id`          | Stable row ID                                                             |
| `path`        | Path and line                                                             |
| `finding`     | What is wrong                                                             |
| `criticality` | `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`                                    |
| `confidence`  | `HIGH` or `MEDIUM` once the writer rated the row; empty before            |
| `blocking`    | Whether the row meets the mode threshold                                  |
| `cycle`       | The cycle that found the row                                              |
| `status`      | `open`, `resolved`, `not-resolved`, `not-applicable`, or `needs-decision` |
| `evidence`    | What proves the status                                                    |

A verdict block closes the ledger. It records the verdict, the cycles used, and the entry and exit tooling results.

## Human Review

No cycle waits for a person. A family that benefits from editorial review offers it at two optional points only: before
cycle 1, to confirm the scope, or after the verdict, on the residual ledger.

## Relation to Bounded Convergence

Bounded Convergence keeps its loop register and ceiling scorecard for every repeated
operation that is not a gate: retries, polls, and worklists. A quality gate follows this contract instead. The catalog
fixes the gate ceiling at 3 cycles, and Bounded Convergence records that as its default for iterative gates.

## Single-Pass Reviews

A workflow that judges once and never loops stays a review, not a gate: for example `gherkin-implementation-review`,
`exploratory-usability-review`, `harness-parity-verification`, `pr-review`, `pr-leak-review`, and
`ux-review-fix-planning`. A review states its finite flow, and any repeat inside it, such as re-dispatching a reviewer,
stays within 3.

A judging workflow that does loop is a gate. It takes the name `<family>-quality-gate` and follows this contract.
