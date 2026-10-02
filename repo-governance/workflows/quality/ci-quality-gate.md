---
name: ci-quality-gate
description: >-
  Judges a repository's pipeline definitions and local hook wiring against the adopted pipeline standards in at most
  three bounded cycles, and returns one advisory verdict.
when_to_use: >-
  Use after adding a project or changing pipeline infrastructure, before a major release, or as a periodic compliance
  check of a repository's hooks and hosted pipeline.
---

# CI Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to pipelines.

## Entry

The gate starts only on an explicit request that names it. No workflow calls it.

## Inputs

| Input        | Type    | Values                               | Default  |
| ------------ | ------- | ------------------------------------ | -------- |
| `subject`    | string  | `all` projects, or one named project | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`     | `normal` |
| `max-cycles` | integer | 1, 2, or 3                           | 3        |

The subject is the hosted pipeline definitions and the local hook wiring that run the repository's gates. A repository
without a remote has only its hooks, and they are the whole subject. Any other `max-cycles` value, or a missing subject,
refuses to start.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                    | Owned by                        | This repository runs               |
| ------------------------------------------- | ------------------------------- | ---------------------------------- |
| What each declared check proves             | that check, run by hook or host | every `repo-config.yml` gate entry |
| A hook runs the declared registry, in order | the gate runner                 | `rhino gate run --surface <hook>`  |
| Workflow syntax                             | the workflow linter             | `actionlint`                       |
| Markdown formatting and lint                | the formatter and linter        | `format-staged`, `markdownlint`    |

The checker audits how checks are declared and wired, and never reruns or imitates them. Evidence that a delegated check
passed on the current revision is consumed as it stands; missing or stale evidence stays `pending` and is not a finding.

## Cycle

Each cycle is one full audit by `ci-checker`, loading the `ci-standards` skill, and one repair by
[CI Propagation](ci-propagation.md), run by `ci-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The audit
judges the subject against the adopted standards:

- [Automated Quality Gates](../../development/quality/repository-validation.md): each check sits on the
  earliest surface able to see its problem;
- [CI Post-Push Verification](../../development/workflow/ci-post-push-verification.md): work stays open until the
  pipeline passes on the pushed commit, or the local replacement gate does where there is no remote;
- [CI Storage Budget](../../development/infra/ci-conventions.md): retention, caches, and stored output
  stay within a recorded budget; and
- [CI Workflow File Naming](../../development/infra/github-actions-workflow-naming.md), where its platform applies.

A repair that touches a delegated check's scope marks that check's evidence `pending` until it runs again.

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

No verdict stops the caller, and a pending delegated check never reads as a pass.

## Ledger

`local-tmp/quality/ci/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). The ledger
also records each delegated check as `verified`, `pending`, or `not-applicable`. It is never committed.

## Example Usage

```text
Run ci-quality-gate on subject all with mode strict after adding the billing service.
```

## Related Workflows

- [PR Review Quality Gate](pr-review-quality-gate.md) judges a whole change; this gate judges pipeline wiring only.
- [Plan Quality Gate](plan-quality-gate.md) is the gate for plans rather than pipelines.
