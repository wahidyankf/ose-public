---
description: "Run an explicitly requested, bounded maker-to-fixer PR-review cycle."
when_to_use: "Use only when a user explicitly requests iterative semantic PR review."
---

# PR-Review Maker→Fixer Cycle Workflow

Run only on an explicit request for iterative semantic review. The cycle composes
[`pr-review`](./pr-review.md),
[`pr-review-fixer`](../../../.claude/agents/pr-review/pr-review-fixer.md), and exact-head CI; plans,
risk, content type, and delivery mode never invoke it. It delegates focused leak predicates to
[`pr-leak-review`](./pr-leak-review.md).

Cycle status is not merge readiness. Default integration remains exact-head/base
`pr-quality-gate.yml`, focused leak evidence, and applicable surface gates.

## Goal and Termination

**Goal**: Compose single PR-review passes with fixer and exact-head CI steps until the configured clean-streak exit or ceiling

**Termination**: Return done after two authenticated consecutive clean pass credits under different probes; return blocked at the configured ceiling or on unrecoverable evidence failure

## Inputs

- **`pr`** (string, required) — PR number or URL identifying the pull request under review
- **`cycles`** (number, optional, default `5`) — Maximum passes; default five; higher requires the PR's durable extension record
- **`leak-review-evidence`** (string, optional, default `pending`) — Authenticated current-head focused leak evidence consumed by every composed pass

## Outputs

- **`final-status`** (enum: done, blocked) — Cycle result; never a universal merge precondition
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`passes-completed`** (number) — Number of single passes invoked
- **`unresolved-threads`** (number) — Unresolved review threads when the cycle stopped

## Contents

- [Purpose and Execution Mode](./pr-review-cycle/purpose-and-execution-mode.md) — invocation and sequencing.
- [Participants](./pr-review-cycle/participants.md) — pass and fixer roles.
- [Loop Algorithm](./pr-review-cycle/loop-algorithm.md) — bounded composition.
- [Cycle Recovery](./pr-review-cycle/cycle-authority-and-restart-recovery.md) — durable state.
- [Cycle Record Authentication](./pr-review-cycle/cycle-record-authentication.md) — API provenance.
- [Cycle Credit](./pr-review-cycle/cycle-non-credit-record.md) — clean and stale credit.
- [Sibling Handoff](./pr-review-cycle/sibling-handoff-record.md) — successor record.
- [Pipeline Diagrams](./pr-review-cycle/pipeline-diagrams.md) — optional-cycle sequence.
- [GitHub Reviews API, Part 1](./pr-review-cycle/github-reviews-api-mechanics-review-posting.md) — posting mechanics.
- [GitHub Reviews API, Part 2](./pr-review-cycle/github-reviews-api-mechanics-threads.md) — thread mechanics.
- [Review State](./pr-review-cycle/review-state-is-never-the-gate.md) — COMMENT-state rule.
- [Steps 0-1](./pr-review-cycle/steps-0-1-resolve-and-review.md) — resolve and review.
- [Step 2](./pr-review-cycle/step-2-pass-result.md) — authenticate pass output.
- [Steps 3-5](./pr-review-cycle/steps-3-5-fixer-ci-and-done.md) — fix, CI, and exit.
- [Done Definition](./pr-review-cycle/route-specific-done-definition.md) — cycle-local exit.
- [Loop Exit](./pr-review-cycle/loop-exit-and-block-rules.md) — ceiling rules.
- [Convergence](./pr-review-cycle/convergence-measurement.md) — cause tags.
- [Probe Variation](./pr-review-cycle/probe-variation-and-exit.md) — clean-streak probes.
- [Restatement by Value](./pr-review-cycle/restatement-by-value.md) — duplicate facts.
- [Code-Related Scope](./pr-review-cycle/what-code-related-means.md) — finding qualifier.
- [Scope Deferral](./pr-review-cycle/scope-deferral-exit.md) — follow-up handling.
- [Scope Guard](./pr-review-cycle/scope-guard-no-scope-creep.md) — bounded scope.
- [Explicit Invocation](./pr-review-cycle/explicit-invocation.md) — applicability signal.
- [Related Workflows and Metrics](./pr-review-cycle/related-workflows-and-success-metrics.md) — composition and metrics.
- [Success Criteria](./pr-review-cycle/success-criteria.md) — observable exits.
- [Notes](./pr-review-cycle/notes.md) — operating notes.
- [Principles and Conventions](./pr-review-cycle/principles-and-conventions.md) — compliance.

## Example Usage

```text
Run pr-review-cycle for PR 412 with the default five-pass ceiling.
```
