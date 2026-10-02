---
name: pr-review-quality-gate
description: >-
  Judges one pull request or local commit range in at most three bounded review-and-repair cycles, and returns one
  advisory verdict.
when_to_use: >-
  Use only when someone explicitly asks for iterative review with fixes on a pull request or a local commit range.
---

# PR Review Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. Each audit is one
[PR Review](pr-review.md) pass, and this file never restates how a pass runs.

## Entry

The gate starts only on an explicit request that names it, which a plan step may record as its source. No workflow calls
it. Risk, size, changed paths, and delivery mode never start it, and no change is blocked for lacking a run.

## Inputs

| Input        | Type    | Values                                                    | Default  |
| ------------ | ------- | --------------------------------------------------------- | -------- |
| `subject`    | string  | A pull request, or a base and head ref pinned to a commit | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`                          | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                                | 3        |

The surface follows [Review Surface](pr-review-quality-gate/001-review-surface.md). No record or authorization raises
`max-cycles` above 3. Any other value, or a missing subject, refuses to start.

## Deterministic Boundary

The checker reports none of these properties. The pipeline on the exact head runs their owners.

| Property                                         | Owned by                  | This repository runs                   |
| ------------------------------------------------ | ------------------------- | -------------------------------------- |
| Markdown formatting and lint                     | the formatter and linter  | `format-staged`, `markdownlint`        |
| Front matter                                     | the metadata validator    | `md-frontmatter`                       |
| Adapters match their canonical definitions       | the adapter validator     | `harness-adapters`                     |
| Vendor names in governance                       | the vendor-term validator | `governance-vendor`                    |
| Secrets and private references                   | the outbound leak screen  | `public-safety-*`                      |
| Build, unit tests, and lint of affected projects | the Nx targets            | `nx affected -t build,test:quick,lint` |

These pass to each pass as its delegated checks. The leak screen's judgement stays with [PR Leak
Review](pr-leak-review.md). No declared gate here runs the internal-link or word-budget validator, so links, anchors,
and word budgets are judgeable.

## Cycle

Each cycle runs per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md):

1. **Audit.** `pr-review-checker` runs [PR Review](pr-review.md) on the live head, fanning out to the lens checkers its
   route selects, with a probe class no earlier cycle used as `angle` and the settled findings as `prior-findings`. A
   pass ending `failed` ends the run `BLOCKED` (unavailable); one ending `stale` ends it `BLOCKED` (input-changed).
2. **Repair.** [PR Review Propagation](pr-review-propagation.md), run by `pr-review-fixer`, answers every blocking row
   with a fix, a reasoned reject, or a deferral, per
   [Answering Findings](pr-review-quality-gate/002-answering-findings.md).
3. **Confirm the pipeline** on the writer's new head, with evidence bound to that revision, before the next audit. A
   failure is diagnosed at its cause, never rerun until green; a repair that caused it is reverted, its row
   `not-resolved`.

What makes an audit clean, and how a run ends at the ceiling, is in
[Clean Audits and the Ceiling](pr-review-quality-gate/003-clean-audits-and-the-ceiling.md).

## Termination

The contract's
[termination table](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md#termination)
applies unchanged. This gate adds no row.

## Verdict

| Verdict              | The caller                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| `PASS`               | records the verdict and continues                                                   |
| `PASS_WITH_FINDINGS` | records the verdict and the open non-blocking rows, and continues                   |
| `FAIL`               | gives each open blocking row an owner (idea brief, plan item, or issue), continues  |
| `BLOCKED`            | records the cause (tooling, input-changed, or unavailable), then acts as for `FAIL` |

A verdict is not merge readiness and never approves or blocks a merge. Committed repairs stand whatever the verdict.

## Ledger

`local-tmp/quality/pr-review/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). Each row
also carries its answer and cause tag, and the verdict block names each cycle's probe class. It is never committed.

## Example Usage

```text
Run pr-review-quality-gate on pull request 412.
Run pr-review-quality-gate on main..feature-tip with mode strict and max-cycles 2.
```

## Related Workflows

- [PR Review](pr-review.md) is the single pass each audit runs.
- [PR Leak Review](pr-leak-review.md) owns the leak screen, which this gate neither runs nor replaces.

## Modules

1. [Review Surface](pr-review-quality-gate/001-review-surface.md)
2. [Answering Findings](pr-review-quality-gate/002-answering-findings.md)
3. [Clean Audits and the Ceiling](pr-review-quality-gate/003-clean-audits-and-the-ceiling.md)
